'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MathCaptcha } from './math-captcha'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerify: (captchaId: string, answer: string) => Promise<void>
  disabled?: boolean
  title?: string
  description?: string
}

export function VerifyCaptchaDialog({
  open,
  onOpenChange,
  onVerify,
  disabled,
  title = "Verify it's you",
  description = "Solve the quick check below to continue.",
}: Props) {
  const [captchaId, setCaptchaId] = useState('')
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaId || !answer || disabled) return
    setSubmitting(true)
    try {
      await onVerify(captchaId, answer)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sm:max-w-[420px] joker-card text-gray-100 border-fuchsia-500/20')}>
        <DialogHeader>
          <DialogTitle className="joker-text-soft">{title}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <MathCaptcha 
            onChallengeChange={(id, ans) => {
              setCaptchaId(id)
              setAnswer(ans)
            }}
            disabled={submitting || disabled} 
          />

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              className="bg-[#160f1c] text-gray-300 border-gray-600 hover:bg-[#2a1f35] hover:text-white"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="joker-btn rounded-md" disabled={submitting || disabled || !captchaId || !answer}>
              {submitting ? 'Verifying…' : 'Continue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
