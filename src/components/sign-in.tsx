'use client'
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import AlertBox from './alert-box'
import HCaptchaWidget from './hcaptcha-widget'

function LollipopIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 40 50" fill="none">
      <defs>
        <radialGradient id="siBall" cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="hsl(322,100%,88%)" />
          <stop offset="40%" stopColor="hsl(0,100%,62%)" />
          <stop offset="100%" stopColor="hsl(0,0%,40%)" />
        </radialGradient>
        <radialGradient id="siSwirl" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsla(322,100%,90%,0.5)" />
          <stop offset="100%" stopColor="hsla(0,0%,62%,0.25)" />
        </radialGradient>
        <linearGradient id="siStick" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(322,60%,55%)" />
          <stop offset="100%" stopColor="hsl(272,50%,45%)" />
        </linearGradient>
      </defs>
      <rect x="18" y="30" width="4" height="18" rx="2" fill="url(#siStick)" />
      <circle cx="20" cy="18" r="16" fill="url(#siBall)" />
      <path d="M20 4 Q28 10 28 18 Q28 26 20 30 Q14 26 12 18 Q12 10 20 4Z" fill="url(#siSwirl)" opacity="0.4" />
      <ellipse cx="14" cy="12" rx="4" ry="3" fill="white" opacity="0.25" transform="rotate(-30 14 12)" />
    </svg>
  )
}

export default function SignIn() {
  const { data: session } = useSession()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [hcaptchaToken, setHcaptchaToken] = useState('')

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!hcaptchaToken) {
      setError('Please complete hCaptcha verification')
      setLoading(false)
      return
    }

    try {
      const result = await signIn('credentials', {
        redirect: false,
        username,
        password,
        hcaptchaToken,
        totpCode,
      })

      if (result?.error) {
        if (result.error === 'USER_BANNED') {
          setError('Your account has been banned. Contact support.')
        } else if (result.error === 'TOTP_REQUIRED') {
          setError('2FA code required. Enter the code from your authenticator app.')
        } else if (result.error === 'TOTP_INVALID') {
          setError('Invalid 2FA code')
        } else if (result.error === 'CAPTCHA_INVALID') {
          setError('Captcha verification failed. Please try again.')
        } else {
          setError('Invalid username or password')
        }
      } else if (result?.ok) {
        setSuccess('Sign in successful! Redirecting...')
        router.push('/dashboard')
      } else {
        setError('Invalid username or password')
      }
    } catch (err) {
      // This catches the "URL constructor: undefined is not a valid URL" crash
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: 'hsla(270,45%,8%,0.90)',
    border: '1px solid hsla(0,100%,62%,0.14)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    height: 48,
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#08000f' }}>
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[140px] pointer-events-none" style={{ background: 'hsla(0,100%,62%,0.18)' }} />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[140px] pointer-events-none" style={{ background: 'hsla(0,0%,62%,0.12)' }} />
      <motion.div
        className="w-full max-w-[420px] z-10"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="p-px rounded-2xl" style={{ background: 'linear-gradient(135deg,hsla(0,100%,62%,0.40),hsla(0,0%,62%,0.20),hsla(0,100%,62%,0.08))' }}>
          <div className="rounded-2xl relative" style={{ background: 'hsla(270,45%,5%,0.96)', backdropFilter: 'blur(28px)', overflow: 'hidden' }}>
            <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,hsl(0,100%,62%),hsl(0,0%,62%),transparent)' }} />
            <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,hsla(0,100%,80%,0.45),transparent)' }} />
            <div className="absolute inset-x-0 top-0 h-36 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%,hsla(0,100%,62%,0.08),transparent 70%)' }} />
            <div className="pt-10 pb-7 px-8 text-center space-y-3">
              <motion.div
                className="flex items-center justify-center mb-4"
                initial={{ y: -16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 blur-2xl rounded-full opacity-50" style={{ background: 'hsl(0,100%,62%)' }} />
                  <div className="relative p-3 rounded-2xl" style={{
                    background: 'hsla(0,100%,62%,0.10)',
                    border: '1px solid hsla(0,100%,62%,0.28)',
                    boxShadow: '0 0 24px -6px hsla(0,100%,62%,0.45)',
                  }}>
                    <LollipopIcon size={38} />
                  </div>
                </div>
              </motion.div>
              <h1 className="text-3xl font-black tracking-tight"
                style={{ backgroundImage: 'linear-gradient(160deg,#fff 0%,rgba(255,255,255,0.65) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Welcome Back
              </h1>
              <p className="text-sm font-medium" style={{ color: 'hsla(0,0%,100%,0.38)' }}>
                Access the power of{' '}
                <span className="font-black"
                  style={{ backgroundImage: 'linear-gradient(135deg,hsl(0,100%,68%),hsl(0,0%,68%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  JokerSTRESS
                </span>
              </p>
            </div>
            <form onSubmit={handleSignIn}>
              <div className="px-8 space-y-4 pb-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'hsla(0,0%,100%,0.35)' }}>Username</Label>
                  <Input
                    type="text"
                    placeholder="Enter your username"
                    style={inputStyle}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'hsla(0,0%,100%,0.35)' }}>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      style={{ ...inputStyle, paddingRight: 48 }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors"
                      style={{ color: 'hsla(0,0%,100%,0.25)' }}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'hsla(0,0%,100%,0.35)' }}>2FA Code <span className="normal-case font-medium tracking-normal" style={{ color: 'hsla(0,0%,100%,0.18)' }}>(if enabled)</span></Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    style={inputStyle}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                  />
                </div>
                <div className="flex flex-col items-center gap-3 py-3 rounded-2xl"
                  style={{ background: 'hsla(0,100%,62%,0.04)', border: '1px solid hsla(0,100%,62%,0.10)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(142,71%,55%)', boxShadow: '0 0 8px hsl(142,71%,55%)' }} />
                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'hsla(0,0%,100%,0.28)' }}>Bot Protection Active</span>
                  </div>
                  <HCaptchaWidget onVerify={setHcaptchaToken} onExpire={() => setHcaptchaToken('')} />
                </div>
              </div>
              <div className="px-8 pt-5 pb-8 space-y-3">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02, boxShadow: loading ? 'none' : '0 0 28px -6px hsla(0,100%,62%,0.65)' }}
                  whileTap={{ scale: loading ? 1 : 0.97 }}
                  className="relative w-full h-12 rounded-xl font-black text-[11px] uppercase tracking-widest text-white overflow-hidden"
                  style={{
                    background: loading ? 'hsla(0,100%,62%,0.40)' : 'linear-gradient(135deg,hsl(0,100%,57%),hsl(0,0%,54%))',
                    boxShadow: loading ? 'none' : '0 0 22px -6px hsla(0,100%,62%,0.50)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)' }} />
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing In...
                    </span>
                  ) : 'Access Dashboard'}
                </motion.button>
                <p className="text-xs text-center font-medium" style={{ color: 'hsla(0,0%,100%,0.30)' }}>
                  New to the platform?{' '}
                  <Link href="/signup" className="font-black transition-colors" style={{ color: 'hsl(0,100%,68%)' }}>
                    Join Now
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
      {error && <AlertBox message={error} type="error" onClose={() => setError('')} />}
      {success && <AlertBox message={success} type="success" onClose={() => setSuccess('')} />}
    </div>
  )
}