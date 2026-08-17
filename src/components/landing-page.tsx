'use client'
import { motion, useMotionValue, useTransform, AnimatePresence, useInView } from 'framer-motion'
import { Shield, Users, Code, Bitcoin, Zap, Globe, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

function ChaosIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/harley.jpg"
      alt="Harley Logo"
      style={{ width: size, height: size }}
      className={`object-cover rounded-full border border-green-500/30 ${className}`}
    />
  )
}

function TiltCard({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotX = useTransform(y, [-0.5, 0.5], ['6deg', '-6deg'])
  const rotY = useTransform(x, [-0.5, 0.5], ['-6deg', '6deg'])
  return (
    <motion.div
      ref={ref}
      style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d', ...style }}
      className={className}
      onMouseMove={(e) => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        x.set((e.clientX - rect.left) / rect.width - 0.5)
        y.set((e.clientY - rect.top) / rect.height - 0.5)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    >
      {children}
    </motion.div>
  )
}

const PARTICLES = [
  { left: '5%', dur: 7, delay: 0, size: 8, color: 'hsl(0,100%,55%)' },
  { left: '12%', dur: 9, delay: 1.5, size: 5, color: 'hsl(0,0%,55%)' },
  { left: '20%', dur: 6, delay: 3, size: 10, color: 'hsl(0,100%,65%)' },
  { left: '30%', dur: 11, delay: 0.5, size: 6, color: 'hsl(0,0%,65%)' },
  { left: '42%', dur: 8, delay: 2, size: 7, color: 'hsl(0,100%,55%)' },
  { left: '55%', dur: 10, delay: 4, size: 5, color: 'rgba(255,255,255,0.5)' },
  { left: '65%', dur: 7, delay: 1, size: 9, color: 'hsl(0,0%,55%)' },
  { left: '75%', dur: 9, delay: 2.5, size: 6, color: 'hsl(0,100%,55%)' },
  { left: '85%', dur: 6, delay: 3.5, size: 8, color: 'hsl(0,0%,65%)' },
  { left: '93%', dur: 8, delay: 0.8, size: 5, color: 'hsl(0,100%,65%)' },
]

function ChaosParticles() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="float-particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  )
}

const SPARKLES = [
  { ox: -155, oy: -70, size: 7, dur: 3.2, delay: 0, color: 'hsl(0,100%,70%)' },
  { ox: 165, oy: -100, size: 4, dur: 4.0, delay: 0.9, color: 'hsl(0,0%,65%)' },
  { ox: 185, oy: 50, size: 6, dur: 3.6, delay: 1.8, color: 'rgba(255,255,255,0.85)' },
  { ox: -170, oy: 80, size: 4, dur: 5.0, delay: 2.4, color: 'hsl(0,100%,55%)' },
  { ox: 55, oy: 165, size: 5, dur: 4.5, delay: 0.6, color: 'hsl(0,0%,70%)' },
  { ox: -85, oy: 155, size: 4, dur: 3.8, delay: 3.1, color: 'hsl(0,100%,65%)' },
  { ox: 130, oy: -45, size: 5, dur: 6.0, delay: 1.3, color: 'rgba(220,255,220,0.85)' },
  { ox: -55, oy: -155, size: 6, dur: 4.2, delay: 2.9, color: 'hsl(0,0%,60%)' },
  { ox: -130, oy: -30, size: 3, dur: 5.5, delay: 0.4, color: 'hsl(135,100%,85%)' },
  { ox: 110, oy: 130, size: 3, dur: 4.8, delay: 3.7, color: 'hsl(0,0%,70%)' },
]

const GLINTS = [
  { ox: -10, oy: -155 },
  { ox: 115, oy: -75 },
  { ox: 115, oy: 75 },
  { ox: 0, oy: 155 },
]

function GlintStar({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.div
      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.4, 0.5] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{
        position: 'absolute',
        top: '50%', left: '50%',
        marginTop: y - 10, marginLeft: x - 10,
        width: 20, height: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div style={{ position: 'absolute', width: 2, height: 18, borderRadius: 1, background: 'rgba(255,255,255,0.90)', boxShadow: '0 0 6px 2px rgba(200,255,200,0.70)' }} />
      <div style={{ position: 'absolute', width: 18, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.90)', boxShadow: '0 0 6px 2px rgba(200,255,200,0.70)' }} />
    </motion.div>
  )
}

function Hero3DChaos() {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: 460, height: 500 }}
    >
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 48%, hsla(0,100%,55%,0.22) 0%, hsla(0,0%,55%,0.10) 45%, transparent 70%)',
        filter: 'blur(28px)',
      }} />
      {SPARKLES.map((s, i) => (
        <motion.div
          key={i}
          animate={{ y: [s.oy, s.oy - 18, s.oy], opacity: [0.55, 1, 0.55], scale: [1, 1.35, 1] }}
          transition={{ duration: s.dur, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            marginTop: s.oy, marginLeft: s.ox,
            width: s.size, height: s.size,
            borderRadius: '50%',
            background: s.color,
            boxShadow: `0 0 ${s.size * 3}px ${s.size}px ${s.color}`,
          }}
        />
      ))}
      {GLINTS.map((g, i) => (
        <GlintStar key={i} x={g.ox} y={g.oy} delay={i * 0.7} />
      ))}
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'relative', zIndex: 10 }}
      >
        <motion.div
          animate={{ rotateY: [-14, 14, -14] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ perspective: '700px', display: 'block' }}
        >
          <svg
            viewBox="0 0 400 400"
            width="300" height="300"
            style={{ overflow: 'visible', display: 'block' }}
          >
            <defs>
              <linearGradient id="gF6" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(135,100%,90%)" />
                <stop offset="100%" stopColor="hsl(0,100%,65%)" />
              </linearGradient>
              <linearGradient id="gF1" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(0,100%,75%)" />
                <stop offset="100%" stopColor="hsl(0,100%,50%)" />
              </linearGradient>
              <linearGradient id="gF2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(0,0%,65%)" />
                <stop offset="100%" stopColor="hsl(0,0%,45%)" />
              </linearGradient>
              <linearGradient id="gF3" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(0,0%,50%)" />
                <stop offset="100%" stopColor="hsl(0,0%,30%)" />
              </linearGradient>
              <linearGradient id="gF4" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(0,0%,20%)" />
                <stop offset="100%" stopColor="hsl(0,0%,40%)" />
              </linearGradient>
              <linearGradient id="gF5" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(0,0%,55%)" />
                <stop offset="100%" stopColor="hsl(0,0%,35%)" />
              </linearGradient>
              <linearGradient id="gOutline" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsla(0,100%,88%,0.80)" />
                <stop offset="50%" stopColor="hsla(0,0%,75%,0.40)" />
                <stop offset="100%" stopColor="hsla(0,0%,60%,0.20)" />
              </linearGradient>
            </defs>
            <polygon
              points="200,48 320,128 320,272 200,352 80,272 80,128"
              fill="hsla(0,100%,55%,0.16)"
              style={{ filter: 'blur(22px)' }}
            />
            <polygon
              points="200,48 320,128 320,272 200,352 80,272 80,128"
              fill="none"
              stroke="hsla(0,100%,65%,0.30)"
              strokeWidth="24"
              strokeLinejoin="round"
              style={{ filter: 'blur(14px)' }}
            />
            <polygon points="200,200 200,48 320,128" fill="url(#gF1)" />
            <polygon points="200,200 320,128 320,272" fill="url(#gF2)" />
            <polygon points="200,200 320,272 200,352" fill="url(#gF3)" />
            <polygon points="200,200 200,352 80,272" fill="url(#gF4)" />
            <polygon points="200,200 80,272 80,128" fill="url(#gF5)" />
            <polygon points="200,200 80,128 200,48" fill="url(#gF6)" />
            {([[200,48],[320,128],[320,272],[200,352],[80,272],[80,128]] as [number,number][]).map(([vx,vy], i) => (
              <line key={i}
                x1={200} y1={200} x2={vx} y2={vy}
                stroke="rgba(255,255,255,0.16)" strokeWidth="1.5"
              />
            ))}
            <polygon
              points="200,48 320,128 320,272 200,352 80,272 80,128"
              fill="none"
              stroke="url(#gOutline)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <ellipse cx="142" cy="106" rx="46" ry="30"
              fill="rgba(255,255,255,0.72)" transform="rotate(-30, 142, 106)" />
            <ellipse cx="132" cy="98" rx="22" ry="13"
              fill="rgba(255,255,255,0.90)" transform="rotate(-30, 132, 98)" />
            <ellipse cx="270" cy="195" rx="24" ry="13"
              fill="hsla(0,0%,88%,0.40)" transform="rotate(16, 270, 195)" />
            <polygon
              points="200,48 320,128 320,272 200,352 80,272 80,128"
              fill="none"
              stroke="rgba(190,255,190,0.10)"
              strokeWidth="40"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </motion.div>
      <div style={{
        position: 'absolute', bottom: 12, left: '50%',
        transform: 'translateX(-50%)',
        width: 220, height: 30,
        background: 'radial-gradient(ellipse, hsla(0,100%,55%,0.32) 0%, transparent 70%)',
        filter: 'blur(15px)',
      }} />
    </div>
  )
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<string | undefined>()
  return (
    <div className="min-h-screen relative overflow-x-hidden text-gray-100" style={{ backgroundColor: '#050008' }}>
      <ChaosParticles />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[60%] h-[60%] rounded-full blur-[200px]" style={{ background: 'hsla(0,100%,55%,0.14)' }} />
        <div className="absolute bottom-[-15%] right-[-5%] w-[60%] h-[60%] rounded-full blur-[200px]" style={{ background: 'hsla(0,0%,55%,0.10)' }} />
        <div className="absolute top-[30%] right-[20%] w-[25%] h-[25%] rounded-full blur-[130px]" style={{ background: 'hsla(0,100%,55%,0.07)' }} />
      </div>

      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'hsla(280,20%,4%,0.82)',
          borderBottom: '1px solid hsla(0,100%,55%,0.10)',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,70%,0.50),hsla(0,0%,70%,0.50),transparent)' }} />
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-lg" style={{ background: 'hsla(0,100%,55%,0.30)' }} />
              <ChaosIcon size={34} className="relative" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase">
              Joker<span className="shimmer-text">Stress</span>
            </span>
          </motion.div>
          <motion.div className="hidden lg:flex items-center gap-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {[
              { label: 'Services', href: '#services' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'FAQ', href: '#faq' },
            ].map((item) => (
              <Link key={item.label} href={item.href}
                className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 hover:text-white transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 right-0 h-px scale-x-0 group-hover:scale-x-100 transition-transform origin-left" style={{ background: 'linear-gradient(90deg,hsl(0,100%,55%),hsl(0,0%,55%))' }} />
              </Link>
            ))}
          </motion.div>
          <motion.div className="flex items-center gap-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <Link href="/signin">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="h-10 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl relative overflow-hidden"
                style={{
                  background: 'hsla(0,100%,55%,0.08)',
                  border: '1px solid hsla(0,100%,55%,0.22)',
                  color: 'hsl(0,100%,65%)',
                  boxShadow: '0 0 16px -6px hsla(0,100%,55%,0.30)',
                }}
              >
                <span
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,70%,0.60),transparent)' }}
                />
                Access Hub
              </motion.button>
            </Link>
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="h-11 px-8 text-white font-black text-[10px] uppercase tracking-widest rounded-xl border-0"
                style={{
                  background: 'linear-gradient(135deg,hsl(0,100%,55%),hsl(0,0%,55%))',
                  boxShadow: '0 0 24px -5px hsla(0,100%,55%,0.55), 0 0 60px -15px hsla(0,0%,55%,0.30)',
                }}
              >
                Join Network
              </motion.button>
            </Link>
          </motion.div>
        </nav>
      </header>

      <main className="relative z-10 pt-20">
        {/* Hero */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          <div className="absolute inset-0 joker-stripe opacity-40 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-24">
            <div className="space-y-10 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-full"
                style={{ background: 'hsla(0,100%,55%,0.08)', border: '1px solid hsla(0,100%,55%,0.20)' }}
              >
                <div className="w-2 h-2 rounded-full animate-ping" style={{ background: 'hsl(0,100%,55%)' }} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Next-Gen Tactical Infrastructure Live</span>
              </motion.div>
              <div className="space-y-1 font-black uppercase" style={{ letterSpacing: '-0.03em', lineHeight: 0.87 }}>
                <div className="overflow-hidden">
                  <motion.div
                    initial={{ y: '110%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="text-white"
                    style={{ fontSize: 'clamp(2.8rem, 7.5vw, 6.5rem)' }}
                  >
                    REDEFINE
                  </motion.div>
                </div>
                <div className="overflow-hidden">
                  <motion.div
                    initial={{ y: '110%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                    style={{ fontSize: 'clamp(2.8rem, 7.5vw, 6.5rem)' }}
                  >
                    <span className="text-white/55">THE&nbsp;</span>
                    <span className="shimmer-text">FRONTIER</span>
                  </motion.div>
                </div>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-gray-400 text-lg font-medium max-w-lg leading-relaxed"
              >
                Elite Layer 4 &amp; Layer 7 tactical operations. Orchestrate high-concurrency diagnostic sequences with millisecond precision on our global edge network.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/signup">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="h-16 px-12 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl border-0 relative overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg,hsl(0,100%,55%),hsl(0,0%,55%))',
                      boxShadow: '0 0 40px -5px hsla(0,100%,55%,0.55), 0 0 80px -20px hsla(0,0%,55%,0.30)',
                    }}
                  >
                    <span className="relative z-10">Initialize Operations</span>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{
                      background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.18) 50%,transparent 70%)',
                    }} />
                  </motion.button>
                </Link>
                <Link href="#pricing">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-16 px-12 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl"
                    style={{ background: 'hsla(0,100%,55%,0.06)', border: '1px solid hsla(0,100%,55%,0.20)' }}
                  >
                    View Specifications
                  </motion.button>
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="flex gap-10 pt-2"
              >
                {[
                  { value: '+4 TBPS', label: 'Network Power' },
                  { value: '99.9%', label: 'Uptime SLA' },
                  { value: '50+', label: 'Global Nodes' },
                ].map((s, i) => (
                  <div key={i}>
                    <p className="text-2xl font-black bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg,hsl(0,100%,60%),hsl(0,0%,60%))' }}>{s.value}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.0, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:flex items-center justify-center relative"
              style={{ minHeight: 500 }}
            >
              <Hero3DChaos />
            </motion.div>
          </div>
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">Scroll</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </motion.div>
        </section>

        {/* Features */}
        <section id="services" className="py-32 max-w-7xl mx-auto px-6 relative">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-3">
              Core{' '}
              <span className="shimmer-text">Capabilities</span>
            </h2>
            <p className="text-gray-500 text-xs font-black uppercase tracking-[0.25em]">What makes us the best</p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Bitcoin className="h-6 w-6" />, title: 'Stealth Payments', desc: 'Secure cryptographic asset transfers ensure total operational anonymity.' },
              { icon: <Shield className="h-6 w-6" />, title: 'Hardened Security', desc: 'Encrypted communication channels across our distributed global cluster.' },
              { icon: <Users className="h-6 w-6" />, title: 'Elite Intelligence', desc: '24/7 tactical support from our network optimization specialists.' },
              { icon: <Code className="h-6 w-6" />, title: 'Vector Precision', desc: 'Advanced bypass techniques engineered for modern network defense.' },
            ].map((f, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <TiltCard
                  className="relative overflow-hidden rounded-2xl p-8 h-full joker-gloss"
                  style={{
                    background: 'hsla(280,20%,6%,0.82)',
                    border: '1px solid hsla(0,100%,55%,0.09)',
                    cursor: 'pointer',
                  }}
                >
                  <div className="absolute inset-0 joker-stripe opacity-30 rounded-2xl" />
                  <div className="absolute top-0 right-0 w-20 h-20 blur-3xl -mr-8 -mt-8" style={{ background: 'hsla(0,100%,55%,0.15)' }} />
                  <motion.div
                    className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{
                      background: 'hsla(0,100%,55%,0.12)',
                      border: '1px solid hsla(0,100%,55%,0.22)',
                      color: 'hsl(0,100%,55%)',
                      boxShadow: '0 0 20px -5px hsla(0,100%,55%,0.25)',
                    }}
                    whileHover={{ scale: 1.12, rotate: 5 }}
                  >
                    {f.icon}
                  </motion.div>
                  <h3 className="relative z-10 text-lg font-black uppercase tracking-tight mb-3 text-white">{f.title}</h3>
                  <p className="relative z-10 text-gray-500 font-medium text-sm leading-relaxed">{f.desc}</p>
                </TiltCard>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* Stats banner */}
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,hsla(0,100%,55%,0.07),hsla(0,0%,55%,0.07))', borderTop: '1px solid hsla(0,100%,55%,0.10)', borderBottom: '1px solid hsla(0,100%,55%,0.10)' }} />
          <div className="absolute inset-0 joker-stripe opacity-20" />
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: '+4 TBPS', label: 'Network Capacity' },
                { value: '10K+', label: 'Active Users' },
                { value: '50+', label: 'Server Nodes' },
                { value: '99.9%', label: 'Uptime Guarantee' },
              ].map((s, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <p className="text-4xl font-black shimmer-text mb-2">{s.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{s.label}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6 space-y-16">
            <FadeIn className="text-center space-y-4">
              <h2 className="text-4xl font-black uppercase tracking-tighter">
                Acquisition{' '}
                <span className="shimmer-text">Packages</span>
              </h2>
              <p className="text-gray-500 font-medium uppercase tracking-[0.2em] text-xs">Choose your tactical deployment tier</p>
            </FadeIn>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                {
                  name: 'Basic',
                  price: '25',
                  features: [
                    '1200s Operation Time',
                    '1 Concurrent Attack',
                    'Standard Support',
                  ],
                  popular: false,
                },
                {
                  name: 'VIP',
                  price: '50',
                  features: [
                    '2400s Operation Time',
                    '5 Concurrent Attacks',
                    'VIP Methods',
                    'Priority Support',
                  ],
                  popular: true,
                },
                {
                  name: 'Harley',
                  price: '75',
                  features: [
                    '2800s Operation Time',
                    '35 Concurrent Attacks',
                    'VIP Methods',
                    'Priority Support',
                  ],
                  popular: false,
                },
              ].map((p, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <TiltCard
                    className="relative overflow-hidden rounded-2xl p-10 flex flex-col h-full joker-gloss"
                    style={{
                      background: 'hsla(280,20%,6%,0.85)',
                      border: p.popular ? '1px solid hsla(0,100%,55%,0.40)' : '1px solid hsla(0,100%,55%,0.09)',
                      boxShadow: p.popular ? '0 0 60px -10px hsla(0,100%,55%,0.22), 0 0 120px -30px hsla(0,0%,55%,0.15)' : undefined,
                    }}
                  >
                    {p.popular && (
                      <>
                        <div className="absolute inset-0 joker-stripe opacity-20 rounded-2xl" />
                        <motion.div
                          className="absolute top-0 right-0 text-white text-[9px] font-black uppercase tracking-[0.2em] px-5 py-1.5 rounded-bl-xl"
                          style={{ background: 'linear-gradient(135deg,hsl(0,100%,55%),hsl(0,0%,55%))' }}
                          animate={{ boxShadow: ['0 0 10px hsla(0,100%,55%,0.3)', '0 0 25px hsla(0,100%,55%,0.6)', '0 0 10px hsla(0,100%,55%,0.3)'] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Recommended
                        </motion.div>
                      </>
                    )}
                    <div className="relative z-10 space-y-2 mb-6">
                      <h4 className="text-xs font-black uppercase tracking-[0.3em] shimmer-text">{p.name}</h4>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-white">${p.price}</span>
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">/ Mo</span>
                      </div>
                    </div>
                    <div className="h-px my-6 relative z-10" style={{ background: 'hsla(0,100%,55%,0.12)' }} />
                    <ul className="relative z-10 space-y-5 flex-1">
                      {p.features.map((feat, j) => (
                        <li key={j} className="flex items-center gap-4 text-sm font-bold text-gray-400">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'hsla(0,100%,55%,0.15)' }}>
                            <Zap className="w-3 h-3" style={{ color: 'hsl(0,100%,55%)' }} />
                          </div>
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <Link href="/signup" className="mt-10 relative z-10">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full h-14 font-black uppercase tracking-widest text-[10px] rounded-xl border-0 text-white"
                        style={p.popular ? {
                          background: 'linear-gradient(135deg,hsl(0,100%,55%),hsl(0,0%,55%))',
                          boxShadow: '0 0 24px -5px hsla(0,100%,55%,0.50)',
                        } : {
                          background: 'hsla(0,100%,55%,0.07)',
                          border: '1px solid hsla(0,100%,55%,0.16)',
                        }}
                      >
                        Initialize Package
                      </motion.button>
                    </Link>
                  </TiltCard>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-32 max-w-3xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              Tactical Briefing{' '}
              <span className="shimmer-text">(FAQ)</span>
            </h2>
          </FadeIn>
          <Accordion type="single" collapsible value={openFaq} onValueChange={setOpenFaq} className="space-y-4">
            {[
              { q: 'Platform Mission Objective', a: 'We provide specialized infrastructure for high-intensity network diagnostic sequences. Our systems enable administrators to stress-test their network perimeter against advanced tactical loads.' },
              { q: 'Deployment Timeline', a: 'All acquisition sequences are automated. Confirmed cryptographic transfers typically grant operational access within 300-600 seconds.' },
              { q: 'Strategic Advantages', a: 'Strategic-tier membership provides a 100% amplification in vector intensity, direct specialist uplink, and access to proprietary tactical methods.' },
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}
                className="px-6 rounded-2xl overflow-hidden joker-gloss"
                style={{ background: 'hsla(280,20%,6%,0.82)', border: `1px solid hsla(0,100%,55%,${openFaq === `item-${i}` ? '0.25' : '0.09'})` }}
              >
                <AccordionTrigger className="text-sm font-black uppercase tracking-widest text-gray-300 hover:text-white py-6 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-500 font-medium leading-relaxed pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-16" style={{ borderTop: '1px solid hsla(0,100%,55%,0.09)', background: 'hsla(280,20%,4%,0.95)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,70%,0.30),hsla(0,0%,70%,0.30),transparent)' }} />
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <ChaosIcon size={24} />
            <span className="text-lg font-black tracking-tighter uppercase text-white">
              Joker<span className="shimmer-text">Stress</span>
            </span>
          </div>
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">&copy; 2024 Operations Command. All Protocols Reserved.</p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Service Status'].map((item) => (
              <Link key={item} href="#" className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">{item}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}