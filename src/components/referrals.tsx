'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus, Copy, Check, Share2, Calendar, Database, Trophy, Star, Gift, TrendingUp, ChevronRight } from 'lucide-react'
import Menu from '@/components/menu'
import AlertBox from '@/components/alert-box'

interface Referral {
  username: string
  rank: string
  plan: string
  createdAt: string
}

interface ReferralStats {
  referralCode: string
  referrals: Referral[]
  totalReferrals: number
}

const PINK   = 'hsl(0,100%,62%)'
const VIOLET = 'hsl(0,0%,62%)'
const Joker  = 'linear-gradient(135deg,hsl(0,100%,58%),hsl(0,0%,58%))'
const CARD   = 'hsla(270,45%,5%,0.88)'
const BORDER = 'hsla(0,100%,62%,0.10)'

function JokerBar() {
  return (
    <>
      <div style={{ height: 2, background: Joker }} />
      <div className="absolute top-0.5 inset-x-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,80%,0.30),transparent)' }} />
    </>
  )
}

function SectionLabel({ left, children }: { left?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1" style={{ background: left ? 'linear-gradient(90deg,hsla(0,100%,62%,0.25),transparent)' : 'linear-gradient(90deg,transparent,hsla(0,0%,62%,0.25))' }} />
      <span className="text-[9px] font-black uppercase tracking-[0.28em]" style={{ color: left ? 'hsla(0,100%,62%,0.45)' : 'hsla(0,0%,62%,0.45)' }}>{children}</span>
      <div className="h-px flex-1" style={{ background: left ? 'linear-gradient(90deg,transparent,hsla(0,0%,62%,0.25))' : 'linear-gradient(90deg,hsla(0,100%,62%,0.25),transparent)' }} />
    </div>
  )
}

export default function Referrals() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading]   = useState(true)
  const [stats, setStats]       = useState<ReferralStats | null>(null)
  const [copied, setCopied]     = useState(false)
  const [alert, setAlert]       = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/referrals/stats')
      if (!response.ok) throw new Error('Failed to fetch referral stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching referral stats:', error)
      setAlert({ message: 'Failed to load referral data', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/signin')
    else if (status === 'authenticated') fetchStats()
  }, [status, router, fetchStats])

  const copyToClipboard = () => {
    if (!stats?.referralCode) return
    const url = `${window.location.origin}/signup?ref=${stats.referralCode}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setAlert({ message: 'Referral link copied to clipboard!', type: 'success' })
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#08000f' }}>
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '2px solid transparent', borderTopColor: PINK, borderRightColor: VIOLET }} />
            <div className="absolute inset-2 rounded-full animate-pulse" style={{ background: 'hsla(0,100%,62%,0.15)' }} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'hsla(0,100%,62%,0.5)' }}>Accessing Program</span>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  const shareUrl = stats?.referralCode
    ? (typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${stats.referralCode}` : `/signup?ref=${stats.referralCode}`)
    : ''

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#08000f' }}>
      <div className="fixed top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[160px] pointer-events-none" style={{ background: 'hsla(0,100%,62%,0.09)' }} />
      <div className="fixed bottom-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full blur-[160px] pointer-events-none" style={{ background: 'hsla(0,0%,62%,0.07)' }} />

      <Menu />

      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <Star className="w-3 h-3" style={{ color: PINK }} />
                <span className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: 'hsla(0,100%,62%,0.55)' }}>Exclusive Program</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter leading-none">
                <span className="text-white">Referral </span>
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: Joker }}>Program</span>
              </h1>
              <p className="mt-2 text-sm font-medium" style={{ color: 'hsla(0,0%,100%,0.35)' }}>
                Grow the network.{' '}
                <span style={{ color: 'hsla(0,100%,72%,0.80)' }}>Earn exclusive rewards.</span>
              </p>
            </div>
            <div
              className="flex items-center gap-3 px-5 py-3 rounded-2xl shrink-0"
              style={{ background: 'hsla(40,100%,55%,0.07)', border: '1px solid hsla(40,100%,55%,0.22)', boxShadow: '0 0 24px -8px hsla(40,100%,55%,0.25)' }}
            >
              <Trophy className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(40,100%,62%)', filter: 'drop-shadow(0 0 6px hsla(40,100%,62%,0.55))' }} />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.28em]" style={{ color: 'hsla(40,100%,62%,0.55)' }}>Status</p>
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'hsl(40,100%,68%)' }}>Elite Recruiter</p>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {[
            { icon: Users,     value: stats?.totalReferrals ?? 0, label: 'Total Referrals', color: PINK   },
            { icon: Gift,      value: 0,                          label: 'Pending Rewards', color: VIOLET },
            { icon: TrendingUp,value: 'RECRUITER',                label: 'Network Rank',    color: 'hsl(297,87%,62%)', isText: true },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.10 + i * 0.06 }}
              className="relative flex items-center gap-4 px-5 py-4 rounded-2xl overflow-hidden"
              style={{ background: CARD, border: `1px solid ${BORDER}`, backdropFilter: 'blur(20px)' }}
            >
              <JokerBar />
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 blur-2xl pointer-events-none" style={{ background: `${card.color}15` }} />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10"
                style={{ background: `${card.color}18`, border: `1px solid ${card.color}35`, color: card.color }}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="relative z-10">
                {card.isText ? (
                  <p className="text-xl font-black tracking-widest bg-clip-text text-transparent" style={{ backgroundImage: Joker }}>{card.value}</p>
                ) : (
                  <p className="text-3xl font-black tabular-nums text-white">{card.value}</p>
                )}
                <p className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: 'hsla(0,0%,100%,0.30)' }}>{card.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <SectionLabel left>Share</SectionLabel>
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.20 }}
              className="rounded-3xl overflow-hidden relative"
              style={{ background: CARD, border: '1px solid hsla(0,100%,62%,0.14)', backdropFilter: 'blur(20px)' }}
            >
              <JokerBar />

              <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid hsla(0,100%,62%,0.07)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'hsla(0,100%,62%,0.10)', border: '1px solid hsla(0,100%,62%,0.20)' }}>
                  <Share2 className="w-4 h-4" style={{ color: PINK }} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: 'hsla(0,100%,62%,0.50)' }}>Your Exclusive</p>
                  <p className="text-sm font-black uppercase tracking-widest text-white">Referral Code</p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div
                  className="relative flex flex-col items-center justify-center gap-1.5 px-6 py-8 rounded-2xl overflow-hidden"
                  style={{ background: 'hsla(0,100%,62%,0.04)', border: '1px solid hsla(0,100%,62%,0.14)', boxShadow: 'inset 0 0 40px -20px hsla(0,100%,62%,0.10)' }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 120%,hsla(0,100%,62%,0.14) 0%,transparent 65%)' }} />
                  <p className="text-[9px] font-black uppercase tracking-[0.4em]" style={{ color: 'hsla(0,100%,62%,0.40)' }}>Your Code</p>
                  <p
                    className="relative z-10 text-4xl font-black tracking-[0.25em] text-center text-white"
                    style={{ textShadow: '0 0 30px hsla(0,100%,62%,0.50), 0 0 60px hsla(0,100%,62%,0.20)' }}
                  >
                    {stats?.referralCode ?? '——————'}
                  </p>
                </div>
                <motion.button
                  onClick={copyToClipboard}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 36px -6px hsla(0,100%,62%,0.65)' }}
                  whileTap={{ scale: 0.97 }}
                  className="relative w-full h-13 flex items-center justify-center gap-2.5 rounded-2xl overflow-hidden text-white font-black text-[11px] uppercase tracking-widest"
                  style={{ background: Joker, boxShadow: '0 0 22px -5px hsla(0,100%,62%,0.50)', height: 52, border: 'none', cursor: 'pointer' }}
                >
                  <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.40),transparent)' }} />
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span key="check" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <Check className="w-4 h-4" /> Copied!
                      </motion.span>
                    ) : (
                      <motion.span key="copy" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <Copy className="w-4 h-4" /> Copy Referral Link
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                {shareUrl && (
                  <div className="px-4 py-3 rounded-xl" style={{ background: 'hsla(0,0%,100%,0.02)', border: '1px solid hsla(0,0%,100%,0.05)' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'hsla(0,0%,100%,0.22)' }}>Share URL</p>
                    <p className="text-[11px] font-mono truncate" style={{ color: 'hsla(0,0%,100%,0.38)' }}>{shareUrl}</p>
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3.5 rounded-xl" style={{ background: 'hsla(0,0%,62%,0.06)', border: '1px solid hsla(0,0%,62%,0.14)' }}>
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4" style={{ color: VIOLET }} />
                    <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'hsla(0,0%,100%,0.38)' }}>Total Referrals</span>
                  </div>
                  <span className="text-lg font-black tabular-nums" style={{ color: VIOLET, textShadow: '0 0 16px hsla(0,0%,62%,0.50)' }}>
                    {stats?.totalReferrals ?? 0}
                  </span>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28 }}
              className="rounded-3xl overflow-hidden relative"
              style={{ background: CARD, border: `1px solid ${BORDER}`, backdropFilter: 'blur(20px)' }}
            >
              <JokerBar />
              <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid hsla(0,100%,62%,0.07)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'hsla(0,0%,62%,0.10)', border: '1px solid hsla(0,0%,62%,0.20)' }}>
                  <Star className="w-4 h-4" style={{ color: VIOLET }} />
                </div>
                <p className="text-sm font-black uppercase tracking-widest text-white">How It Works</p>
              </div>

              <div className="p-6 space-y-5">
                {[
                  { step: '01', title: 'Share Your Link',  desc: 'Distribute your unique referral link across your network.', icon: Share2 },
                  { step: '02', title: 'They Sign Up',     desc: 'New users register using your code — they get access, you get credit.', icon: UserPlus },
                  { step: '03', title: 'Build Your Rank',  desc: 'Watch your network grow and climb the recruiter leaderboard.', icon: TrendingUp },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="shrink-0 mt-0.5 w-8 text-center">
                      <span className="text-2xl font-black leading-none bg-clip-text text-transparent select-none" style={{ backgroundImage: Joker }}>{item.step}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <item.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: PINK }} />
                        <span className="text-xs font-black uppercase tracking-widest text-white">{item.title}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'hsla(0,0%,100%,0.35)' }}>{item.desc}</p>
                    </div>
                    {i < 2 && <ChevronRight className="w-3.5 h-3.5 self-start mt-1 flex-shrink-0 hidden" style={{ color: 'hsla(0,100%,62%,0.20)' }} />}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22 }}
            className="lg:col-span-2"
          >
            <SectionLabel>Recent Recruits</SectionLabel>

            <div
              className="rounded-3xl overflow-hidden relative flex flex-col"
              style={{ background: CARD, border: '1px solid hsla(0,100%,62%,0.14)', backdropFilter: 'blur(20px)', minHeight: 420 }}
            >
              <JokerBar />
              <div className="flex items-center justify-between px-7 py-5 flex-shrink-0" style={{ borderBottom: '1px solid hsla(0,100%,62%,0.07)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'hsla(0,100%,62%,0.10)', border: '1px solid hsla(0,100%,62%,0.18)' }}>
                    <UserPlus className="w-4 h-4" style={{ color: PINK }} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: 'hsla(0,100%,62%,0.50)' }}>Your Network</p>
                    <p className="text-sm font-black uppercase tracking-widest text-white leading-none">Recruits</p>
                  </div>
                </div>
                {stats && stats.totalReferrals > 0 && (
                  <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ background: 'hsla(0,100%,62%,0.10)', border: '1px solid hsla(0,100%,62%,0.22)', color: PINK }}>
                    {stats.totalReferrals} members
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-x-auto">
                {stats?.referrals && stats.referrals.length > 0 ? (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ background: 'hsla(0,100%,62%,0.02)' }}>
                        {['User', 'Rank', 'Plan', 'Joined'].map((col, i) => (
                          <th key={col} className="py-3 text-left text-[9px] font-black uppercase tracking-[0.22em]"
                            style={{ padding: i === 0 ? '12px 28px' : '12px 16px', color: 'hsla(0,0%,100%,0.22)', borderBottom: '1px solid hsla(0,100%,62%,0.06)' }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.referrals.map((ref, i) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 + i * 0.04 }}
                          style={{ borderBottom: '1px solid hsla(0,100%,62%,0.04)', transition: 'background 0.15s' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsla(0,100%,62%,0.04)' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          <td style={{ padding: '14px 28px' }}>
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black uppercase"
                                style={{ background: 'hsla(0,100%,62%,0.12)', border: '1px solid hsla(0,100%,62%,0.22)', color: PINK }}
                              >
                                {ref.username.charAt(0)}
                              </div>
                              <span className="text-sm font-bold text-white">{ref.username}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                              style={{ background: 'hsla(0,100%,62%,0.10)', border: '1px solid hsla(0,100%,62%,0.22)', color: PINK }}>
                              {ref.rank}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                              style={ref.plan?.toLowerCase() !== 'free'
                                ? { background: 'hsla(0,0%,62%,0.12)', border: '1px solid hsla(0,0%,62%,0.25)', color: VIOLET }
                                : { background: 'hsla(0,0%,100%,0.04)', border: '1px solid hsla(0,0%,100%,0.09)', color: 'hsla(0,0%,100%,0.32)' }
                              }
                            >
                              {ref.plan}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: 'hsla(0,0%,100%,0.20)' }} />
                              <span className="text-xs font-medium" style={{ color: 'hsla(0,0%,100%,0.38)' }}>{formatDate(ref.createdAt)}</span>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  /* Empty state */
                  <div className="flex flex-col items-center justify-center h-full py-24 px-8">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.30 }}
                      className="flex flex-col items-center gap-5 text-center"
                    >
                      <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
                        {[0, 1].map(i => (
                          <motion.div
                            key={i}
                            className="absolute rounded-full"
                            style={{ border: '1px solid hsla(0,100%,62%,0.14)', inset: 0 }}
                            animate={{ scale: [1, 2.0, 2.0], opacity: [0.5, 0, 0] }}
                            transition={{ duration: 2.8, repeat: Infinity, delay: i * 1.0, ease: 'easeOut' }}
                          />
                        ))}
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'hsla(270,45%,5%,0.90)', border: '1px solid hsla(0,100%,62%,0.14)' }}>
                          <Users className="w-9 h-9" style={{ color: 'hsla(0,100%,62%,0.30)' }} />
                        </div>
                      </div>

                      <div>
                        <p className="text-base font-black uppercase tracking-widest mb-1.5" style={{ color: 'hsla(0,0%,100%,0.20)' }}>No Recruits Yet</p>
                        <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'hsla(0,0%,100%,0.18)' }}>
                          Share your referral link to start building your elite network and climb the ranks.
                        </p>
                      </div>

                      <motion.button
                        onClick={copyToClipboard}
                        whileHover={{ scale: 1.04, boxShadow: '0 0 24px -6px hsla(0,100%,62%,0.50)' }}
                        whileTap={{ scale: 0.96 }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest text-white"
                        style={{ background: Joker, boxShadow: '0 0 18px -6px hsla(0,100%,62%,0.40)', border: 'none', cursor: 'pointer' }}
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied!' : 'Copy Your Link'}
                      </motion.button>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      {alert && <AlertBox message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
    </div>
  )
}
