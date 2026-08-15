'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Menu from '@/components/menu'
import AlertBox from '@/components/alert-box'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Loader2, CreditCard, ChevronRight, Terminal } from 'lucide-react'
import { motion } from 'framer-motion'
import HCaptchaWidget from '@/components/hcaptcha-widget'
import { formatCurrency } from '@/utils/formatNumber'

interface Transaction {
  id: string
  status: string
  amount: number
  coin: string
  date: string
}

interface PaymentDetails {
  amount: number
  currency: string
  address: string
  invoiceUrl?: string
}

interface PaymentResponse {
  success: boolean
  message?: string
  payment?: PaymentDetails
}

const CryptoIcon = ({ name, size = 24 }: { name: string; size?: number }) => {
  const icons = {
    BTC: (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32">
        <g fill="none" fillRule="evenodd">
          <circle cx="16" cy="16" r="16" fill="#F7931A"/>
          <path fill="#FFF" fillRule="nonzero" d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"/>
        </g>
      </svg>
    ),
    LTC: (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32">
        <g fill="none" fillRule="evenodd">
          <circle cx="16" cy="16" r="16" fill="#BFBBBB"/>
          <path fill="#FFF" d="M10.427 19.214L9 19.768l.688-2.759 1.444-.58L13.213 8h5.129l-1.519 6.196 1.41-.571-.68 2.75-1.427.571-.848 3.483H23L22.127 24H9.252z"/>
        </g>
      </svg>
    ),
    XMR: (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32">
        <g fill="none" fillRule="evenodd">
          <circle cx="16" cy="16" r="16" fill="#F60"/>
          <path fill="#FFF" fillRule="nonzero" d="M15.97 5.235c5.985 0 10.825 4.84 10.825 10.824a11.07 11.07 0 01-.558 3.432h-3.226v-9.094l-7.04 7.04-7.04-7.04v9.094H5.704a11.07 11.07 0 01-.557-3.432c0-5.984 4.84-10.824 10.824-10.824zM14.358 19.02L16 20.635l1.613-1.614 3.051-3.05v5.72h4.547a10.806 10.806 0 01-9.24 5.192c-3.902 0-7.334-2.082-9.24-5.192h4.546v-5.72l3.081 3.05z"/>
        </g>
      </svg>
    ),
    USDT_TRX: (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32">
        <g fill="none" fillRule="evenodd">
          <circle cx="16" cy="16" r="16" fill="#26A17B"/>
          <path fill="#FFF" d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"/>
        </g>
      </svg>
    ),
  }

  return icons[name as keyof typeof icons] || null
}

const cryptoOptions = [
  {
    value: 'BTC',
    label: 'Bitcoin',
    description: 'BTC',
  },
  {
    value: 'LTC',
    label: 'Litecoin',
    description: 'LTC',
  },
  {
    value: 'XMR',
    label: 'Monero',
    description: 'XMR',
  },
  {
    value: 'USDT_TRX',
    label: 'Tether TRC-20',
    description: 'USDT',
  },
]

const cardStyle: React.CSSProperties = {
  background: 'hsla(270,45%,5%,0.80)',
  border: '1px solid hsla(0,100%,62%,0.12)',
  backdropFilter: 'blur(16px)',
  borderRadius: '16px',
  overflow: 'hidden',
}

const JokerTopBar = (
  <div style={{ background: 'linear-gradient(90deg,transparent,hsl(0,100%,62%),hsl(0,0%,62%),transparent)', height: '2px' }} />
)

const glossLine = (
  <div style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,80%,0.35),transparent)', height: '1px' }} />
)

export default function AddFunds() {
  const { status } = useSession()
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [selectedCrypto, setSelectedCrypto] = useState('BTC')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [systemAlert, setSystemAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hcaptchaToken, setHcaptchaToken] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    }
  }, [status, router])

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/payments')
        const data = await response.json()
        setTransactions(data.transactions ?? data.payments ?? [])
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchTransactions()
    } else if (status !== 'loading') {
      setLoading(false)
    }
  }, [status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!amount || !selectedCrypto) {
      setSystemAlert({ message: 'Please enter an amount and select a cryptocurrency.', type: "error" })
      setIsSubmitting(false)
      return
    }

    if (!hcaptchaToken) {
      setSystemAlert({ message: "Please complete verification sequence.", type: "error" })
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: selectedCrypto, hcaptchaToken }),
      })
      const data: PaymentResponse = await res.json()

      if (data.success && data.payment) {
        setPaymentDetails({
          address: data.payment.address,
          amount: data.payment.amount,
          currency: data.payment.currency,
          invoiceUrl: data.payment.invoiceUrl,
        })
        setSystemAlert({ message: 'Payment details generated successfully.', type: "success" })
      } else {
        setSystemAlert({ message: data.message || "Failed to initialize protocol", type: "error" })
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      setSystemAlert({ message: "An error occurred while creating the payment.", type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSystemAlert({ message: 'Address copied to clipboard!', type: 'success' })
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#08000f' }}>
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full animate-spin"
              style={{ border: '2px solid transparent', borderTopColor: 'hsl(0,100%,62%)', borderRightColor: 'hsl(0,0%,62%)' }} />
            <div className="absolute inset-2 rounded-full animate-pulse" style={{ background: 'hsla(0,100%,62%,0.15)' }} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'hsla(0,100%,62%,0.50)' }}>Initialising</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#08000f' }}>
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] animate-pulse pointer-events-none" style={{ background: 'hsla(0,100%,62%,0.10)' }} />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] animate-pulse pointer-events-none" style={{ background: 'hsla(0,0%,62%,0.08)' }} />

      <Menu />

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.50, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4 mb-2"
        >
          <div className="flex items-center gap-2">
            <div className="h-px w-10" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,62%,0.55))' }} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: 'hsla(0,100%,62%,0.65)' }}>Crypto Deposits</span>
          </div>
          <h1 className="text-5xl font-black tracking-[-0.04em] uppercase leading-none"
            style={{ backgroundImage: 'linear-gradient(160deg,#ffffff 0%,rgba(255,255,255,0.40) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Financial{' '}
            <span style={{ backgroundImage: 'linear-gradient(135deg,hsl(0,100%,68%) 0%,hsl(0,0%,68%) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Logistics
            </span>
          </h1>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Acquire operational credits via secure cryptographic channels.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <div style={cardStyle}>
              {JokerTopBar}
              {glossLine}
              <div style={{ padding: '32px', borderBottom: '1px solid hsla(0,100%,62%,0.08)' }}>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5" style={{ color: 'hsl(0,100%,62%)' }} />
                  <span className="text-lg font-black tracking-widest uppercase text-white">Acquisition Hub</span>
                </div>
              </div>
              <div style={{ padding: '32px' }} className="space-y-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Deposit Amount (USD)</Label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black group-focus-within:scale-110 transition-transform" style={{ color: 'hsl(0,100%,62%)' }}>$</span>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="premium-input pl-10 h-14 text-xl font-black"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Asset Channel</Label>
                    <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                      <SelectTrigger className="premium-input h-14 text-sm font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/10">
                        {cryptoOptions.map((crypto) => (
                          <SelectItem key={crypto.value} value={crypto.value} className="py-3 rounded-xl font-bold">
                            <div className="flex items-center gap-3">
                              <CryptoIcon name={crypto.value} size={20} />
                              <div className="flex flex-col">
                                <span className="text-sm font-black">{crypto.label}</span>
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest leading-none">{crypto.description}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col items-center gap-4 py-4 rounded-2xl" style={{ background: 'hsla(0,100%,62%,0.04)', border: '1px solid hsla(0,100%,62%,0.10)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ background: 'rgb(52,211,153)' }} />
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Bot Protection Active</span>
                    </div>
                    <HCaptchaWidget
                      onVerify={setHcaptchaToken}
                      onExpire={() => setHcaptchaToken('')}
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.97 }}
                    className="w-full h-14 text-white font-black text-xs uppercase tracking-widest rounded-2xl group border-0 flex items-center justify-center"
                    style={{
                      background: isSubmitting ? 'hsla(0,100%,62%,0.5)' : 'linear-gradient(135deg,hsl(0,100%,58%),hsl(0,0%,58%))',
                      boxShadow: isSubmitting ? 'none' : '0 0 22px -5px hsla(0,100%,62%,0.50)',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                      <span className="flex items-center gap-2">
                        Initialize Transfer
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </motion.button>
                </form>

                {paymentDetails && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 pt-6"
                    style={{ borderTop: '1px solid hsla(0,100%,62%,0.08)' }}
                  >
                    <div className="flex flex-col items-center p-6 rounded-3xl space-y-4" style={{ background: 'hsla(0,100%,62%,0.05)', border: '1px solid hsla(0,100%,62%,0.15)', boxShadow: '0 0 40px -10px hsla(0,100%,62%,0.20)' }}>
                      <div className="p-3 bg-white rounded-2xl shadow-xl shadow-white/5">
                        <QRCodeSVG value={paymentDetails.address} size={140} />
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'hsl(0,100%,62%)' }}>Scan to Transmit</span>
                        <div className="text-2xl font-black text-white mt-1">
                          {paymentDetails.amount} <span style={{ color: 'hsl(0,100%,62%)' }}>{selectedCrypto}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Asset Destination</Label>
                      <div className="flex gap-2">
                        <div className="flex-1 px-4 py-3 rounded-xl font-bold text-[11px] text-gray-300 break-all leading-relaxed" style={{ background: 'hsla(0,100%,62%,0.05)', border: '1px solid hsla(0,100%,62%,0.10)' }}>
                          {paymentDetails.address}
                        </div>
                        <button
                          onClick={() => copyToClipboard(paymentDetails.address)}
                          className="h-auto px-4 rounded-xl flex items-center justify-center transition-all"
                          style={{ background: 'hsla(0,100%,62%,0.08)', border: '1px solid hsla(0,100%,62%,0.15)' }}
                        >
                          <Copy className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {paymentDetails.invoiceUrl && (
                      <a
                        href={paymentDetails.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full h-12 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all"
                        style={{ border: '1px solid hsla(0,100%,62%,0.30)', background: 'hsla(0,100%,62%,0.10)', color: 'hsl(0,100%,62%)' }}
                      >
                        <ChevronRight className="h-4 w-4" />
                        Open Payment Page
                      </a>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <div style={{ ...cardStyle, height: '100%' }}>
              {JokerTopBar}
              {glossLine}
              <div style={{ padding: '32px', borderBottom: '1px solid hsla(0,100%,62%,0.08)' }} className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Terminal className="h-5 w-5" style={{ color: 'hsl(0,100%,62%)' }} />
                  <span className="text-lg font-black tracking-widest uppercase text-white">Terminal Logs</span>
                </div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: 'hsla(0,100%,62%,0.08)', border: '1px solid hsla(0,100%,62%,0.15)' }}>
                  Real-Time Sync
                </div>
              </div>
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'hsla(0,100%,62%,0.03)' }}>
                      <th style={{ padding: '12px 32px', textAlign: 'left', fontSize: '10px', fontWeight: 900, color: 'rgb(107,114,128)', letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: '1px solid hsla(0,100%,62%,0.08)' }}>Transaction</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '10px', fontWeight: 900, color: 'rgb(107,114,128)', letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: '1px solid hsla(0,100%,62%,0.08)' }}>Amount</th>
                      <th style={{ padding: '12px 32px', textAlign: 'right', fontSize: '10px', fontWeight: 900, color: 'rgb(107,114,128)', letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: '1px solid hsla(0,100%,62%,0.08)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ height: '320px', textAlign: 'center' }}>
                          <div className="flex flex-col items-center justify-center gap-5">
                            <div className="relative flex items-center justify-center">
                              {[40, 60, 80].map((size, i) => (
                                <div key={i} className="absolute rounded-full"
                                  style={{ width: size, height: size, border: `1px solid hsla(0,100%,62%,${0.18 - i * 0.05})`, animation: `ping ${1.2 + i * 0.4}s ease-out infinite ${i * 0.3}s` }} />
                              ))}
                              <CreditCard className="h-6 w-6 relative z-10" style={{ color: 'hsla(0,100%,62%,0.45)' }} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'hsla(0,0%,100%,0.20)' }}>No transactions yet</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx, index) => (
                        <motion.tr
                          key={tx.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.08 }}
                          style={{ borderBottom: '1px solid hsla(0,100%,62%,0.06)' }}
                        >
                          <td style={{ padding: '20px 32px' }}>
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-white">#{tx.id.slice(0, 8)}</span>
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{tx.date}</span>
                            </div>
                          </td>
                          <td style={{ padding: '20px 8px' }}>
                            <div className="flex items-center gap-2">
                              <div className="px-2 py-0.5 rounded text-[10px] font-black text-gray-400" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
                                {tx.coin}
                              </div>
                              <span className="text-sm font-black text-white">{formatCurrency(tx.amount)}</span>
                            </div>
                          </td>
                          <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                            <span
                              className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest"
                              style={
                                tx.status === 'completed'
                                  ? { background: 'rgba(16,185,129,0.10)', color: 'rgb(52,211,153)', border: '1px solid rgba(16,185,129,0.20)' }
                                  : tx.status === 'expired' || tx.status === 'cancelled' || tx.status === 'error' || tx.status === 'mismatch'
                                    ? { background: 'rgba(107,114,128,0.10)', color: 'rgb(156,163,175)', border: '1px solid rgba(107,114,128,0.20)' }
                                    : { background: 'hsla(0,100%,62%,0.10)', color: 'hsl(0,100%,62%)', border: '1px solid hsla(0,100%,62%,0.20)' }
                              }
                            >
                              {tx.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {systemAlert && (
        <AlertBox
          message={systemAlert.message}
          type={systemAlert.type}
          onClose={() => setSystemAlert(null)}
        />
      )}
    </div>
  )
}
