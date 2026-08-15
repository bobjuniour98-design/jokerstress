'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff, Shield, KeyRound, Smartphone, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Menu from '@/components/menu'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

function JokerBar() {
  return (
    <>
      <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,hsl(0,100%,62%),hsl(0,0%,62%),transparent)' }} />
      <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,hsla(0,100%,80%,0.30),transparent)' }} />
    </>
  )
}

function SectionLabel({ icon: Icon, title, subtitle, badge, badgeActive }: {
  icon: React.ElementType
  title: string
  subtitle: string
  badge?: string
  badgeActive?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: '1px solid hsla(0,100%,62%,0.08)' }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'hsla(0,100%,62%,0.08)', border: '1px solid hsla(0,100%,62%,0.16)' }}>
          <Icon className="h-4 w-4" style={{ color: 'hsl(0,100%,62%)' }} />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-white">{title}</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'hsla(0,0%,100%,0.28)' }}>{subtitle}</p>
        </div>
      </div>
      {badge && (
        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
          style={badgeActive ? {
            background: 'hsla(142,71%,55%,0.12)',
            border: '1px solid hsla(142,71%,55%,0.25)',
            color: 'hsl(142,71%,60%)',
          } : {
            background: 'hsla(0,0%,100%,0.04)',
            border: '1px solid hsla(0,0%,100%,0.08)',
            color: 'hsla(0,0%,100%,0.30)',
          }}>
          {badge}
        </span>
      )}
    </div>
  )
}

export default function ChangePassword() {
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const [twoFaEnabled, setTwoFaEnabled] = useState(false)
  const [twoFaPending, setTwoFaPending] = useState(false)
  const [twoFaSecret, setTwoFaSecret] = useState('')
  const [twoFaOtpAuthUrl, setTwoFaOtpAuthUrl] = useState('')
  const [twoFaCode, setTwoFaCode] = useState('')
  const [twoFaLoading, setTwoFaLoading] = useState(false)
  const router = useRouter()

  const fetchTwoFaStatus = async () => {
    try {
      const res = await fetch('/api/auth/2fa/status')
      const data = await res.json()
      if (res.ok) {
        setTwoFaEnabled(Boolean(data.enabled))
        setTwoFaPending(Boolean(data.hasPendingSetup))
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    void fetchTwoFaStatus()
  }, [])

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match')
      setMessageType('error')
      return
    }
    setIsLoading(true)
    setMessage('')
    setMessageType('')
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword }),
    })
    const data = await res.json()
    setIsLoading(false)
    if (res.ok) {
      setMessage('Password updated successfully')
      setMessageType('success')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      setMessage(data.message || 'Password update failed')
      setMessageType('error')
    }
  }

  const handleDeleteAccount = async () => {
    const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.')
    if (confirmDelete) {
      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' })
      if (res.ok) {
        router.push('/signin')
      } else {
        const data = await res.json()
        setMessage(data.message || 'Account deletion failed')
        setMessageType('error')
      }
    }
  }

  const handleStartTwoFaSetup = async () => {
    setTwoFaLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setTwoFaSecret(data.secret)
        setTwoFaOtpAuthUrl(data.otpauthUrl)
        setTwoFaPending(true)
        setMessage('2FA setup created. Add the key to your authenticator, then verify with a code below.')
        setMessageType('success')
      } else {
        setMessage(data.message || 'Could not start 2FA setup')
        setMessageType('error')
      }
    } finally {
      setTwoFaLoading(false)
    }
  }

  const handleEnableTwoFa = async () => {
    if (!twoFaCode.trim()) {
      setMessage('Enter your authenticator code')
      setMessageType('error')
      return
    }
    setTwoFaLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFaCode }),
      })
      const data = await res.json()
      if (res.ok) {
        setTwoFaEnabled(true)
        setTwoFaPending(false)
        setTwoFaSecret('')
        setTwoFaOtpAuthUrl('')
        setTwoFaCode('')
        setMessage('2FA enabled successfully')
        setMessageType('success')
      } else {
        setMessage(data.message || 'Could not enable 2FA')
        setMessageType('error')
      }
    } finally {
      setTwoFaLoading(false)
    }
  }

  const handleDisableTwoFa = async () => {
    if (!twoFaCode.trim()) {
      setMessage('Enter your current 2FA code to disable')
      setMessageType('error')
      return
    }
    setTwoFaLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFaCode }),
      })
      const data = await res.json()
      if (res.ok) {
        setTwoFaEnabled(false)
        setTwoFaPending(false)
        setTwoFaCode('')
        setMessage('2FA disabled successfully')
        setMessageType('success')
      } else {
        setMessage(data.message || 'Could not disable 2FA')
        setMessageType('error')
      }
    } finally {
      setTwoFaLoading(false)
    }
  }

  const cardStyle: React.CSSProperties = {
    background: 'hsla(270,45%,5%,0.82)',
    border: '1px solid hsla(0,100%,62%,0.10)',
    backdropFilter: 'blur(16px)',
    borderRadius: 18,
    overflow: 'hidden',
  }

  const inputStyle: React.CSSProperties = {
    background: 'hsla(270,45%,8%,0.80)',
    border: '1px solid hsla(0,100%,62%,0.13)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#08000f' }}>
      <div className="fixed top-[-12%] left-[-8%] w-[55%] h-[55%] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,hsla(0,100%,62%,0.11) 0%,transparent 70%)', filter: 'blur(80px)', animation: 'pulse 6s ease-in-out infinite' }} />
      <div className="fixed bottom-[-12%] right-[-8%] w-[55%] h-[55%] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,hsla(0,0%,62%,0.09) 0%,transparent 70%)', filter: 'blur(80px)', animation: 'pulse 8s ease-in-out infinite 2s' }} />

      <Menu />

      <main className="max-w-5xl mx-auto px-6 py-14 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14 space-y-5"
        >
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-12" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,62%,0.50))' }} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: 'hsla(0,100%,62%,0.70)' }}>
              Account Settings
            </span>
            <div className="h-px w-12" style={{ background: 'linear-gradient(90deg,hsla(0,100%,62%,0.50),transparent)' }} />
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-[-0.04em] uppercase leading-none"
            style={{ backgroundImage: 'linear-gradient(160deg,#ffffff 0%,rgba(255,255,255,0.40) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Security{' '}
            <span style={{ backgroundImage: 'linear-gradient(135deg,hsl(0,100%,68%) 0%,hsl(0,0%,68%) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Console
            </span>
          </h1>
          <p className="text-sm font-medium max-w-sm mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Manage your authentication credentials and two-factor protection.
          </p>
        </motion.div>
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-center"
              style={messageType === 'success' ? {
                background: 'hsla(142,71%,55%,0.10)',
                border: '1px solid hsla(142,71%,55%,0.22)',
                color: 'hsl(142,71%,60%)',
              } : {
                background: 'hsla(0,100%,62%,0.08)',
                border: '1px solid hsla(0,100%,62%,0.20)',
                color: 'hsl(0,100%,68%)',
              }}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.10, duration: 0.50, ease: [0.22, 1, 0.36, 1] }}
            style={cardStyle}
          >
            <JokerBar />
            <SectionLabel
              icon={KeyRound}
              title="Security Protocol"
              subtitle="Update authentication credentials"
            />

            <div className="p-7 space-y-5">
              {[
                { label: 'Current Password', value: oldPassword, setter: setOldPassword, show: showOldPassword, toggle: () => setShowOldPassword(!showOldPassword) },
                { label: 'New Password',     value: newPassword, setter: setNewPassword, show: showNewPassword, toggle: () => setShowNewPassword(!showNewPassword) },
                { label: 'Verify Password',  value: confirmPassword, setter: setConfirmPassword, show: showConfirmPassword, toggle: () => setShowConfirmPassword(!showConfirmPassword) },
              ].map(({ label, value, setter, show, toggle }) => (
                <div key={label} className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'hsla(0,0%,100%,0.35)' }}>{label}</Label>
                  <div className="relative">
                    <Input
                      type={show ? 'text' : 'password'}
                      className="h-12 pr-12"
                      style={inputStyle}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                      style={{ color: 'hsla(0,0%,100%,0.30)' }}
                      onClick={toggle}
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex flex-col gap-3 pt-3">
                <motion.button
                  whileHover={{ scale: isLoading ? 1 : 1.02, boxShadow: '0 0 28px -6px hsla(0,100%,62%,0.60)' }}
                  whileTap={{ scale: isLoading ? 1 : 0.97 }}
                  className="relative w-full h-11 rounded-xl font-black text-[11px] uppercase tracking-widest text-white overflow-hidden"
                  style={{
                    background: isLoading ? 'hsla(0,100%,62%,0.40)' : 'linear-gradient(135deg,hsl(0,100%,57%),hsl(0,0%,54%))',
                    boxShadow: isLoading ? 'none' : '0 0 20px -6px hsla(0,100%,62%,0.45)',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                  }}
                  onClick={handleChangePassword}
                  disabled={isLoading}
                >
                  <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)' }} />
                  {isLoading ? 'Updating...' : 'Update Credentials'}
                </motion.button>

                <button
                  className="w-full h-11 font-black text-[11px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                  style={{ background: 'transparent', border: '1px solid hsla(0,84%,60%,0.22)', color: 'hsl(0,84%,65%)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'hsla(0,84%,60%,0.08)'; e.currentTarget.style.borderColor = 'hsla(0,84%,60%,0.40)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'hsla(0,84%,60%,0.22)' }}
                  onClick={handleDeleteAccount}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Purge Account
                </button>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.20, duration: 0.50, ease: [0.22, 1, 0.36, 1] }}
            style={{
              ...cardStyle,
              border: twoFaEnabled ? '1px solid hsla(0,100%,62%,0.16)' : '1px solid hsla(0,100%,62%,0.10)',
            }}
          >
            <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,hsl(0,0%,62%),hsl(0,100%,62%),transparent)' }} />
            <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,hsla(0,0%,80%,0.30),transparent)' }} />
            <SectionLabel
              icon={Smartphone}
              title="2FA Security"
              subtitle="Authenticator app protection"
              badge={twoFaEnabled ? 'Enabled' : 'Disabled'}
              badgeActive={twoFaEnabled}
            />

            <div className="p-7 space-y-4">
              {!twoFaEnabled && !twoFaPending && (
                <motion.button
                  whileHover={{ scale: twoFaLoading ? 1 : 1.02, boxShadow: '0 0 28px -6px hsla(0,100%,62%,0.60)' }}
                  whileTap={{ scale: twoFaLoading ? 1 : 0.97 }}
                  className="relative w-full h-11 rounded-xl font-black text-[11px] uppercase tracking-widest text-white overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg,hsl(0,100%,57%),hsl(0,0%,54%))',
                    boxShadow: '0 0 20px -6px hsla(0,100%,62%,0.45)',
                    cursor: twoFaLoading ? 'not-allowed' : 'pointer',
                    opacity: twoFaLoading ? 0.6 : 1,
                  }}
                  onClick={handleStartTwoFaSetup}
                  disabled={twoFaLoading}
                >
                  <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)' }} />
                  {twoFaLoading ? 'Preparing...' : 'Setup 2FA'}
                </motion.button>
              )}

              {(twoFaPending || twoFaEnabled) && (
                <div className="space-y-4">
                  {twoFaPending && twoFaSecret && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'hsla(0,0%,100%,0.35)' }}>Manual Key</Label>
                      <Input
                        readOnly
                        value={twoFaSecret}
                        className="h-12 font-mono text-xs"
                        style={inputStyle}
                      />
                      {twoFaOtpAuthUrl && (
                        <a
                          href={twoFaOtpAuthUrl}
                          className="text-xs font-black underline transition-colors"
                          style={{ color: 'hsl(0,100%,68%)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'hsl(0,100%,80%)' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'hsl(0,100%,68%)' }}
                        >
                          Open in authenticator app
                        </a>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'hsla(0,0%,100%,0.35)' }}>
                      {twoFaEnabled ? 'Enter current 2FA code' : 'Verify setup code'}
                    </Label>
                    <Input
                      value={twoFaCode}
                      onChange={(e) => setTwoFaCode(e.target.value)}
                      placeholder="123456"
                      inputMode="numeric"
                      className="h-12"
                      style={inputStyle}
                    />
                  </div>

                  {twoFaPending && (
                    <motion.button
                      whileHover={{ scale: twoFaLoading ? 1 : 1.02, boxShadow: '0 0 28px -6px hsla(0,100%,62%,0.55)' }}
                      whileTap={{ scale: twoFaLoading ? 1 : 0.97 }}
                      className="relative w-full h-11 rounded-xl font-black text-[11px] uppercase tracking-widest text-white overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg,hsl(0,100%,57%),hsl(0,0%,54%))',
                        boxShadow: '0 0 20px -6px hsla(0,100%,62%,0.45)',
                        cursor: twoFaLoading ? 'not-allowed' : 'pointer',
                        opacity: twoFaLoading ? 0.6 : 1,
                      }}
                      onClick={handleEnableTwoFa}
                      disabled={twoFaLoading}
                    >
                      <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)' }} />
                      {twoFaLoading ? 'Verifying...' : 'Enable 2FA'}
                    </motion.button>
                  )}

                  {twoFaEnabled && (
                    <button
                      className="w-full h-11 font-black text-[11px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                      style={{
                        background: 'transparent',
                        border: '1px solid hsla(0,84%,60%,0.22)',
                        color: 'hsl(0,84%,65%)',
                        cursor: twoFaLoading ? 'not-allowed' : 'pointer',
                        opacity: twoFaLoading ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => { if (!twoFaLoading) { e.currentTarget.style.background = 'hsla(0,84%,60%,0.08)'; e.currentTarget.style.borderColor = 'hsla(0,84%,60%,0.40)' } }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'hsla(0,84%,60%,0.22)' }}
                      onClick={handleDisableTwoFa}
                      disabled={twoFaLoading}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      {twoFaLoading ? 'Processing...' : 'Disable 2FA'}
                    </button>
                  )}

                  {twoFaEnabled && (
                    <div className="pt-2 rounded-xl p-4 text-[10px] font-bold uppercase tracking-widest leading-relaxed text-center"
                      style={{ background: 'hsla(142,71%,55%,0.05)', border: '1px solid hsla(142,71%,55%,0.14)', color: 'hsla(142,71%,60%,0.65)' }}>
                      Two-factor authentication is active. Your account is protected.
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  )
}
