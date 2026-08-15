'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MathCaptchaProps {
  onChallengeChange: (captchaId: string, answer: string) => void;
  disabled?: boolean;
}

export function MathCaptcha({ onChallengeChange, disabled }: MathCaptchaProps) {
  const [captchaId, setCaptchaId] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState('')
  const [loadError, setLoadError] = useState('')
  const [loadingChallenge, setLoadingChallenge] = useState(false)

  const loadChallenge = async () => {
    setLoadError('')
    setLoadingChallenge(true)
    setCaptchaId(null)
    setPrompt('')
    setAnswer('')
    onChallengeChange('', '')
    try {
      const res = await fetch('/api/captcha/challenge')
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
  }

  useEffect(() => {
    void loadChallenge()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswer = e.target.value
    setAnswer(newAnswer)
    if (captchaId) {
      onChallengeChange(captchaId, newAnswer)
    }
  }

  return (
    <div className="space-y-4">
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
              Verify it&apos;s you
            </Label>
            <Input
              id="captcha-answer"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Enter the number"
              value={answer}
              onChange={handleAnswerChange}
              className="bg-[#160f1c]/90 border-fuchsia-500/20 text-gray-100 focus-visible:ring-fuchsia-500/35"
              disabled={disabled}
              required
            />
          </div>
          <button
            type="button"
            className="text-xs text-fuchsia-400/90 hover:text-fuchsia-300 underline-offset-2 hover:underline disabled:opacity-50"
            onClick={() => void loadChallenge()}
            disabled={disabled || loadingChallenge}
          >
            New question
          </button>
        </>
      )}
    </div>
  )
}
