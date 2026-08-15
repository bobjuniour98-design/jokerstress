'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { Users, Database, UserCircle, Newspaper, Calendar, Cat, ArrowUp, ArrowDown, Minus, Zap, Server, Shield, CreditCard, Clock, Activity } from 'lucide-react'
import Menu from '@/components/menu'
import Link from 'next/link'
import AlertBox from '@/components/alert-box'
import { formatNumber, formatCurrency } from '@/utils/formatNumber'

interface DashboardData {
  username: string
  rank: string
  plan: string
  concurrents: number
  max_boot_time: number
  plan_expire: string
  balance: number
  premium: boolean
  apiAccess: boolean
  stats: StatsData
}

interface NewsItem {
  title: string
  date: string
  description: string
}

interface StatsData {
  total_users: number
  total_attacks: number
  running_bots: number
  layer7_usage: number
  layer7_max: number
  layer4_usage: number
  layer4_max: number
}

interface DashboardAlert {
  message: string
  type: 'success' | 'error'
}

// ── 3-D tilt card ────────────────────────────────────────────────────────────
function TiltCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const x   = useMotionValue(0)
  const y   = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 30 })
  const glowX   = useTransform(x, [-0.5, 0.5], [0, 100])
  const glowY   = useTransform(y, [-0.5, 0.5], [0, 100])

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        x.set((e.clientX - rect.left) / rect.width  - 0.5)
        y.set((e.clientY - rect.top)  / rect.height - 0.5)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800, ...style }}
      className={className}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, hsla(0,100%,55%,0.12), transparent 65%)`
          ),
          borderRadius: 'inherit',
        }}
      />
      {children}
    </motion.div>
  )
}

// ── Capacity bar ─────────────────────────────────────────────────────────────
function CapacityBar({ label, usage, max, color }: { label: string; usage: number; max: number; color: 'green' | 'purple' }) {
  const pct = max > 0 ? Math.min(100, Math.round((usage / max) * 100)) : 0
  const isGreen = color === 'green'
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'hsla(0,0%,100%,0.35)' }}>{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black tabular-nums text-white">{usage}<span className="text-gray-600">/{max}</span></span>
          <span className="text-[10px] font-black" style={{ color: isGreen ? 'hsl(0,100%,60%)' : 'hsl(0,0%,60%)' }}>{pct}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: isGreen ? 'hsla(0,100%,55%,0.08)' : 'hsla(0,0%,55%,0.08)' }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{ background: isGreen ? 'linear-gradient(90deg,hsl(0,100%,55%),hsl(0,0%,55%))' : 'linear-gradient(90deg,hsl(0,0%,55%),hsl(0,0%,55%))' }}
        />
      </div>
    </div>
  )
}

export default function Component() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading]         = useState<boolean>(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [newsItems, setNewsItems]     = useState<NewsItem[]>([])
  const [showCatAnimation, showcat]   = useState(false)
  const [prevStats, setPrevStats]     = useState<StatsData | null>(null)
  const [alert, setAlert]             = useState<DashboardAlert | null>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const fetchcatdata = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (!response.ok) throw new Error('Failed to fetch dashboard data')
      const data: DashboardData = await response.json()
      data.stats.layer7_max = 140
      data.stats.layer4_max = 140
      setPrevStats((prev) => prev || data.stats)
      setDashboardData(data)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setIsAuthenticated(false)
      router.push('/signin')
    } finally {
      setLoading(false)
      const seen = localStorage.getItem('catanimationalreadyseen')
      if (!seen) {
        showcat(true)
        localStorage.setItem('catanimationalreadyseen', 'true')
        setTimeout(() => showcat(false), 2000)
      }
    }
  }, [router])

  const fetchnewscat = async () => {
    try {
      const response = await fetch('/api/news')
      if (!response.ok) throw new Error('Failed to fetch news items')
      const data: NewsItem[] = await response.json()
      setNewsItems(data)
    } catch (error) {
      console.error('Error fetching news items:', error)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push('/signin') }
    else { fetchcatdata(); fetchnewscat() }
  }, [session, status, router, fetchcatdata])

  useEffect(() => {
    const interval = setInterval(fetchcatdata, 5000)
    return () => clearInterval(interval)
  }, [fetchcatdata])

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#050008' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(0,100%,55%)', borderTopColor: 'transparent' }} />
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'hsla(0,100%,55%,0.5)' }}>Initializing…</span>
        </div>
      </div>
    )
  }

  if (isAuthenticated === false || !session) return null

  const statCards = [
    { title: 'Network Users',   value: dashboardData?.stats.total_users   || 0, prevValue: prevStats?.total_users   || 0, icon: Users,    color: 'green'   as const },
    { title: 'Total Attacks',   value: dashboardData?.stats.total_attacks  || 0, prevValue: prevStats?.total_attacks  || 0, icon: Database, color: 'purple' as const },
    { title: 'Active Bot Fleet',value: dashboardData?.stats.running_bots   || 0, prevValue: prevStats?.running_bots   || 0, icon: Activity, color: 'green'   as const },
  ]

  const CARD: React.CSSProperties = {
    background: 'hsla(280,20%,6%,0.88)',
    border: '1px solid hsla(0,100%,55%,0.10)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    position: 'relative',
    overflow: 'hidden',
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#050008' }}>
      <div className="fixed top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[160px] pointer-events-none" style={{ background: 'hsla(0,100%,55%,0.09)' }} />
      <div className="fixed bottom-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full blur-[160px] pointer-events-none" style={{ background: 'hsla(0,0%,55%,0.07)' }} />

      <Menu />
      <AnimatePresence>
        {showCatAnimation && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center backdrop-blur-md z-[100]"
            style={{ background: 'rgba(5,0,8,0.85)' }}
          >
            <motion.div animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="relative">
              <div className="absolute inset-0 blur-3xl rounded-full" style={{ background: 'hsla(0,100%,55%,0.40)' }} />
              <Cat className="h-40 w-40 relative drop-shadow-[0_0_30px_rgba(74,222,128,0.8)]" style={{ color: 'hsl(0,100%,55%)' }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" style={{ boxShadow: '0 0 6px hsl(142,76%,50%)' }} />
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: 'hsl(142,76%,55%)' }}>Systems Online</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter leading-none">
                <span className="text-white">Command </span>
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg,hsl(0,100%,60%),hsl(0,0%,60%))' }}>Center</span>
              </h1>
              <p className="mt-2 text-sm font-medium" style={{ color: 'hsla(0,0%,100%,0.35)' }}>
                Welcome back,{' '}
                <span className="font-black" style={{ color: 'hsl(0,100%,60%)' }}>{dashboardData?.username}</span>.
              </p>
            </div>
            <div
              className="flex items-center gap-5 px-6 py-4 rounded-2xl shrink-0"
              style={{ background: 'hsla(0,100%,55%,0.07)', border: '1px solid hsla(0,100%,55%,0.18)', backdropFilter: 'blur(20px)' }}
            >
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'hsla(0,100%,55%,0.55)' }}>Available Credits</p>
                <p className="text-2xl font-black text-white leading-none">{formatCurrency(dashboardData?.balance)}</p>
              </div>
              <Link href="/deposit">
                <motion.div
                  whileHover={{ scale: 1.06, boxShadow: '0 0 28px -6px hsla(0,100%,55%,0.70)' }}
                  whileTap={{ scale: 0.96 }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer"
                  style={{ background: 'linear-gradient(135deg,hsl(0,100%,55%),hsl(0,0%,55%))', boxShadow: '0 0 20px -4px hsla(0,100%,55%,0.50)' }}
                >
                  <CreditCard className="w-5 h-5 text-white" />
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Plan',        value: dashboardData?.plan ?? '—',                                                         icon: Shield },
            { label: 'Concurrents', value: formatNumber(dashboardData?.concurrents),                                            icon: Server },
            { label: 'Max Boot',    value: `${formatNumber(dashboardData?.max_boot_time)}s`,                                    icon: Clock },
            { label: 'Expiry',      value: dashboardData?.plan_expire ? formatDate(dashboardData.plan_expire) : 'Never',       icon: Calendar },
          ].map((pill, i) => (
            <motion.div
              key={pill.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.10 + i * 0.05 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'hsla(280,20%,6%,0.88)', border: '1px solid hsla(0,100%,55%,0.10)', backdropFilter: 'blur(16px)' }}
            >
              <pill.icon className="h-4 w-4 flex-shrink-0" style={{ color: 'hsl(0,100%,55%)' }} />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-0.5" style={{ color: 'hsla(0,0%,100%,0.28)' }}>{pill.label}</p>
                <p className="text-sm font-black text-white leading-none">{pill.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {statCards.map((item, index) => {
            const isGreen  = item.color === 'green'
            const accentH  = isGreen ? 'hsl(0,100%,55%)'      : 'hsl(0,0%,55%)'
            const accentA  = (a: number) => isGreen ? `hsla(0,100%,55%,${a})` : `hsla(0,0%,55%,${a})`
            const delta    = item.value - (item.prevValue || 0)
            const Icon     = item.icon

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.06 }}
              >
                <TiltCard
                  className="relative group overflow-hidden rounded-2xl h-full"
                  style={{ ...CARD, border: `1px solid ${accentA(0.13)}`, borderRadius: '1rem' }}
                >
                  <div className="absolute top-0 inset-x-0" style={{ height: 2, background: isGreen ? 'linear-gradient(90deg,transparent,hsl(0,100%,55%),hsl(0,0%,55%),transparent)' : 'linear-gradient(90deg,transparent,hsl(0,0%,55%),hsl(0,100%,55%),transparent)' }} />
                  <div className="absolute top-0.5 inset-x-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${accentA(0.35)},transparent)` }} />
                  <div className="absolute top-0 right-0 w-36 h-36 blur-3xl -mr-14 -mt-14 pointer-events-none group-hover:scale-125 transition-transform duration-500" style={{ background: accentA(0.13) }} />

                  <div className="p-7 relative z-10 flex flex-col min-h-[160px]">
                    <div className="flex justify-between items-start mb-5">
                      <div
                        className="p-3 rounded-2xl transition-all group-hover:scale-110"
                        style={{ background: accentA(0.10), border: `1px solid ${accentA(0.22)}`, color: accentH, boxShadow: `0 0 20px -4px ${accentA(0.35)}` }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div
                        className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg"
                        style={
                          delta > 0 ? { background: 'hsla(142,70%,50%,0.12)', color: 'hsl(142,70%,55%)' }
                          : delta < 0 ? { background: 'hsla(0,84%,60%,0.12)', color: 'hsl(0,84%,65%)' }
                          : { background: 'hsla(0,0%,60%,0.08)', color: 'hsl(0,0%,50%)' }
                        }
                      >
                        {delta > 0 ? <ArrowUp className="w-3 h-3" /> : delta < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {Math.abs(delta)}
                      </div>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={item.value}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="text-4xl font-black text-white leading-none tabular-nums"
                      >
                        {formatNumber(item.value)}
                      </motion.div>
                    </AnimatePresence>
                    <p className="mt-1.5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'hsla(0,0%,100%,0.28)' }}>
                      {item.title}
                    </p>
                  </div>
                </TiltCard>
              </motion.div>
            )
          })}
        </div>
        {dashboardData && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.30 }}
            className="rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-6"
            style={CARD}
          >
            <div className="absolute top-0 inset-x-0" style={{ height: 2, background: 'linear-gradient(90deg,transparent,hsl(0,100%,55%),hsl(0,0%,55%),transparent)' }} />
            <div className="absolute top-0.5 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,70%,0.28),transparent)' }} />
            <div className="sm:col-span-2 flex items-center gap-3 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'hsla(0,100%,55%,0.10)', border: '1px solid hsla(0,100%,55%,0.18)' }}>
                <Zap className="h-3.5 w-3.5" style={{ color: 'hsl(0,100%,55%)' }} />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-white">Network Capacity</p>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,hsla(0,100%,55%,0.15),transparent)' }} />
            </div>

            <CapacityBar label="Layer 4 Usage" usage={dashboardData.stats.layer4_usage} max={dashboardData.stats.layer4_max} color="purple" />
            <CapacityBar label="Layer 7 Usage" usage={dashboardData.stats.layer7_usage} max={dashboardData.stats.layer7_max} color="green" />
          </motion.div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-2 rounded-2xl"
            style={CARD}
          >
            <div className="absolute top-0 inset-x-0" style={{ height: 2, background: 'linear-gradient(90deg,transparent,hsl(0,100%,55%),hsl(0,0%,55%),transparent)' }} />
            <div className="absolute top-0.5 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,70%,0.28),transparent)' }} />
            <div className="flex items-center gap-3 px-7 py-5" style={{ borderBottom: '1px solid hsla(0,100%,55%,0.07)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'hsla(0,100%,55%,0.10)', border: '1px solid hsla(0,100%,55%,0.18)' }}>
                <Newspaper className="h-4 w-4" style={{ color: 'hsl(0,100%,55%)' }} />
              </div>
              <div>
                <p className="text-sm font-black tracking-widest uppercase text-white leading-none">Intelligence Feed</p>
                <p className="text-[9px] font-bold text-gray-600 mt-0.5">Latest platform updates</p>
              </div>
            </div>
            <div className="px-7 py-6 space-y-7">
              {newsItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Newspaper className="h-8 w-8" style={{ color: 'hsla(0,100%,55%,0.20)' }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'hsla(0,100%,55%,0.25)' }}>No broadcasts yet</p>
                </div>
              ) : newsItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.40 + index * 0.07 }}
                  className="relative pl-8 group"
                  style={{ borderLeft: '2px solid hsla(0,100%,55%,0.18)' }}
                >
                  <div
                    className="absolute left-[-9px] top-1.5 w-4 h-4 rounded-full group-hover:scale-125 transition-transform"
                    style={{ background: 'hsla(280,20%,6%,1)', border: '2px solid hsla(0,100%,55%,0.45)', boxShadow: '0 0 8px -2px hsla(0,100%,55%,0.35)' }}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-black text-white group-hover:text-green-400 transition-colors leading-tight">{item.title}</h3>
                    <div
                      className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0"
                      style={{ background: 'hsla(0,100%,55%,0.06)', border: '1px solid hsla(0,100%,55%,0.12)', color: 'hsla(0,100%,60%,0.65)' }}
                    >
                      <Calendar className="h-2.5 w-2.5" />
                      {item?.date ? formatDate(item.date) : 'N/A'}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'hsla(0,0%,100%,0.38)' }}>{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl flex flex-col"
            style={{ ...CARD, border: '1px solid hsla(0,100%,55%,0.16)' }}
          >
            <div className="absolute top-0 inset-x-0" style={{ height: 2, background: 'linear-gradient(90deg,transparent,hsl(0,100%,55%),hsl(0,0%,55%),transparent)' }} />
            <div className="absolute top-0.5 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,70%,0.28),transparent)' }} />
            <div className="px-6 py-6 text-center relative" style={{ borderBottom: '1px solid hsla(0,100%,55%,0.07)' }}>
              <div className="absolute inset-x-0 top-0 h-24 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%,hsla(0,100%,55%,0.12),transparent 70%)' }} />
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 blur-2xl rounded-full opacity-50" style={{ background: 'hsl(0,100%,55%)', transform: 'scale(1.3)' }} />
                <div className="relative rounded-full p-0.5" style={{ background: 'linear-gradient(135deg,hsl(0,100%,55%),hsl(0,0%,55%))', boxShadow: '0 0 24px -4px hsla(0,100%,55%,0.55)' }}>
                  <div className="rounded-full p-1" style={{ background: 'hsla(280,20%,6%,1)' }}>
                    <UserCircle className="h-16 w-16 text-white" />
                  </div>
                </div>
              </div>
              <p className="text-2xl font-black tracking-tight text-white">{dashboardData?.username}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'hsla(0,100%,55%,0.10)', border: '1px solid hsla(0,100%,55%,0.22)' }}>
                <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(0,100%,55%)' }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'hsl(0,100%,60%)' }}>{dashboardData?.rank}</span>
              </div>
            </div>
            <div className="px-5 py-4 space-y-2 flex-1">
              {[
                { label: 'Plan',        value: dashboardData?.plan,                                                          icon: Shield },
                { label: 'Concurrents', value: formatNumber(dashboardData?.concurrents),                                      icon: Server },
                { label: 'Max Boot',    value: `${formatNumber(dashboardData?.max_boot_time)}s`,                              icon: Clock },
                { label: 'Expiry',      value: dashboardData?.plan_expire ? formatDate(dashboardData.plan_expire) : 'N/A',  icon: Calendar },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
                  style={{ background: 'hsla(0,100%,55%,0.03)', border: '1px solid hsla(0,100%,55%,0.07)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsla(0,100%,55%,0.06)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsla(0,100%,55%,0.03)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <row.icon className="h-4 w-4 flex-shrink-0" style={{ color: 'hsla(0,100%,55%,0.45)' }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'hsla(0,0%,100%,0.30)' }}>{row.label}</span>
                  </div>
                  <span className="text-sm font-black text-white">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2.5 px-5 pb-5">
              {[
                { label: 'Premium', value: dashboardData?.premium },
                { label: 'API',     value: dashboardData?.apiAccess },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 p-3.5 rounded-xl"
                  style={{ background: 'hsla(0,100%,55%,0.03)', border: '1px solid hsla(0,100%,55%,0.07)' }}
                >
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'hsla(0,0%,100%,0.28)' }}>{item.label}</span>
                  <span
                    className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg w-full text-center"
                    style={item.value
                      ? { background: 'hsla(142,70%,50%,0.12)', color: 'hsl(142,70%,55%)', border: '1px solid hsla(142,70%,50%,0.20)' }
                      : { background: 'hsla(0,84%,60%,0.10)', color: 'hsl(0,84%,65%)', border: '1px solid hsla(0,84%,60%,0.18)' }
                    }
                  >
                    {item.value ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </main>

      {alert && <AlertBox message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
    </div>
  )
}