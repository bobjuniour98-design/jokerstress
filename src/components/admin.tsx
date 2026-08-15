'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import Menu from '@/components/menu'
import { ShieldCheck, UserSearch, Activity, Server, Zap, RefreshCw, AlertTriangle, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AlertBox from '@/components/alert-box'
import { motion } from 'framer-motion'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [queryUsername, setQueryUsername] = useState('')
  const [loadingUser, setLoadingUser] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [plans, setPlans] = useState<string[]>([])
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [runningAttacks, setRunningAttacks] = useState<Array<{
    id: number
    user: { username: string } | null
    target: string
    methodName: string
    layer: string
    expiresAt: string
    server: { name: string; capacity: number } | null
  }>>([])
  const [serverUsage, setServerUsage] = useState<Array<{
    id: number
    name: string
    type: string
    running: number
    capacity: number
    usagePercent: number
  }>>([])
  const [auditEvents, setAuditEvents] = useState<Array<{
    at: string
    actor: string
    action: string
    target?: string
    details?: string
  }>>([])

  const [userForm, setUserForm] = useState<{
    username: string
    rank: string
    plan: string
    planExpire: string
    balance: string
    apiAccess: boolean
    premium: boolean
    banReason: string
  } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn()
      return
    }
    if (status !== 'authenticated') return

    const rank = (session?.user as { rank?: string } | undefined)?.rank?.toLowerCase()
    const isAdmin = rank === 'admin' || rank === 'owner'
    setAuthorized(isAdmin)
    if (!isAdmin) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    if (authorized !== true) return
    ;(async () => {
      try {
        const res = await fetch('/api/admin/plans')
        const data = await res.json()
        if (res.ok) {
          setPlans(Array.isArray(data.plans) ? data.plans.map((p: { name: string }) => p.name) : [])
        }
      } catch {
        // ignore
      }
    })()
  }, [authorized])

  const fetchOverview = async () => {
    setOverviewLoading(true)
    try {
      const res = await fetch('/api/admin/overview')
      const data = await res.json()
      if (res.ok) {
        setRunningAttacks(Array.isArray(data.runningAttacks) ? data.runningAttacks : [])
        setServerUsage(Array.isArray(data.serverUsage) ? data.serverUsage : [])
      } else {
        setAlert({ message: data.message || 'Failed to load overview', type: 'error' })
      }
    } catch (e) {
      setAlert({ message: e instanceof Error ? e.message : 'Unknown error', type: 'error' })
    } finally {
      setOverviewLoading(false)
    }
  }

  const fetchAudit = async () => {
    try {
      const res = await fetch('/api/admin/audit?limit=100')
      const data = await res.json()
      if (res.ok) {
        setAuditEvents(Array.isArray(data.events) ? data.events : [])
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (authorized !== true) return
    void fetchOverview()
    void fetchAudit()
  }, [authorized])

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#08000f' }}>
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-12 h-12">
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{ border: '2px solid transparent', borderTopColor: 'hsl(0,100%,62%)', borderRightColor: 'hsl(0,0%,62%)' }}
            />
            <div className="absolute inset-2 rounded-full animate-pulse" style={{ background: 'hsla(0,100%,62%,0.15)' }} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'hsla(0,100%,62%,0.5)' }}>
            Verifying Access
          </span>
        </div>
      </div>
    )
  }

  if (authorized === false) return null

  const loadUser = async () => {
    const u = queryUsername.trim()
    if (!u) return
    setLoadingUser(true)
    setAlert(null)
    try {
      const res = await fetch(`/api/admin/users/get?username=${encodeURIComponent(u)}`)
      const data = await res.json()
      if (!res.ok) {
        setUserForm(null)
        setAlert({ message: data.message || 'Failed to load user', type: 'error' })
        return
      }
      const user = data.user as {
        username: string
        rank: string
        plan: string
        planExpire: string | null
        balance: number
        apiAccess: boolean
        premium: boolean
      }
      setUserForm({
        username: user.username,
        rank: user.rank ?? 'user',
        plan: user.plan ?? 'free',
        planExpire: user.planExpire ? new Date(user.planExpire).toISOString().slice(0, 16) : '',
        balance: String(user.balance ?? 0),
        apiAccess: Boolean(user.apiAccess),
        premium: Boolean(user.premium),
        banReason: data.moderation?.banReason ?? '',
      })
    } catch (e) {
      setUserForm(null)
      setAlert({ message: e instanceof Error ? e.message : 'Unknown error', type: 'error' })
    } finally {
      setLoadingUser(false)
    }
  }

  const saveUser = async () => {
    if (!userForm) return
    setSavingUser(true)
    setAlert(null)
    try {
      const payload: Record<string, unknown> = {
        username: userForm.username,
        rank: userForm.rank,
        plan: userForm.plan,
        apiAccess: userForm.apiAccess,
        premium: userForm.premium,
      }

      const bal = Number(userForm.balance)
      if (!Number.isNaN(bal)) payload.balance = bal

      if (userForm.planExpire.trim()) {
        payload.planExpire = new Date(userForm.planExpire).toISOString()
      } else {
        payload.planExpire = null
      }

      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert({ message: data.message || 'Failed to save', type: 'error' })
        return
      }
      setAlert({ message: 'Saved', type: 'success' })
      await fetchAudit()
    } catch (e) {
      setAlert({ message: e instanceof Error ? e.message : 'Unknown error', type: 'error' })
    } finally {
      setSavingUser(false)
    }
  }

  const setUserBan = async (banned: boolean) => {
    if (!userForm) return
    try {
      const res = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userForm.username,
          banned,
          reason: userForm.banReason,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert({ message: data.message || 'Failed to update ban state', type: 'error' })
        return
      }
      setUserForm({
        ...userForm,
        rank: data.user?.rank ?? (banned ? 'banned' : 'user'),
        apiAccess: data.user?.apiAccess ?? userForm.apiAccess,
      })
      setAlert({ message: banned ? 'User banned' : 'User unbanned', type: 'success' })
      await fetchAudit()
    } catch (e) {
      setAlert({ message: e instanceof Error ? e.message : 'Unknown error', type: 'error' })
    }
  }

  // ── shared style tokens ──────────────────────────────────────────────────────
  const glassCard: React.CSSProperties = {
    background: 'hsla(270,45%,5%,0.80)',
    border: '1px solid hsla(0,100%,62%,0.09)',
    backdropFilter: 'blur(16px)',
    borderRadius: 16,
    overflow: 'hidden',
  }

  const JokerBar: React.CSSProperties = {
    height: 2,
    background: 'linear-gradient(90deg,transparent,hsl(0,100%,62%),hsl(0,0%,62%),transparent)',
  }

  const sectionDivider: React.CSSProperties = {
    borderBottom: '1px solid hsla(0,100%,62%,0.08)',
  }

  const inputRowStyle: React.CSSProperties = {
    background: 'hsla(270,45%,8%,0.80)',
    border: '1px solid hsla(0,100%,62%,0.13)',
    borderRadius: 10,
  }

  // time-remaining helper
  const timeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return '0s'
    const s = Math.floor(diff / 1000)
    if (s < 60) return `${s}s`
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}m ${s % 60}s`
    return `${Math.floor(m / 60)}h ${m % 60}m`
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#08000f', fontFamily: 'inherit' }}>
      <div
        className="fixed pointer-events-none"
        style={{
          top: '-15%', left: '-10%', width: '55%', height: '55%',
          borderRadius: '50%', filter: 'blur(150px)',
          background: 'hsla(0,100%,62%,0.10)',
          animation: 'pulse 4s ease-in-out infinite',
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          bottom: '-15%', right: '-10%', width: '55%', height: '55%',
          borderRadius: '50%', filter: 'blur(150px)',
          background: 'hsla(0,0%,62%,0.08)',
          animation: 'pulse 5s ease-in-out infinite 1s',
        }}
      />

      <Menu />

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4"
        >
          <div>
            <h1
              className="text-4xl font-black tracking-widest uppercase"
              style={{
                background: 'linear-gradient(90deg,#ffffff,#9ca3af)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ADMIN CONSOLE
            </h1>
            <p
              className="text-[11px] font-black tracking-[0.25em] uppercase mt-1"
              style={{ color: 'hsl(0,100%,62%)' }}
            >
              RESTRICTED ACCESS — AUTHORIZED PERSONNEL ONLY
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full self-start md:self-auto"
            style={{
              background: 'hsla(0,84%,60%,0.08)',
              border: '1px solid hsla(0,84%,60%,0.28)',
            }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{
                background: 'hsl(0,84%,60%)',
                boxShadow: '0 0 8px hsl(0,84%,60%)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'hsl(0,84%,65%)' }}>
              CLEARANCE LEVEL: ADMIN
            </span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            {
              icon: <Zap className="h-5 w-5" style={{ color: 'hsl(0,100%,62%)' }} />,
              value: runningAttacks.length,
              label: 'Running Attacks',
            },
            {
              icon: <Server className="h-5 w-5" style={{ color: 'hsl(0,0%,62%)' }} />,
              value: serverUsage.length,
              label: 'Servers Online',
            },
            {
              icon: <Users className="h-5 w-5" style={{ color: 'hsl(0,100%,62%)' }} />,
              value: auditEvents.length,
              label: 'Audit Events',
            },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                ...glassCard,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'hsla(0,100%,62%,0.08)',
                  border: '1px solid hsla(0,100%,62%,0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-black text-white leading-none">{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          style={glassCard}
        >
          <div style={JokerBar} />
          <div
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-8 py-6"
            style={sectionDivider}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: 'hsl(0,100%,62%)' }} />
              <h2 className="text-base font-black tracking-widest uppercase text-white">OPERATIVE MANAGEMENT</h2>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Search by username
            </span>
          </div>

          <div className="px-8 py-6 space-y-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  value={queryUsername}
                  onChange={(e) => setQueryUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUser()}
                  placeholder="Enter username…"
                  className="h-12"
                  style={{
                    background: 'hsla(270,45%,8%,0.80)',
                    border: '1px solid hsla(0,100%,62%,0.13)',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                />
              </div>
              <button
                onClick={loadUser}
                disabled={loadingUser || !queryUsername.trim()}
                style={{
                  height: 48,
                  padding: '0 28px',
                  borderRadius: 10,
                  fontWeight: 900,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  color: '#fff',
                  background: loadingUser || !queryUsername.trim()
                    ? 'hsla(0,100%,62%,0.12)'
                    : 'linear-gradient(135deg,hsl(0,100%,58%),hsl(0,0%,55%))',
                  border: 'none',
                  boxShadow: loadingUser || !queryUsername.trim()
                    ? 'none'
                    : '0 0 20px -4px hsla(0,100%,62%,0.45)',
                  cursor: loadingUser || !queryUsername.trim() ? 'not-allowed' : 'pointer',
                  opacity: loadingUser || !queryUsername.trim() ? 0.5 : 1,
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <UserSearch style={{ width: 14, height: 14 }} />
                {loadingUser ? 'Loading…' : 'Load'}
              </button>
            </div>
            {userForm && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl"
                  style={{
                    background: 'hsla(0,100%,62%,0.06)',
                    border: '1px solid hsla(0,100%,62%,0.14)',
                  }}
                >
                  <div
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'hsl(0,100%,62%)',
                      boxShadow: '0 0 8px hsl(0,100%,62%)',
                      animation: 'pulse 1.8s ease-in-out infinite',
                    }}
                  />
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'hsl(0,100%,62%)' }}>
                    OPERATIVE: {userForm.username}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Rank</Label>
                    <Select
                      value={userForm.rank}
                      onValueChange={(v) => setUserForm({ ...userForm, rank: v })}
                    >
                      <SelectTrigger
                        className="h-12 text-sm font-bold"
                        style={inputRowStyle as React.CSSProperties & Record<string, string>}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        style={{
                          background: 'hsl(270,45%,6%)',
                          border: '1px solid hsla(0,100%,62%,0.18)',
                          borderRadius: 10,
                        }}
                      >
                        {['user', 'admin', 'owner', 'banned'].map((r) => (
                          <SelectItem key={r} value={r} className="font-bold">{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Plan</Label>
                    <Select
                      value={userForm.plan}
                      onValueChange={(v) => setUserForm({ ...userForm, plan: v })}
                    >
                      <SelectTrigger
                        className="h-12 text-sm font-bold"
                        style={inputRowStyle as React.CSSProperties & Record<string, string>}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        className="max-h-[260px]"
                        style={{
                          background: 'hsl(270,45%,6%)',
                          border: '1px solid hsla(0,100%,62%,0.18)',
                          borderRadius: 10,
                        }}
                      >
                        {plans.length > 0
                          ? plans.map((p) => (
                              <SelectItem key={p} value={p} className="font-bold">{p}</SelectItem>
                            ))
                          : <SelectItem value={userForm.plan} className="font-bold">{userForm.plan}</SelectItem>
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Plan Expire</Label>
                    <Input
                      type="datetime-local"
                      value={userForm.planExpire}
                      onChange={(e) => setUserForm({ ...userForm, planExpire: e.target.value })}
                      className="h-12 font-bold text-sm"
                      style={inputRowStyle}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Balance</Label>
                    <Input
                      value={userForm.balance}
                      onChange={(e) => setUserForm({ ...userForm, balance: e.target.value })}
                      className="h-12 font-bold text-sm"
                      style={inputRowStyle}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Ban Reason</Label>
                    <Input
                      value={userForm.banReason}
                      onChange={(e) => setUserForm({ ...userForm, banReason: e.target.value })}
                      placeholder="Required when banning"
                      className="h-12 font-bold text-sm"
                      style={inputRowStyle}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="apiAccess"
                      checked={userForm.apiAccess}
                      onChange={(e) => setUserForm({ ...userForm, apiAccess: e.target.checked })}
                      style={{ accentColor: 'hsl(0,100%,62%)', width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <label
                      htmlFor="apiAccess"
                      className="text-sm font-bold text-gray-300 cursor-pointer select-none"
                    >
                      API Access
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="premium"
                      checked={userForm.premium}
                      onChange={(e) => setUserForm({ ...userForm, premium: e.target.checked })}
                      style={{ accentColor: 'hsl(0,100%,62%)', width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <label
                      htmlFor="premium"
                      className="text-sm font-bold text-gray-300 cursor-pointer select-none"
                    >
                      Premium
                    </label>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <button
                      onClick={saveUser}
                      disabled={savingUser}
                      style={{
                        height: 48,
                        borderRadius: 10,
                        fontWeight: 900,
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.18em',
                        color: '#fff',
                        background: savingUser
                          ? 'hsla(0,100%,62%,0.15)'
                          : 'linear-gradient(135deg,hsl(0,100%,58%),hsl(0,0%,55%))',
                        border: 'none',
                        boxShadow: savingUser ? 'none' : '0 0 20px -4px hsla(0,100%,62%,0.45)',
                        cursor: savingUser ? 'not-allowed' : 'pointer',
                        opacity: savingUser ? 0.6 : 1,
                        transition: 'all 0.15s',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {savingUser ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setUserBan(true)}
                      style={{
                        height: 48,
                        borderRadius: 10,
                        fontWeight: 900,
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.18em',
                        color: 'hsl(0,84%,65%)',
                        background: 'transparent',
                        border: '1px solid hsla(0,84%,60%,0.30)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'hsla(0,84%,60%,0.10)'
                        e.currentTarget.style.borderColor = 'hsla(0,84%,60%,0.50)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.borderColor = 'hsla(0,84%,60%,0.30)'
                      }}
                    >
                      <AlertTriangle style={{ width: 13, height: 13 }} />
                      Ban User
                    </button>
                    <button
                      onClick={() => setUserBan(false)}
                      style={{
                        height: 48,
                        borderRadius: 10,
                        fontWeight: 900,
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.18em',
                        color: 'hsl(160,84%,55%)',
                        background: 'transparent',
                        border: '1px solid hsla(160,84%,55%,0.28)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'hsla(160,84%,55%,0.08)'
                        e.currentTarget.style.borderColor = 'hsla(160,84%,55%,0.48)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.borderColor = 'hsla(160,84%,55%,0.28)'
                      }}
                    >
                      Unban User
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          style={glassCard}
        >
          <div style={JokerBar} />
          <div className="flex items-center justify-between px-8 py-5" style={sectionDivider}>
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 shrink-0" style={{ color: 'hsl(0,100%,62%)' }} />
              <h2 className="text-base font-black tracking-widest uppercase text-white">LIVE OPERATIONS</h2>
              {runningAttacks.length > 0 && (
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{
                    background: 'hsla(0,100%,62%,0.15)',
                    color: 'hsl(0,100%,75%)',
                    border: '1px solid hsla(0,100%,62%,0.25)',
                  }}
                >
                  {runningAttacks.length} ACTIVE
                </span>
              )}
            </div>
            <button
              onClick={fetchOverview}
              style={{
                height: 36,
                padding: '0 16px',
                borderRadius: 8,
                fontWeight: 900,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#9ca3af',
                background: 'transparent',
                border: '1px solid hsla(0,100%,62%,0.10)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fff'
                e.currentTarget.style.borderColor = 'hsla(0,100%,62%,0.25)'
                e.currentTarget.style.background = 'hsla(0,100%,62%,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af'
                e.currentTarget.style.borderColor = 'hsla(0,100%,62%,0.10)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <RefreshCw style={{ width: 12, height: 12 }} />
              Refresh
            </button>
          </div>
          <div className="px-8 py-6">
            {overviewLoading ? (
              <p className="text-sm font-bold text-gray-500 animate-pulse">Loading operations…</p>
            ) : runningAttacks.length === 0 ? (
              <p className="text-sm font-bold text-gray-600">No active operations.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-auto pr-1">
                {runningAttacks.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    style={{
                      background: 'hsla(0,100%,62%,0.04)',
                      border: '1px solid hsla(0,100%,62%,0.10)',
                      borderLeft: '3px solid hsl(0,100%,62%)',
                      borderRadius: 10,
                      padding: '12px 16px',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto auto auto auto',
                      alignItems: 'center',
                      gap: 16,
                    }}
                  >
                    <p className="text-sm font-bold text-white truncate" title={a.target}>{a.target}</p>
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-md"
                      style={{
                        background: a.layer === '7' ? 'hsla(0,0%,62%,0.18)' : 'hsla(0,100%,62%,0.15)',
                        color: a.layer === '7' ? 'hsl(0,0%,75%)' : 'hsl(0,100%,75%)',
                        border: a.layer === '7'
                          ? '1px solid hsla(0,0%,62%,0.28)'
                          : '1px solid hsla(0,100%,62%,0.25)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      L{a.layer}
                    </span>
                    <span className="text-xs font-bold text-gray-400 whitespace-nowrap">{a.methodName}</span>
                    <span className="text-xs font-bold text-gray-500 whitespace-nowrap">{a.user?.username ?? 'anon'}</span>
                    <span className="text-xs font-bold text-gray-600 whitespace-nowrap">{a.server?.name ?? 'n/a'}</span>
                    <span
                      className="text-[10px] font-black whitespace-nowrap"
                      style={{ color: 'hsl(0,100%,62%)' }}
                    >
                      {timeRemaining(a.expiresAt)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.30 }}
          style={glassCard}
        >
          <div style={JokerBar} />
          <div className="flex items-center justify-between px-8 py-5" style={sectionDivider}>
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 shrink-0" style={{ color: 'hsl(0,100%,62%)' }} />
              <h2 className="text-base font-black tracking-widest uppercase text-white">NODE STATUS</h2>
            </div>
            <button
              onClick={fetchOverview}
              style={{
                height: 36,
                padding: '0 16px',
                borderRadius: 8,
                fontWeight: 900,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#9ca3af',
                background: 'transparent',
                border: '1px solid hsla(0,100%,62%,0.10)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fff'
                e.currentTarget.style.borderColor = 'hsla(0,100%,62%,0.25)'
                e.currentTarget.style.background = 'hsla(0,100%,62%,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af'
                e.currentTarget.style.borderColor = 'hsla(0,100%,62%,0.10)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <RefreshCw style={{ width: 12, height: 12 }} />
              Refresh
            </button>
          </div>
          <div className="px-8 py-6">
            {overviewLoading ? (
              <p className="text-sm font-bold text-gray-500 animate-pulse">Loading nodes…</p>
            ) : serverUsage.length === 0 ? (
              <p className="text-sm font-bold text-gray-600">No online servers found.</p>
            ) : (
              <div className="space-y-3">
                {serverUsage.map((s, i) => {
                  const pct = Math.max(0, Math.min(100, s.usagePercent))
                  const barColor = pct >= 90
                    ? 'hsl(0,84%,60%)'
                    : pct >= 70
                    ? 'hsl(38,92%,50%)'
                    : 'linear-gradient(90deg,hsl(0,100%,58%),hsl(0,0%,55%))'

                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.05 }}
                      style={{
                        background: 'hsla(0,100%,62%,0.04)',
                        border: '1px solid hsla(0,100%,62%,0.09)',
                        borderRadius: 12,
                        padding: '14px 18px',
                      }}
                    >
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-black text-white">{s.name}</p>
                          <span
                            className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider"
                            style={{
                              background: 'hsla(0,0%,62%,0.14)',
                              color: 'hsl(0,0%,72%)',
                              border: '1px solid hsla(0,0%,62%,0.22)',
                            }}
                          >
                            {s.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-400">{s.running}/{s.capacity}</span>
                          <span
                            className="text-[10px] font-black"
                            style={{
                              color: pct >= 90
                                ? 'hsl(0,84%,60%)'
                                : pct >= 70
                                ? 'hsl(38,92%,50%)'
                                : 'hsl(0,100%,62%)',
                            }}
                          >
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          height: 12,
                          borderRadius: 6,
                          overflow: 'hidden',
                          background: 'hsla(270,45%,12%,1)',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            borderRadius: 6,
                            background: barColor,
                            transition: 'width 0.6s ease',
                            boxShadow: pct >= 90
                              ? '0 0 10px hsla(0,84%,60%,0.5)'
                              : pct >= 70
                              ? '0 0 10px hsla(38,92%,50%,0.4)'
                              : '0 0 12px hsla(0,100%,62%,0.4)',
                          }}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.36 }}
          style={glassCard}
        >
          <div style={JokerBar} />
          <div className="flex items-center justify-between px-8 py-5" style={sectionDivider}>
            <h2 className="text-base font-black tracking-widest uppercase text-white">AUDIT LOG</h2>
            <button
              onClick={fetchAudit}
              style={{
                height: 36,
                padding: '0 16px',
                borderRadius: 8,
                fontWeight: 900,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#9ca3af',
                background: 'transparent',
                border: '1px solid hsla(0,100%,62%,0.10)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fff'
                e.currentTarget.style.borderColor = 'hsla(0,100%,62%,0.25)'
                e.currentTarget.style.background = 'hsla(0,100%,62%,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af'
                e.currentTarget.style.borderColor = 'hsla(0,100%,62%,0.10)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <RefreshCw style={{ width: 12, height: 12 }} />
              Refresh
            </button>
          </div>
          <div className="px-8 py-6">
            {auditEvents.length === 0 ? (
              <p className="text-sm font-bold text-gray-600">No admin events recorded.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-auto pr-1">
                {auditEvents.map((e, idx) => (
                  <motion.div
                    key={`${e.at}-${idx}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    style={{
                      background: 'hsla(0,100%,62%,0.03)',
                      border: '1px solid hsla(0,100%,62%,0.07)',
                      borderLeft: '2px solid hsla(0,100%,62%,0.35)',
                      borderRadius: 10,
                      padding: '10px 16px',
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      alignItems: 'center',
                      gap: '10px 16px',
                    }}
                  >
                    <span
                      className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap"
                      style={{
                        background: 'hsla(0,100%,62%,0.14)',
                        color: 'hsl(0,100%,72%)',
                        border: '1px solid hsla(0,100%,62%,0.22)',
                      }}
                    >
                      {e.action}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-gray-300">
                        {e.actor}
                        {e.target ? (
                          <>
                            <span className="text-gray-600 mx-1">→</span>
                            <span style={{ color: 'hsl(0,0%,72%)' }}>{e.target}</span>
                          </>
                        ) : null}
                      </span>
                      {e.details && (
                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">{e.details}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-600 whitespace-nowrap">
                      {new Date(e.at).toLocaleString()}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

      </main>

      {alert && (
        <AlertBox
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
    </div>
  )
}
