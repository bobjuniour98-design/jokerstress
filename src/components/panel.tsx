'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Terminal, Server, Globe2, X, ChevronRight, Zap, Radio, Clock, Shield, Activity } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import Menu from "@/components/menu"
import { signIn, useSession } from "next-auth/react"
import AlertBox from "./alert-box"
import { motion, AnimatePresence } from "framer-motion"

interface Attack {
  id: number
  target: string
  methodName: string
  expiresAt: string
  layer: "4" | "7"
  duration?: number
}

interface Method {
  name: string
  displayName: string
  category: string
  vip: boolean
  freeCanUse: boolean
  type: "l4" | "l7"
}

interface Plan {
  name: string
  concurrent: number
  attackDuration: number
  vipMethods: boolean
  freeCanUse: boolean
}

interface AttackData {
  layer: "4" | "7"
  target: string
  port?: string
  duration: number
  methodName: string
  additionalParams: {
    subnet?: string
    ratePerProxy?: number
    size?: string
    requestMethod?: "GET" | "POST" | "HEAD"
  }
  concurrents: number
}

const PINK    = 'hsl(0,100%,62%)'
const VIOLET  = 'hsl(0,0%,62%)'
const Joker   = 'linear-gradient(135deg,hsl(0,100%,58%),hsl(0,0%,58%))'
const GLOW_SM = '0 0 22px -5px hsla(0,100%,62%,0.55), 0 0 55px -15px hsla(0,0%,62%,0.30)'
const GLOW_LG = '0 0 36px -6px hsla(0,100%,62%,0.75), 0 0 80px -20px hsla(0,0%,62%,0.45)'
const CARD    = 'hsla(270,45%,5%,0.88)'
const BORDER  = 'hsla(0,100%,62%,0.10)'

function ProgressRing({ pct, remaining, id }: { pct: number; remaining: number; id: number }) {
  const r = 30
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.max(0, Math.min(1, pct / 100)))
  const gid = `cpg-${id}`
  return (
    <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
      <svg viewBox="0 0 72 72" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="hsla(0,100%,62%,0.08)" strokeWidth="3.5" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={`url(#${gid})`} strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={PINK} />
            <stop offset="100%" stopColor={VIOLET} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-black text-white tabular-nums leading-none">{remaining}</span>
        <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: 'hsla(0,100%,62%,0.50)' }}>SEC</span>
      </div>
    </div>
  )
}

function AttackCard({ attack, remaining, pct, onStop }: {
  attack: Attack; remaining: number; pct: number; onStop: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
      className="relative rounded-2xl overflow-hidden group"
      style={{ background: CARD, border: `1px solid hsla(0,100%,62%,0.15)`, backdropFilter: 'blur(20px)' }}
      whileHover={{ borderColor: 'hsla(0,100%,62%,0.32)', boxShadow: '0 0 28px -8px hsla(0,100%,62%,0.35), 0 0 60px -20px hsla(0,0%,62%,0.20)' }}
    >
      <div style={{ height: 2, background: Joker }} />
      <div className="absolute top-0.5 left-0 right-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,80%,0.30),transparent)' }} />
      <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 pointer-events-none blur-2xl" style={{ background: 'hsla(0,100%,62%,0.10)' }} />
      <div className="p-4 flex items-center gap-4 relative z-10">
        <ProgressRing pct={pct} remaining={remaining} id={attack.id} />
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-white font-black text-sm truncate">{attack.target}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: 'hsla(0,100%,62%,0.12)', border: '1px solid hsla(0,100%,62%,0.25)', color: PINK }}>
              L{attack.layer}
            </span>
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{attack.methodName}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'hsla(0,100%,62%,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: Joker }}
              initial={{ width: '100%' }}
              animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>
        <button
          onClick={onStop}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={{ color: 'hsl(0,84%,65%)', border: '1px solid hsla(0,84%,60%,0.20)', background: 'hsla(0,84%,60%,0.05)' }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'hsla(0,84%,60%,0.15)'; el.style.boxShadow = '0 0 14px -4px hsla(0,84%,60%,0.40)' }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'hsla(0,84%,60%,0.05)'; el.style.boxShadow = 'none' }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

function StatPill({ icon: Icon, label, value, accent = false }: {
  icon: React.ElementType; label: string; value: string | number; accent?: boolean
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
      style={{
        background: accent ? 'hsla(0,100%,62%,0.08)' : CARD,
        border: `1px solid ${accent ? 'hsla(0,100%,62%,0.20)' : BORDER}`,
        backdropFilter: 'blur(16px)',
      }}
    >
      <Icon className="h-4 w-4 flex-shrink-0" style={{ color: PINK }} />
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-0.5" style={{ color: 'hsla(0,0%,100%,0.30)' }}>{label}</p>
        <p className="text-sm font-black text-white leading-none">{value}</p>
      </div>
    </div>
  )
}

export default function AttackControlPanel() {
  const { status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [layer, setLayer] = useState<"4" | "7">("4")
  const [duration, setDuration] = useState<number>(60)
  const [concurrents, setConcurrents] = useState<number>(1)
  const [address, setAddress] = useState("")
  const [subnet, setSubnet] = useState<string>("32")
  const [port, setPort] = useState<string>("80")
  const [method, setMethod] = useState<string>("")
  const [website, setWebsite] = useState("")
  const [layer7Method, setLayer7Method] = useState<string>("")
  const [requestMethod, setRequestMethod] = useState<"GET" | "POST" | "HEAD">("GET")
  const [ratePerProxy, setRatePerProxy] = useState<number>(64)
  const [size, setSize] = useState<string>("64")
  const [activeAttacks, setActiveAttacks] = useState<Attack[]>([])
  const stoppingAllRef = useRef(false)
  const [methods, setMethods] = useState<Method[]>([])
  const [filteredMethods, setFilteredMethods] = useState<Method[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [plan, setPlan] = useState<Plan | null>(null)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [alert, setAlert] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [launching, setLaunching] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") signIn()
  }, [status])

  const fetchMethods = useCallback(async (type: "l4" | "l7") => {
    try {
      const response = await fetch(`/api/methods?type=${type}`)
      const data = await response.json()
      if (response.ok) {
        const fetchedMethods: Method[] = data.methods
        setMethods(fetchedMethods)
        const uniqueCategories = Array.from(new Set(fetchedMethods.map((m) => m.category).filter(Boolean)))
        setCategories(["All", ...uniqueCategories])
        setSelectedCategory("All")
        const defaultMethod = fetchedMethods.length > 0 ? fetchedMethods[0].name : ""
        if (type === "l4") setMethod(defaultMethod)
        else setLayer7Method(defaultMethod)
      } else {
        setAlert({ message: `Error fetching methods: ${data.message}`, type: "error" })
      }
    } catch (err) {
      setAlert({ message: `Error fetching methods: ${err instanceof Error ? err.message : "Unknown error"}`, type: "error" })
    }
  }, [])

  const fetchUserPlan = useCallback(async () => {
    try {
      const response = await fetch("/api/user/plan")
      const data = await response.json()
      if (response.ok) setPlan(data.plan)
      else setAlert({ message: `Error fetching user plan: ${data.message}`, type: "error" })
    } catch (err) {
      setAlert({ message: `Error fetching user plan: ${err instanceof Error ? err.message : "Unknown error"}`, type: "error" })
    }
  }, [])

  const fetchActiveAttacks = useCallback(async () => {
    if (stoppingAllRef.current) return
    try {
      const response = await fetch("/api/attack/active")
      const data = await response.json()
      if (response.ok) setActiveAttacks(data.attacks)
      else setAlert({ message: `Error fetching active attacks: ${data.message}`, type: "error" })
    } catch (err) {
      setAlert({ message: `Error fetching active attacks: ${err instanceof Error ? err.message : "Unknown error"}`, type: "error" })
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      fetchMethods(layer === "4" ? "l4" : "l7")
      fetchUserPlan()
      fetchActiveAttacks()
    }
  }, [status, layer, fetchMethods, fetchUserPlan, fetchActiveAttacks])

  useEffect(() => {
    const fetchInterval = setInterval(() => fetchActiveAttacks(), 5000)
    return () => clearInterval(fetchInterval)
  }, [fetchActiveAttacks])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setActiveAttacks((prev) => prev.filter((a) => new Date(a.expiresAt) > currentTime))
  }, [currentTime])

  useEffect(() => {
    if (selectedCategory === "All") setFilteredMethods(methods)
    else setFilteredMethods(methods.filter((m) => m.category === selectedCategory))
  }, [selectedCategory, methods])

  useEffect(() => {
    const currentMethod = layer === "4" ? method : layer7Method
    if (!filteredMethods.some((m) => m.name === currentMethod)) {
      const newMethod = selectedCategory === "All"
        ? methods.length > 0 ? methods[0].name : ""
        : methods.find((m) => m.category === selectedCategory)?.name || ""
      if (layer === "4") setMethod(newMethod)
      else setLayer7Method(newMethod)
    }
  }, [selectedCategory, methods, filteredMethods, method, layer, layer7Method])

  const handleRequestMethodChange = (value: string) => {
    if (value === "GET" || value === "POST" || value === "HEAD") setRequestMethod(value as "GET" | "POST" | "HEAD")
  }

  const handleSendAttack = async () => {
    if (!plan) { setAlert({ message: "Unable to retrieve your plan details.", type: "error" }); return }
    if (activeAttacks.length + concurrents > plan.concurrent) {
      setAlert({ message: `You can only initiate ${plan.concurrent - activeAttacks.length} more concurrent attack(s).`, type: "error" }); return
    }
    const ipRegex = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)(\.(25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/
    const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\- .\/?%&=]*)?$/i
    if (layer === "4" && !ipRegex.test(address)) { setAlert({ message: "Please enter a valid IP address.", type: "error" }); return }
    if (layer === "7" && !urlRegex.test(website)) { setAlert({ message: "Please enter a valid website URL.", type: "error" }); return }
    if (duration > plan.attackDuration) { setAlert({ message: `Maximum allowed duration is ${plan.attackDuration} seconds.`, type: "error" }); return }
    setLaunching(true)
    const attackData: AttackData = {
      layer, target: layer === "4" ? address : website,
      port: layer === "4" ? port : undefined, duration,
      methodName: layer === "4" ? method : layer7Method,
      additionalParams: layer === "4" ? { subnet, size } : { ratePerProxy, size, requestMethod },
      concurrents,
    }
    try {
      const response = await fetch("/api/attack/start", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(attackData),
      })
      const data = await response.json()
      if (response.ok) {
        const optimisticExpiresAt = new Date(Date.now() + duration * 1000).toISOString()
        const target = layer === "4" ? address : website
        const methodName = layer === "4" ? method : layer7Method
        const optimistic: Attack[] = Array.from({ length: concurrents }, (_, i) => ({
          id: -(Date.now() + i), target, methodName, expiresAt: optimisticExpiresAt, layer, duration,
        }))
        setActiveAttacks((prev) => [...prev, ...optimistic])
        setAlert({ message: "Attack(s) initiated successfully.", type: "success" })
        fetchActiveAttacks()
      } else {
        const failureDetail = Array.isArray(data.failures) && data.failures.length > 0
          ? data.failures.map((f: { reason?: string }) => f.reason).filter(Boolean).join("; ") : ""
        setAlert({ message: failureDetail ? `Error: ${failureDetail}` : `Error: ${data.message ?? "Request failed"}`, type: "error" })
      }
    } catch (err) {
      setAlert({ message: `An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`, type: "error" })
    } finally {
      setLaunching(false)
    }
  }

  const handleStopAttack = async (attack: Attack) => {
    try {
      const response = await fetch("/api/attack/stop", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attackId: attack.id }),
      })
      const data = await response.json()
      if (response.ok) { fetchActiveAttacks(); setAlert({ message: "Attack stopped successfully.", type: "success" }) }
      else setAlert({ message: `Error: ${data.message}`, type: "error" })
    } catch (err) {
      setAlert({ message: `An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`, type: "error" })
    }
  }

  const handleStopAll = async () => {
    const previousAttacks = activeAttacks
    stoppingAllRef.current = true
    setActiveAttacks([])
    try {
      const response = await fetch("/api/attack/stopall", { method: "POST", headers: { "Content-Type": "application/json" } })
      const data = await response.json()
      if (response.ok) {
        setAlert({ message: "All attacks stopped successfully.", type: "success" })
        setTimeout(() => { stoppingAllRef.current = false }, 2000)
      } else {
        stoppingAllRef.current = false
        setActiveAttacks(previousAttacks)
        setAlert({ message: `Error: ${data.message}`, type: "error" })
      }
    } catch (err) {
      stoppingAllRef.current = false
      setActiveAttacks(previousAttacks)
      setAlert({ message: `An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`, type: "error" })
    }
  }

  const calculateRemainingSeconds = (expiresAt: string) =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - currentTime.getTime()) / 1000))

  const usedSlots = activeAttacks.length
  const maxSlots = plan?.concurrent || 0
  const slotsPct = maxSlots > 0 ? (usedSlots / maxSlots) * 100 : 0

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#08000f' }}>
      <div className="fixed top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[160px] pointer-events-none" style={{ background: 'hsla(0,100%,62%,0.09)' }} />
      <div className="fixed bottom-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full blur-[160px] pointer-events-none" style={{ background: 'hsla(0,0%,62%,0.07)' }} />
      <Menu />
      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-5"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{ background: 'hsl(142,76%,50%)', boxShadow: '0 0 8px hsl(142,76%,50%)' }}
                  animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
                <span className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: 'hsl(142,76%,55%)' }}>SYSTEM ONLINE</span>
                <span className="text-[9px] text-gray-700 font-black">—</span>
                <span suppressHydrationWarning className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'hsla(0,100%,62%,0.50)' }}>
                  {currentTime.toUTCString().replace('GMT', 'UTC')}
                </span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter uppercase text-white leading-none">
                Tactical <span className="bg-clip-text text-transparent" style={{ backgroundImage: Joker }}>Control</span>
              </h1>
              <p className="text-gray-600 text-sm font-bold mt-2">Configure and deploy network stress tests from the central hub.</p>
            </div>
            <motion.button
              onClick={handleStopAll}
              whileHover={{ scale: 1.03, boxShadow: '0 0 28px -6px hsla(0,84%,60%,0.65)' }}
              whileTap={{ scale: 0.96 }}
              className="h-12 px-7 font-black uppercase tracking-widest text-[11px] rounded-2xl transition-colors relative overflow-hidden flex-shrink-0"
              style={{
                background: 'hsla(0,84%,60%,0.08)',
                color: 'hsl(0,84%,70%)',
                border: '1px solid hsla(0,84%,60%,0.25)',
              }}
            >
              <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,84%,75%,0.40),transparent)' }} />
              <X className="inline h-3.5 w-3.5 mr-2 -mt-0.5" />
              Abort All
            </motion.button>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatPill icon={Shield} label="Plan" value={plan?.name ?? '—'} accent />
            <StatPill icon={Clock} label="Max Duration" value={plan ? `${plan.attackDuration}s` : '—'} />
            <StatPill icon={Server} label="Concurrents" value={plan ? `${usedSlots} / ${maxSlots}` : '—'} />
            <StatPill icon={Activity} label="Active Now" value={usedSlots} />
          </div>
        </motion.div>

        {plan && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0.95 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl px-6 py-4 flex items-center gap-5"
            style={{ background: CARD, border: `1px solid ${BORDER}`, backdropFilter: 'blur(16px)' }}
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">Slot Capacity</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'hsla(0,100%,62%,0.08)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: Joker }}
                initial={{ width: 0 }}
                animate={{ width: `${slotsPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-black text-white whitespace-nowrap tabular-nums">{usedSlots}/{maxSlots}</span>
            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap" style={{ color: PINK }}>{Math.round(slotsPct)}%</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg,hsla(0,100%,62%,0.25),transparent)` }} />
              <span className="text-[9px] font-black uppercase tracking-[0.28em]" style={{ color: 'hsla(0,100%,62%,0.45)' }}>Attack Config</span>
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg,transparent,hsla(0,0%,62%,0.25))` }} />
            </div>

            <div
              className="rounded-3xl overflow-hidden relative"
              style={{ background: CARD, border: `1px solid ${BORDER}`, backdropFilter: 'blur(20px)' }}
            >
              <div style={{ height: 2, background: Joker }} />
              <div className="absolute top-0.5 inset-x-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,80%,0.35),transparent)' }} />

              <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid hsla(0,100%,62%,0.07)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'hsla(0,100%,62%,0.10)', border: '1px solid hsla(0,100%,62%,0.18)' }}>
                  <Terminal className="h-4 w-4" style={{ color: PINK }} />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-widest uppercase text-white">Configurations</h2>
                  <p className="text-[9px] font-bold text-gray-600">Set parameters before launch</p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2.5">
                  <FieldLabel>Protocol Layer</FieldLabel>
                  <div className="flex p-1 rounded-2xl gap-1" style={{ background: 'hsla(270,45%,8%,0.80)', border: '1px solid hsla(0,100%,62%,0.07)' }}>
                    {[
                      { val: "4" as const, label: "Layer 4", Icon: Server },
                      { val: "7" as const, label: "Layer 7", Icon: Globe2 },
                    ].map(({ val, label, Icon }) => (
                      <button
                        key={val}
                        onClick={() => setLayer(val)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200"
                        style={layer === val
                          ? { background: Joker, color: '#fff', boxShadow: GLOW_SM }
                          : { color: 'rgb(75,85,99)' }
                        }
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <Divider />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={layer}
                    initial={{ opacity: 0, x: layer === "4" ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: layer === "4" ? 10 : -10 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    {layer === "4" ? (
                      <>
                        <Field label="IP Address / Target">
                          <Input value={address} onChange={(e) => setAddress(e.target.value)} className="premium-input h-11 font-bold" placeholder="0.0.0.0" />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Subnet">
                            <Select value={subnet} onValueChange={setSubnet}>
                              <SelectTrigger className="premium-input h-11 font-bold"><SelectValue /></SelectTrigger>
                              <SelectContent style={{ background: 'hsla(270,45%,5%,0.97)', border: '1px solid hsla(0,100%,62%,0.12)' }}>
                                <SelectItem value="32" className="font-bold">/32</SelectItem>
                                <SelectItem value="24" className="font-bold">/24</SelectItem>
                                <SelectItem value="16" className="font-bold">/16</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field label="Port">
                            <Input type="number" value={port} onChange={(e) => setPort(e.target.value)} className="premium-input h-11 font-bold" placeholder="80" />
                          </Field>
                        </div>
                        <Field label="Packet Size">
                          <div className="relative">
                            <Input type="number" value={size} onChange={(e) => setSize(e.target.value)} className="premium-input h-11 font-bold pr-14" placeholder="64" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600">BYTES</span>
                          </div>
                        </Field>
                      </>
                    ) : (
                      <>
                        <Field label="Target URL">
                          <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="premium-input h-11 font-bold" placeholder="https://target.com" />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Request Type">
                            <Select value={requestMethod} onValueChange={handleRequestMethodChange}>
                              <SelectTrigger className="premium-input h-11 font-bold"><SelectValue /></SelectTrigger>
                              <SelectContent style={{ background: 'hsla(270,45%,5%,0.97)', border: '1px solid hsla(0,100%,62%,0.12)' }}>
                                <SelectItem value="GET" className="font-bold">GET</SelectItem>
                                <SelectItem value="POST" className="font-bold">POST</SelectItem>
                                <SelectItem value="HEAD" className="font-bold">HEAD</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field label="Rate / Proxy">
                            <Input type="number" value={ratePerProxy} onChange={(e) => setRatePerProxy(Number(e.target.value))} className="premium-input h-11 font-bold" />
                          </Field>
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                <Divider />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FieldLabel>Duration</FieldLabel>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl font-black bg-clip-text text-transparent tabular-nums" style={{ backgroundImage: Joker }}>{duration}</span>
                      <span className="text-[10px] font-black text-gray-600 uppercase">sec</span>
                    </div>
                  </div>
                  <Slider
                    min={1}
                    max={plan?.attackDuration || 300}
                    step={1}
                    value={[duration]}
                    onValueChange={(v) => setDuration(v[0])}
                    className="py-2"
                  />
                  <div className="flex justify-between text-[9px] font-black text-gray-700 uppercase tracking-widest">
                    <span>1s</span>
                    <span>Max {plan?.attackDuration || '—'}s</span>
                  </div>
                </div>

                <Divider />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FieldLabel>Attack Vector</FieldLabel>
                    {filteredMethods.length > 0 && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{
                        background: 'hsla(0,0%,62%,0.10)',
                        border: '1px solid hsla(0,0%,62%,0.18)',
                        color: 'hsl(0,0%,72%)',
                      }}>
                        {filteredMethods.filter(m => m.type === (layer === "4" ? "l4" : "l7")).length} methods
                      </span>
                    )}
                  </div>
                  <Select value={layer === "4" ? method : layer7Method} onValueChange={layer === "4" ? setMethod : setLayer7Method}>
                    <SelectTrigger
                      className="h-13 text-sm font-black"
                      style={{ background: 'hsla(0,100%,62%,0.07)', border: '1px solid hsla(0,100%,62%,0.20)', height: 52 }}
                    >
                      <SelectValue placeholder="SELECT METHOD" />
                    </SelectTrigger>
                    <SelectContent style={{ background: 'hsla(270,45%,5%,0.97)', border: '1px solid hsla(0,100%,62%,0.12)' }} className="max-h-[400px]">
                      <ScrollArea className="h-[300px]">
                        {filteredMethods
                          .filter((m) => m.type === (layer === "4" ? "l4" : "l7"))
                          .map((m) => (
                            <SelectItem key={m.name} value={m.name} className="rounded-lg font-bold py-2.5">
                              {m.displayName || m.name}
                              {m.vip && (
                                <span className="ml-2 text-[8px] px-1.5 py-0.5 rounded" style={{ background: 'hsla(0,0%,62%,0.20)', color: 'hsl(0,0%,72%)' }}>
                                  VIP
                                </span>
                              )}
                            </SelectItem>
                          ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>

                <Divider />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FieldLabel>Parallel Instances</FieldLabel>
                    <span className="text-xl font-black tabular-nums bg-clip-text text-transparent" style={{ backgroundImage: Joker }}>{concurrents}×</span>
                  </div>
                  <Slider min={1} max={plan?.concurrent || 1} step={1} value={[concurrents]} onValueChange={(v) => setConcurrents(v[0])} className="py-2" />
                </div>

                <motion.button
                  onClick={handleSendAttack}
                  disabled={!mounted || !plan || launching}
                  whileHover={mounted && !launching && plan ? { scale: 1.02, boxShadow: GLOW_LG } : {}}
                  whileTap={mounted && !launching && plan ? { scale: 0.97 } : {}}
                  className="w-full h-14 text-white font-black text-sm uppercase tracking-widest rounded-2xl border-0 relative overflow-hidden flex items-center justify-center gap-3 disabled:cursor-not-allowed"
                  style={{
                    background: (!mounted || !plan || launching) ? 'hsla(0,100%,62%,0.25)' : Joker,
                    boxShadow: (!mounted || !plan || launching) ? 'none' : GLOW_SM,
                    transition: 'box-shadow 0.25s ease',
                  }}
                >
                  {mounted && !launching && plan && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      animate={{ backgroundPosition: ['200% center', '-200% center'] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                      style={{
                        background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.16) 50%,transparent 70%)',
                        backgroundSize: '200% 100%',
                      }}
                    />
                  )}
                  {mounted && !launching && plan && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      animate={{ boxShadow: ['0 0 0 0px hsla(0,100%,62%,0.45)', '0 0 0 7px hsla(0,100%,62%,0)'] }}
                      transition={{ duration: 2.2, repeat: Infinity }}
                    />
                  )}
                  <span className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)' }} />
                  {launching ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      LAUNCHING…
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 fill-current" />
                      LAUNCH ATTACK
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg,hsla(0,0%,62%,0.25),transparent)` }} />
              <span className="text-[9px] font-black uppercase tracking-[0.28em]" style={{ color: 'hsla(0,0%,62%,0.45)' }}>Live Operations</span>
              <div className="h-px flex-1" style={{ background: `linear-gradient(90deg,transparent,hsla(0,100%,62%,0.25))` }} />
            </div>

            <div
              className="rounded-3xl overflow-hidden relative"
              style={{ background: CARD, border: `1px solid ${BORDER}`, backdropFilter: 'blur(20px)', minHeight: 560 }}
            >
              <div style={{ height: 2, background: 'linear-gradient(90deg,hsl(0,0%,58%),hsl(0,100%,58%)' }} />
              <div className="absolute top-0.5 inset-x-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,0%,80%,0.30),transparent)' }} />

              <div className="px-7 py-5 flex items-center justify-between relative z-10" style={{ borderBottom: '1px solid hsla(0,100%,62%,0.07)' }}>
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 flex items-center justify-center rounded-xl" style={{ background: 'hsla(0,0%,62%,0.10)', border: '1px solid hsla(0,0%,62%,0.18)' }}>
                    <Radio className="h-4 w-4" style={{ color: VIOLET }} />
                    {activeAttacks.length > 0 && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500"
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                        style={{ boxShadow: '0 0 6px hsl(142,76%,50%)' }}
                      />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-wide uppercase text-white leading-none">Live Operations</h2>
                    <p className="text-[9px] font-bold text-gray-600 mt-0.5">Real-time attack monitoring</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'hsla(0,100%,62%,0.40)' }}>SIGNAL</span>
                    <div className="flex items-end gap-0.5" style={{ height: 16 }}>
                      {Array.from({ length: 7 }).map((_, i) => {
                        const active = maxSlots > 0 && (i / 7) < (usedSlots / maxSlots)
                        return (
                          <motion.div
                            key={i}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: 0.3 + i * 0.04 }}
                            className="rounded-sm origin-bottom"
                            style={{
                              width: 4,
                              height: `${35 + i * 10}%`,
                              background: active ? `hsl(${322 - i * 7},95%,${62 - i * 2}%)` : 'hsla(0,100%,62%,0.10)',
                              boxShadow: active ? `0 0 5px hsla(${322 - i * 7},95%,62%,0.55)` : 'none',
                              transition: 'background 0.4s, box-shadow 0.4s',
                            }}
                          />
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'hsla(0,100%,62%,0.06)', border: '1px solid hsla(0,100%,62%,0.12)' }}>
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Active</span>
                    <span className="text-sm font-black bg-clip-text text-transparent tabular-nums" style={{ backgroundImage: Joker }}>
                      {activeAttacks.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 relative z-10">
                <AnimatePresence mode="popLayout">
                  {activeAttacks.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      className="flex flex-col items-center justify-center py-24 space-y-8"
                    >
                      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="absolute rounded-full"
                            style={{ border: '1px solid hsla(0,100%,62%,0.16)', inset: 0 }}
                            animate={{ scale: [1, 2.2, 2.2], opacity: [0.6, 0, 0] }}
                            transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.9, ease: 'easeOut' }}
                          />
                        ))}
                        <div
                          className="w-20 h-20 rounded-2xl flex items-center justify-center relative"
                          style={{ background: 'hsla(270,45%,5%,0.90)', border: '1px solid hsla(0,100%,62%,0.16)', boxShadow: '0 0 40px -10px hsla(0,100%,62%,0.20)' }}
                        >
                          <Terminal className="h-9 w-9" style={{ color: 'hsla(0,100%,62%,0.35)' }} />
                        </div>
                        <motion.span
                          className="absolute -bottom-5 text-base font-black"
                          style={{ color: PINK }}
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ duration: 1.1, repeat: Infinity }}
                        >
                          ▮
                        </motion.span>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-lg font-black uppercase tracking-[0.3em]" style={{ color: 'hsla(0,0%,100%,0.14)' }}>
                          No Active Signals
                        </p>
                        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'hsla(0,0%,100%,0.08)' }}>
                          Configure parameters and launch to begin operations
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {['Target', 'Method', 'Duration', 'Launch'].map((step, i) => (
                          <div key={step} className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{
                              background: 'hsla(0,100%,62%,0.05)',
                              border: '1px solid hsla(0,100%,62%,0.09)',
                            }}>
                              <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: 'hsla(0,100%,62%,0.28)' }}>{i + 1}</span>
                              <span className="text-[9px] font-black uppercase tracking-wide" style={{ color: 'hsla(0,100%,62%,0.28)' }}>{step}</span>
                            </div>
                            {i < 3 && <ChevronRight className="h-2.5 w-2.5" style={{ color: 'hsla(0,100%,62%,0.14)' }} />}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {activeAttacks.map((attack) => {
                        const remaining = calculateRemainingSeconds(attack.expiresAt)
                        const totalDuration = attack.duration ?? plan?.attackDuration ?? remaining
                        const pct = totalDuration > 0 ? (remaining / totalDuration) * 100 : 0
                        return (
                          <AttackCard
                            key={attack.id}
                            attack={attack}
                            remaining={remaining}
                            pct={pct}
                            onStop={() => handleStopAttack(attack)}
                          />
                        )
                      })}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      {alert && <AlertBox message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
    </div>
  )
}

function Divider() {
  return <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,62%,0.09),transparent)' }} />
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{children}</p>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}