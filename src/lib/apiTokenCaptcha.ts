import crypto from 'crypto'

export type CaptchaChallenge = { answer: number; identifier: string; expires: number }

export const apiTokenCaptchaStore = new Map<string, CaptchaChallenge>()

const TTL_MS = 5 * 60 * 1000

function pruneExpired() {
  const now = Date.now()
  for (const [k, v] of apiTokenCaptchaStore.entries()) {
    if (v.expires < now) apiTokenCaptchaStore.delete(k)
  }
}

export function createMathCaptcha(identifier: string = 'public'): { id: string; prompt: string } {
  pruneExpired()
  const a = Math.floor(Math.random() * 12) + 1
  const b = Math.floor(Math.random() * 12) + 1
  const id = crypto.randomBytes(16).toString('hex')
  apiTokenCaptchaStore.set(id, {
    answer: a + b,
    identifier,
    expires: Date.now() + TTL_MS,
  })
  return { id, prompt: `What is ${a} + ${b}?` }
}

export function consumeCaptcha(
  captchaId: string,
  identifier: string = 'public',
  answerRaw: string
): { ok: true } | { ok: false; message: string } {
  pruneExpired()
  const challenge = apiTokenCaptchaStore.get(captchaId)
  if (!challenge || challenge.identifier !== identifier || challenge.expires < Date.now()) {
    return { ok: false, message: 'Invalid or expired captcha. Please try again.' }
  }
  const num = parseInt(String(answerRaw).trim(), 10)
  if (Number.isNaN(num) || num !== challenge.answer) {
    apiTokenCaptchaStore.delete(captchaId)
    return { ok: false, message: 'Incorrect answer. A new challenge will load if you try again.' }
  }
  apiTokenCaptchaStore.delete(captchaId)
  return { ok: true }
}
