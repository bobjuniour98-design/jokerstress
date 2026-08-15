'use client'

import { useState, useEffect, useRef } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import AlertBox from './alert-box'
import HCaptchaWidget, { HCaptchaWidgetHandle } from './hcaptcha-widget'

function LollipopIcon({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="suBall" cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="hsl(322,100%,88%)" />
          <stop offset="40%" stopColor="hsl(0,100%,62%)" />
          <stop offset="100%" stopColor="hsl(0,0%,40%)" />
        </radialGradient>
        <radialGradient id="suShine" cx="33%" cy="25%" r="38%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <linearGradient id="suStick" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(322,70%,40%)" />
          <stop offset="50%" stopColor="hsl(322,80%,60%)" />
          <stop offset="100%" stopColor="hsl(272,70%,48%)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="18" r="16" fill="url(#suBall)" />
      <circle cx="20" cy="18" r="16" fill="url(#suShine)" />
      <path d="M7 12 Q20 7 33 15" stroke="rgba(255,255,255,0.22)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M5 19 Q20 14 35 22" stroke="rgba(255,255,255,0.16)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <rect x="18.5" y="33" width="3" height="15" rx="1.5" fill="url(#suStick)" />
    </svg>
  )
}

export default function SignUp() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hcaptchaToken, setHcaptchaToken] = useState('')
  const hcaptchaTokenRef = useRef('')
  const hcaptchaRef = useRef<HCaptchaWidgetHandle>(null)

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
    const ref = searchParams?.get('ref')
    if (ref) {
      setReferralCode(ref)
    }
  }, [session, router, searchParams])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const token = hcaptchaTokenRef.current || hcaptchaToken

    if (!username || !password || !token) {
      setError('All fields, including hCaptcha verification, are required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const response = await axios.post('/api/auth/register', {
        username,
        password,
        hcaptchaToken: token,
        referralCode: referralCode || undefined,
      })

      if (response.data.success) {
        const signInResponse = await signIn('credentials', {
          redirect: false,
          username,
          password,
          hcaptchaToken: token,
        })

        if (signInResponse?.error) {
          const errorMsg = signInResponse.error === 'CAPTCHA_INVALID'
            ? 'Please complete hCaptcha verification again to sign in.'
            : signInResponse.error === 'TOTP_REQUIRED'
            ? '2FA code required. Sign in from the login page.'
            : signInResponse.error === 'CredentialsSignin'
            ? 'Invalid username or password.'
            : signInResponse.error
          setError(typeof errorMsg === 'string' ? errorMsg : 'Sign in failed. Please try the login page.')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError(response.data.message || 'An error occurred.')
        hcaptchaRef.current?.reset()
        setHcaptchaToken('')
        hcaptchaTokenRef.current = ''
      }
    } catch (err) {
      hcaptchaRef.current?.reset()
      setHcaptchaToken('')
      hcaptchaTokenRef.current = ''
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'An error occurred.')
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setIsLoading(false)
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
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ background: 'hsla(0,100%,62%,0.18)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ background: 'hsla(0,0%,62%,0.12)' }} />

      <motion.div
        className="w-full max-w-[420px] z-10"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="p-px rounded-2xl" style={{ background: 'linear-gradient(135deg,hsla(0,100%,62%,0.40),hsla(0,0%,62%,0.20),hsla(0,100%,62%,0.08))' }}>
          <div className="rounded-2xl relative" style={{ background: 'hsla(270,45%,5%,0.96)', backdropFilter: 'blur(28px)', overflow: 'hidden' }}>
            <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,hsl(0,0%,62%),hsl(0,100%,62%),transparent)' }} />
            <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,hsla(0,100%,80%,0.45),transparent)' }} />
            <div className="absolute inset-x-0 top-0 h-36 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%,hsla(0,0%,62%,0.07),transparent 70%)' }} />
            <div className="pt-10 pb-7 px-8 text-center space-y-3">
              <motion.div
                className="flex items-center justify-center mb-4"
                initial={{ y: -16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 blur-2xl rounded-full opacity-45" style={{ background: 'hsl(0,0%,62%)' }} />
                  <div className="relative p-3 rounded-2xl" style={{
                    background: 'hsla(0,0%,62%,0.10)',
                    border: '1px solid hsla(0,0%,62%,0.25)',
                    boxShadow: '0 0 24px -6px hsla(0,0%,62%,0.45)',
                  }}>
                    <LollipopIcon className="h-10 w-10" />
                  </div>
                </div>
              </motion.div>

              <h1 className="text-3xl font-black tracking-tight"
                style={{ backgroundImage: 'linear-gradient(160deg,#fff 0%,rgba(255,255,255,0.65) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Create Account
              </h1>
              <p className="text-sm font-medium" style={{ color: 'hsla(0,0%,100%,0.38)' }}>
                Join the elite force at{' '}
                <span className="font-black"
                  style={{ backgroundImage: 'linear-gradient(135deg,hsl(0,100%,68%),hsl(0,0%,68%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  JokerSTRESS
                </span>
              </p>
            </div>
            <form onSubmit={handleSignUp}>
              <div className="px-8 space-y-4 pb-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'hsla(0,0%,100%,0.35)' }}>Username</Label>
                  <Input
                    type="text"
                    placeholder="Choose a username"
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
                      placeholder="Create a strong password"
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
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'hsla(0,0%,100%,0.35)' }}>
                    Referral Code{' '}
                    <span className="normal-case font-medium tracking-normal" style={{ color: 'hsla(0,0%,100%,0.18)' }}>(Optional)</span>
                  </Label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10" style={{ color: 'hsla(0,100%,62%,0.50)' }} />
                    <Input
                      type="text"
                      placeholder="Enter referral code"
                      style={{ ...inputStyle, paddingLeft: 40 }}
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 py-3 rounded-2xl"
                  style={{ background: 'hsla(0,0%,62%,0.04)', border: '1px solid hsla(0,0%,62%,0.10)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: 'hsl(0,100%,62%)' }} />
                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'hsla(0,0%,100%,0.28)' }}>Biometric Checkpoint</span>
                  </div>
                  <HCaptchaWidget
                    ref={hcaptchaRef}
                    onVerify={(t) => { hcaptchaTokenRef.current = t; setHcaptchaToken(t) }}
                    onExpire={() => { hcaptchaTokenRef.current = ''; setHcaptchaToken('') }}
                  />
                </div>
              </div>

              <div className="px-8 pt-5 pb-8 space-y-3">
                <motion.button
                  type="submit"
                  disabled={isLoading || !(hcaptchaTokenRef.current || hcaptchaToken)}
                  whileHover={{ scale: isLoading ? 1 : 1.02, boxShadow: '0 0 28px -6px hsla(0,100%,62%,0.65)' }}
                  whileTap={{ scale: isLoading ? 1 : 0.97 }}
                  className="relative w-full h-12 rounded-xl font-black text-[11px] uppercase tracking-widest text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg,hsl(0,100%,57%),hsl(0,0%,54%))',
                    boxShadow: '0 0 22px -6px hsla(0,100%,62%,0.50)',
                  }}
                >
                  <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)' }} />
                  {isLoading ? 'Initializing...' : 'Create Account'}
                </motion.button>

                <p className="text-xs text-center font-medium" style={{ color: 'hsla(0,0%,100%,0.30)' }}>
                  Already part of the network?{' '}
                  <Link href="/signin" className="font-black transition-colors" style={{ color: 'hsl(0,100%,68%)' }}>
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </motion.div>

      {error && <AlertBox message={error} type="error" onClose={() => setError('')} />}
    </div>
  )
}
