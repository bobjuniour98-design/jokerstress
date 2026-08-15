'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import Menu from '@/components/menu'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Copy, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, Hash, Bitcoin } from 'lucide-react'

interface PaymentDetails {
  id: string
  status: string
  crypto: string
  address: string
  amount: number
  received: number
  expires: string
  confirmations: string
  hash: string
  qr: string
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
    completed:        { color: 'hsl(142,71%,55%)', bg: 'hsla(142,71%,55%,0.10)', border: 'hsla(142,71%,55%,0.25)', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    pending:          { color: 'hsl(0,100%,62%)', bg: 'hsla(0,100%,62%,0.10)', border: 'hsla(0,100%,62%,0.25)', icon: <Clock className="h-3.5 w-3.5" /> },
    confirming:       { color: 'hsl(0,0%,68%)', bg: 'hsla(0,0%,68%,0.10)', border: 'hsla(0,0%,68%,0.25)', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
    processing:       { color: 'hsl(0,0%,68%)', bg: 'hsla(0,0%,68%,0.10)', border: 'hsla(0,0%,68%,0.25)', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
    'partially paid': { color: 'hsl(38,92%,60%)',  bg: 'hsla(38,92%,60%,0.10)',  border: 'hsla(38,92%,60%,0.25)',  icon: <AlertCircle className="h-3.5 w-3.5" /> },
    expired:          { color: 'hsl(0,72%,58%)',   bg: 'hsla(0,72%,58%,0.10)',   border: 'hsla(0,72%,58%,0.25)',   icon: <XCircle className="h-3.5 w-3.5" /> },
  }
  const c = cfg[status.toLowerCase()] ?? { color: '#6b7280', bg: 'hsla(0,0%,50%,0.10)', border: 'hsla(0,0%,50%,0.20)', icon: null }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}
    >
      {c.icon}
      {status}
    </span>
  )
}

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5" style={{ borderBottom: '1px solid hsla(0,100%,62%,0.06)' }}>
      <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap pt-0.5" style={{ color: 'hsla(0,0%,100%,0.30)' }}>{label}</span>
      <span className={`text-sm font-bold text-gray-300 text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}

export default function TransactionDetails() {
  const [payment, setPayment] = useState<PaymentDetails | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const params = useParams()
  const paymentId = params?.id as string

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const mockPayment: PaymentDetails = {
          id: paymentId,
          status: 'pending',
          crypto: 'Bitcoin',
          address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
          amount: 0.001,
          received: 0,
          expires: '2023-12-31T23:59:59Z',
          confirmations: '0/3',
          hash: '',
          qr: '',
        }
        setPayment(mockPayment)
      } catch (error) {
        console.error('Error fetching payment:', error)
        alert('Failed to fetch payment details.')
      }
    }
    fetchPayment()
  }, [paymentId])

  useEffect(() => {
    if (payment) {
      QRCode.toDataURL(payment.address, { width: 256, margin: 1, color: { dark: '#000', light: '#FFF' } })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error(err))
    }
  }, [payment])

  const copyAddress = () => {
    if (!payment) return
    navigator.clipboard.writeText(payment.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#08000f' }}>
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full animate-spin"
              style={{ border: '2px solid transparent', borderTopColor: 'hsl(0,100%,62%)', borderRightColor: 'hsl(0,0%,62%)' }} />
            <div className="absolute inset-2 rounded-full animate-pulse" style={{ background: 'hsla(0,100%,62%,0.15)' }} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'hsla(0,100%,62%,0.50)' }}>
            Fetching Transaction
          </span>
        </div>
      </div>
    )
  }

  const cardStyle: React.CSSProperties = {
    background: 'hsla(270,45%,5%,0.82)',
    border: '1px solid hsla(0,100%,62%,0.10)',
    backdropFilter: 'blur(16px)',
    borderRadius: 18,
    overflow: 'hidden',
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#08000f' }}>
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] animate-pulse pointer-events-none" style={{ background: 'hsla(0,100%,62%,0.10)' }} />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] animate-pulse pointer-events-none" style={{ background: 'hsla(0,0%,62%,0.08)' }} />

      <Menu />

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-5"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-px w-8" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,62%,0.50))' }} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: 'hsla(0,100%,62%,0.60)' }}>Payment Record</span>
            </div>
            <h1 className="text-4xl font-black tracking-[-0.04em] uppercase"
              style={{ backgroundImage: 'linear-gradient(160deg,#fff 0%,rgba(255,255,255,0.50) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Transaction
            </h1>
            <div className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'hsla(0,0%,100%,0.25)' }} />
              <span className="font-mono text-sm font-bold" style={{ color: 'hsla(0,0%,100%,0.35)' }}>{payment.id}</span>
            </div>
          </div>
          <StatusBadge status={payment.status} />
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.50, delay: 0.10, ease: [0.22, 1, 0.36, 1] }}
            style={cardStyle}
          >
            <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,hsl(0,100%,62%),hsl(0,0%,62%),transparent)' }} />
            <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,hsla(0,100%,80%,0.30),transparent)' }} />

            <div className="flex items-center gap-3 px-7 py-5" style={{ borderBottom: '1px solid hsla(0,100%,62%,0.08)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'hsla(0,100%,62%,0.08)', border: '1px solid hsla(0,100%,62%,0.15)' }}>
                <Bitcoin className="h-4 w-4" style={{ color: 'hsl(0,100%,62%)' }} />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Payment Details</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'hsla(0,0%,100%,0.28)' }}>Transaction information</p>
              </div>
            </div>

            <div className="px-7 py-2">
              <InfoRow label="Crypto" value={payment.crypto} />
              <InfoRow
                label="Amount"
                value={<span className="text-white">{payment.amount} <span style={{ color: 'hsl(0,100%,68%)' }}>{payment.crypto.toUpperCase().slice(0,3)}</span></span>}
              />
              <InfoRow label="Received" value={payment.received} />
              <InfoRow label="Confirmations" value={payment.confirmations} />
              <InfoRow label="Expires" value={new Date(payment.expires).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} />
              {payment.hash && <InfoRow label="TX Hash" value={payment.hash} mono />}

              <div className="py-5">
                <div className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'hsla(0,0%,100%,0.28)' }}>
                  Destination Address
                </div>
                <div className="flex gap-2">
                  <div
                    className="flex-1 px-4 py-3 rounded-xl font-mono text-xs text-gray-300 break-all leading-relaxed"
                    style={{ background: 'hsla(0,100%,62%,0.04)', border: '1px solid hsla(0,100%,62%,0.09)' }}
                  >
                    {payment.address}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyAddress}
                    className="flex items-center justify-center w-12 rounded-xl transition-all"
                    style={{
                      background: copied ? 'hsla(142,71%,55%,0.12)' : 'hsla(0,100%,62%,0.07)',
                      border: `1px solid ${copied ? 'hsla(142,71%,55%,0.28)' : 'hsla(0,100%,62%,0.16)'}`,
                    }}
                  >
                    <Copy className="h-4 w-4" style={{ color: copied ? 'hsl(142,71%,55%)' : 'hsl(0,100%,68%)' }} />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.50, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ ...cardStyle, border: '1px solid hsla(0,0%,62%,0.12)' }}
          >
            <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,hsl(0,0%,62%),hsl(0,100%,62%),transparent)' }} />
            <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,hsla(0,0%,80%,0.30),transparent)' }} />

            <div className="px-7 py-5" style={{ borderBottom: '1px solid hsla(0,100%,62%,0.07)' }}>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Scan to Pay</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'hsla(0,0%,100%,0.28)' }}>Use your wallet app</p>
            </div>

            <div className="p-7 flex flex-col items-center gap-6">
              <div className="rounded-2xl p-4 shadow-2xl"
                style={{ background: 'white', boxShadow: '0 0 50px -12px hsla(0,100%,62%,0.40)' }}>
                {qrCodeUrl ? (
                  <Image
                    src={qrCodeUrl}
                    alt="Payment QR Code"
                    width={200}
                    height={200}
                    style={{ imageRendering: 'pixelated', display: 'block' }}
                  />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100">
                    <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>

              <div className="text-center space-y-1.5 w-full">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'hsl(0,100%,62%)' }}>
                  Send Exact Amount
                </p>
                <p className="text-2xl font-black text-white">
                  {payment.amount}{' '}
                  <span style={{ color: 'hsl(0,0%,68%)' }}>{payment.crypto.toUpperCase().slice(0,3)}</span>
                </p>
              </div>

              {payment.status === 'pending' && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl w-full justify-center"
                  style={{ background: 'hsla(0,100%,62%,0.05)', border: '1px solid hsla(0,100%,62%,0.12)' }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'hsl(0,100%,62%)' }} />
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'hsla(0,100%,62%,0.70)' }}>
                    Awaiting Payment
                  </span>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  )
}
