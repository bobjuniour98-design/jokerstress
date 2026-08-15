'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTokenGenerated: (apiToken: string) => void
  disabled?: boolean
}

export function GenerateApiTokenCaptchaDialog({
  open,
  onOpenChange,
  onTokenGenerated,
  disabled,
}: Props) {
  const [captchaId, setCaptchaId] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState('')
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [loadingChallenge, setLoadingChallenge] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadChallenge = useCallback(async () => {
    setLoadError('')
    setFormError('')
    setLoadingChallenge(true)
    setCaptchaId(null)
    setPrompt('')
    setAnswer('')
    try {
      const res = await fetch('/api/api-token/captcha-challenge')
      const data = await res.json()
      if (!res.ok) {
        setLoadError(data.message || 'Could not load captcha.')
        return
      }
      setCaptchaId(data.captchaId)
      setPrompt(data.prompt)
    } catch {
      setLoadError('Network error. Try again.')
    } finally {
      setLoadingChallenge(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    void loadChallenge()
  }, [open, loadChallenge])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaId || disabled) return
    setFormError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/api-token/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captchaId, captchaAnswer: answer }),
      })
      const data = await res.json()
      if (res.ok && data.apiToken) {
        onTokenGenerated(data.apiToken)
        onOpenChange(false)
        setAnswer('')
        setCaptchaId(null)
        setPrompt('')
        return
      }
      setFormError(data.message || 'Generation failed.')
      await loadChallenge()
    } catch {
      setFormError('Something went wrong.')
      await loadChallenge()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sm:max-w-[420px] joker-card text-gray-100 border-fuchsia-500/20')}>
        <DialogHeader>
          <DialogTitle className="joker-text-soft">Verify it&apos;s you</DialogTitle>
          <DialogDescription className="text-gray-400">
            Solve the quick check below. Your API token is only created after a correct answer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loadError ? (
            <p className="text-sm text-red-400">{loadError}</p>
          ) : loadingChallenge ? (
            <p className="text-sm text-gray-400">Loading challenge…</p>
          ) : (
            <>
              <div
                className="rounded-lg border border-fuchsia-500/25 bg-[#160f1c]/80 px-4 py-3 text-center text-lg font-semibold tracking-wide joker-text-soft"
                aria-live="polite"
              >
                {prompt}
              </div>
              <div className="space-y-2">
                <Label htmlFor="captcha-answer" className="text-gray-300">
                  Your answer
                </Label>
                <Input
                  id="captcha-answer"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Enter the number"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="bg-[#160f1c]/90 border-fuchsia-500/20 text-gray-100 focus-visible:ring-fuchsia-500/35"
                  disabled={submitting || disabled}
                />
              </div>
              {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
              <button
                type="button"
                className="text-xs text-fuchsia-400/90 hover:text-fuchsia-300 underline-offset-2 hover:underline disabled:opacity-50"
                onClick={() => void loadChallenge()}
                disabled={submitting || loadingChallenge}
              >
                New question
              </button>
            </>
          )}

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="bg-[#160f1c] text-gray-300 border-gray-600 hover:bg-[#2a1f35] hover:text-white"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="joker-btn rounded-md" disabled={submitting || disabled || loadingChallenge || !!loadError || !captchaId}>
              {submitting ? 'Generating…' : 'Verify & generate token'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
