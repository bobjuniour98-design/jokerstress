"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Settings, LayoutDashboard, Terminal, Globe, ShoppingCart, CreditCard, Key, LogOut, Menu as MenuIcon, X, Send, ShieldCheck, UserPlus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

function JokerIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <img 
      src="/harley.jpg" 
      alt="Joker Logo" 
      className={`object-contain rounded-full border border-green-500/30 ${className}`} 
    />
  )
}

export default function Menu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()
  const rank = (session?.user as { rank?: string } | undefined)?.rank?.toLowerCase()
  const isAdmin = rank === "admin" || rank === "owner"

  const handleLogout = () => {
    signOut({ callbackUrl: '/signin' })
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header
      className="sticky top-0 z-50 rounded-none shadow-none backdrop-blur-2xl"
      style={{
        background: 'hsla(270, 45%, 4%, 0.88)',
        borderBottom: '1px solid hsla(135, 85%, 55%, 0.10)',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, hsla(0,100%,75%,0.55), hsla(0,0%,75%,0.45), transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          <Link href="/dashboard" className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-xl transition-all group-hover:scale-150"
                style={{ background: 'hsla(0,100%,62%,0.28)' }}
              />
              <JokerIcon className="h-10 w-10 relative transition-transform group-hover:scale-110 group-hover:rotate-[-8deg]" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase flex items-center">
             <span
              style={{
               backgroundImage: 'linear-gradient(90deg, #ff0000 50%, #ffffff 50%)',
        WebkitBackgroundClip: 'text',
         WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
       color: 'transparent'
    }}
  >
    JOKER
  </span>
  <span style={{ color: '#ff0000' }} className="ml-1">STRESS</span>
</span>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex flex-row items-center gap-0.5">
              <NavButton href="/dashboard"  icon={LayoutDashboard} active={pathname === '/dashboard'}>Home</NavButton>
              <NavButton href="/panel"      icon={Terminal}        active={pathname === '/panel'}>Attack</NavButton>
              <NavButton href="/apis"       icon={Globe}           active={pathname === '/apis'}>API</NavButton>
              <NavButton href="/store"      icon={ShoppingCart}    active={pathname === '/store'}>Market</NavButton>
              <NavButton href="/referrals"  icon={UserPlus}        active={pathname === '/referrals'}>Referrals</NavButton>
              <ExternalNavButton href="https://t.me/Jokerstresser" icon={Send}>
                Telegram
              </ExternalNavButton>
              <NavButton href="/deposit"    icon={CreditCard}      active={pathname === '/deposit'}>Wallet</NavButton>
              {isAdmin && (
                <NavButton href="/admin" icon={ShieldCheck} active={pathname === '/admin'}>Admin</NavButton>
              )}
            </nav>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white rounded-2xl transition-all h-11 w-11 relative group"
                  >
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'hsla(0,100%,62%,0.08)' }} />
                    <Settings className="h-5 w-5 relative z-10" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-56 p-2 backdrop-blur-xl border mt-2"
                  style={{
                    background: 'hsla(270,45%,5%,0.97)',
                    borderColor: 'hsla(0,100%,62%,0.14)',
                    boxShadow: '0 0 30px -10px hsla(0,100%,62%,0.20)',
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <Link href="/udetails" className="w-full">
                      <Button
                        variant="ghost"
                        className="w-full flex items-center justify-start gap-3 px-4 py-3 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      >
                        <Key className="h-4 w-4" style={{ color: 'hsl(0,100%,62%)' }} />
                        Account Security
                      </Button>
                    </Link>
                    <div className="h-px my-1" style={{ background: 'hsla(0,100%,62%,0.08)' }} />
                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-start gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Deauthorize
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-400 hover:text-white rounded-2xl h-11 w-11 relative"
                onClick={toggleMenu}
                style={isMenuOpen ? { color: 'hsl(0,100%,62%)' } : {}}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isMenuOpen ? (
                    <motion.span
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="h-6 w-6" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="open"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <MenuIcon className="h-6 w-6" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden"
            style={{ borderTop: '1px solid hsla(0,100%,62%,0.10)' }}
          >
            <div
              className="px-4 py-4 space-y-1"
              style={{ background: 'hsla(270,45%,3%,0.98)' }}
            >
              <MobileNavButton href="/dashboard"  icon={LayoutDashboard} onClick={() => setIsMenuOpen(false)}>Home</MobileNavButton>
              <MobileNavButton href="/panel"      icon={Terminal}        onClick={() => setIsMenuOpen(false)}>Attack</MobileNavButton>
              <MobileNavButton href="/apis"       icon={Globe}           onClick={() => setIsMenuOpen(false)}>API</MobileNavButton>
              <MobileNavButton href="/store"      icon={ShoppingCart}    onClick={() => setIsMenuOpen(false)}>Market</MobileNavButton>
              <MobileNavButton href="/referrals"  icon={UserPlus}        onClick={() => setIsMenuOpen(false)}>Referrals</MobileNavButton>
              <MobileExternalNavButton href="https://t.me/Jokerstresser" icon={Send} onClick={() => setIsMenuOpen(false)}>
                Telegram
              </MobileExternalNavButton>
              <MobileNavButton href="/deposit"    icon={CreditCard}      onClick={() => setIsMenuOpen(false)}>Wallet</MobileNavButton>
              {isAdmin && (
                <MobileNavButton href="/admin" icon={ShieldCheck} onClick={() => setIsMenuOpen(false)}>
                  Admin
                </MobileNavButton>
              )}
              <div className="h-px my-2" style={{ background: 'hsla(0,100%,62%,0.08)' }} />
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                style={{ background: 'hsla(0,84%,60%,0.05)' }}
                onClick={() => { setIsMenuOpen(false); handleLogout() }}
              >
                <LogOut className="h-4 w-4" />
                Deauthorize
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function NavButton({
  href,
  icon: Icon,
  children,
  active = false,
}: {
  href: string
  icon: React.ElementType
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <Link href={href} prefetch>
      <div
        className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl cursor-pointer group transition-all duration-200"
        style={{
          background: active ? 'hsla(0,100%,62%,0.10)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!active) (e.currentTarget as HTMLDivElement).style.background = 'hsla(0,100%,62%,0.06)'
        }}
        onMouseLeave={(e) => {
          if (!active) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
        }}
      >
        <Icon
          className="h-3.5 w-3.5 transition-colors"
          style={{ color: active ? 'hsl(0,100%,68%)' : 'hsla(0,0%,100%,0.35)' }}
        />
        <span
          className="text-[11px] font-black tracking-widest uppercase transition-colors"
          style={active
            ? { backgroundImage: 'linear-gradient(135deg,hsl(0,100%,72%),hsl(0,0%,72%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
            : { color: 'hsla(0,0%,100%,0.45)' }
          }
        >
          {children}
        </span>
        {active && (
          <span
            className="absolute bottom-0 left-3.5 right-3.5 h-px rounded-full"
            style={{ background: 'linear-gradient(90deg,hsl(0,100%,62%),hsl(0,0%,62%))' }}
          />
        )}
      </div>
    </Link>
  )
}

function ExternalNavButton({
  href,
  icon: Icon,
  children,
}: {
  href: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <div
        className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl cursor-pointer transition-all duration-200"
        style={{ background: 'transparent' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'hsla(0,100%,62%,0.06)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: 'hsla(0,0%,100%,0.35)' }} />
        <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: 'hsla(0,0%,100%,0.45)' }}>
          {children}
        </span>
      </div>
    </a>
  )
}

function MobileNavButton({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string
  icon: React.ElementType
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link href={href} prefetch onClick={onClick}>
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all cursor-pointer group"
        style={{ background: 'transparent' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'hsla(0,100%,62%,0.07)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
      >
        <Icon className="h-4 w-4 text-current" style={{ color: 'hsl(0,100%,62%)' }} />
        {children}
      </div>
    </Link>
  )
}

function MobileExternalNavButton({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string
  icon: React.ElementType
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}>
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all cursor-pointer"
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'hsla(0,100%,62%,0.07)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
      >
        <Icon className="h-4 w-4" style={{ color: 'hsl(0,100%,62%)' }} />
        {children}
      </div>
    </a>
  )
}