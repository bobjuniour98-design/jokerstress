'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import Menu from "@/components/menu"
import AlertBox from "@/components/alert-box"
import { formatNumber, formatCurrency } from "@/utils/formatNumber"
import HCaptchaWidget from "@/components/hcaptcha-widget"
import { MathCaptcha } from "@/components/math-captcha"
import { motion } from "framer-motion"
import { Check, Zap, Star, Crown, ArrowRight, Shield } from "lucide-react"

const HCAPTCHA_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY?.length
)

interface Plan {
  id: number
  name: string
  premium: boolean
  duration: number
  attackDuration: number
  concurrent: number
  length: number
  lengthtype: string
  pagelength: string
  private: boolean
  apiaccess: boolean
  supportprio: number
  price: number
  custom: boolean
}

interface PlanListItem {
  planId: number
  title: string
  price: number
  features: string[]
  premium: boolean
}

interface PricingCardProps extends PlanListItem {
  hcaptchaToken: string
  mathCaptcha: { id: string; answer: string }
  useHcaptcha: boolean
  index: number
}

interface CustomPricingCardProps {
  price: number
  onPriceChange: (value: number) => void
  hcaptchaToken: string
  mathCaptcha: { id: string; answer: string }
  useHcaptcha: boolean
}

const generateFeatures = (plan: Plan): string[] => {
  const features: string[] = []
  features.push(`Up to ${formatNumber(plan.concurrent)} concurrent attacks`)
  features.push(`Up to ${formatNumber(plan.attackDuration)} seconds attack time`)
  features.push(`Always fast support`)
  if (plan.apiaccess) features.push("API Access included")
  if (plan.private) features.push("Private Access")
  if (plan.premium) features.push("Premium Support")
  features.push(`1 month`)
  return features
}

export default function Store() {
  const { status } = useSession()
  const [pricingType, setPricingType] = useState<"prebuilt" | "custom">("prebuilt")
  const [customPrice, setCustomPrice] = useState(20)
  const [plans, setPlans] = useState<PlanListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hcaptchaToken, setHcaptchaToken] = useState("")
  const [mathCaptcha, setMathCaptcha] = useState({ id: "", answer: "" })
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (pricingType === "prebuilt") {
      setLoading(true)
      fetch('/api/plans')
        .then(res => res.json())
        .then(data => {
          const fetchedPlans: Plan[] = data.plans
          const transformedPlans: PlanListItem[] = fetchedPlans.map((plan) => ({
            planId: plan.id,
            title: plan.name,
            price: plan.price,
            features: generateFeatures(plan),
            premium: plan.premium,
          }))
          setPlans(transformedPlans)
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [pricingType])

  if (loading || status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#08000f' }}
      >
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-12 h-12">
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                border: '2px solid hsla(0,100%,62%,0.15)',
                borderTopColor: 'hsl(0,100%,62%)',
              }}
            />
            <div
              className="absolute inset-2 rounded-full animate-ping"
              style={{ background: 'hsla(0,100%,62%,0.15)' }}
            />
          </div>
          <span
            className="text-[10px] font-black uppercase tracking-[0.35em]"
            style={{ color: 'hsla(0,100%,62%,0.55)' }}
          >
            Initialising
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: '#08000f' }}
    >
      <div
        className="fixed top-[-12%] left-[-8%] w-[55%] h-[55%] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle,hsla(0,100%,62%,0.11) 0%,transparent 70%)',
          filter: 'blur(80px)',
          animation: 'pulse 6s ease-in-out infinite',
        }}
      />
      <div
        className="fixed bottom-[-12%] right-[-8%] w-[55%] h-[55%] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle,hsla(0,0%,62%,0.09) 0%,transparent 70%)',
          filter: 'blur(80px)',
          animation: 'pulse 8s ease-in-out infinite 2s',
        }}
      />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[30%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse,hsla(290,60%,30%,0.07) 0%,transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <Menu />

      <main className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20 space-y-8"
        >
          <div className="flex items-center justify-center gap-2">
            <div
              className="h-px w-12"
              style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,62%,0.50))' }}
            />
            <span
              className="text-[10px] font-black uppercase tracking-[0.4em]"
              style={{ color: 'hsla(0,100%,62%,0.70)' }}
            >
              Select Your Tier
            </span>
            <div
              className="h-px w-12"
              style={{ background: 'linear-gradient(90deg,hsla(0,100%,62%,0.50),transparent)' }}
            />
          </div>
          <div className="space-y-3">
            <h1
              className="text-6xl md:text-7xl font-black tracking-[-0.04em] uppercase leading-none"
              style={{
                backgroundImage: 'linear-gradient(160deg,#ffffff 0%,rgba(255,255,255,0.40) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Operational
              <br />
              <span
                style={{
                  backgroundImage: 'linear-gradient(135deg,hsl(0,100%,68%) 0%,hsl(0,0%,68%) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Access
              </span>
            </h1>

            <p
              className="text-sm font-medium max-w-xl mx-auto leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.38)' }}
            >
              {pricingType === "prebuilt"
                ? "Pre-configured operational packages optimised for high-intensity network diagnostics and stress testing."
                : "Design a bespoke operational package tailored to your exact diagnostic requirements and concurrency needs."}
            </p>
          </div>
          <div className="flex justify-center">
            <div
              className="inline-flex p-1 rounded-2xl"
              style={{
                background: 'hsla(270,45%,6%,0.80)',
                border: '1px solid hsla(0,100%,62%,0.10)',
                backdropFilter: 'blur(16px)',
              }}
            >
              {(["prebuilt", "custom"] as const).map((type) => {
                const active = pricingType === type
                return (
                  <button
                    key={type}
                    onClick={() => setPricingType(type)}
                    className="relative px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.18em] transition-all duration-300"
                    style={
                      active
                        ? { color: '#fff' }
                        : { color: 'rgba(255,255,255,0.30)' }
                    }
                  >
                    {active && (
                      <motion.div
                        layoutId="toggle-pill"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg,hsl(0,100%,58%),hsl(0,0%,55%))',
                          boxShadow: '0 0 20px -4px hsla(0,100%,62%,0.55)',
                        }}
                        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                      />
                    )}
                    <span className="relative z-10">
                      {type === "prebuilt" ? "Standard Ops" : "Custom Spec"}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.50, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-lg mx-auto mb-16"
        >
          <div
            className="relative rounded-2xl px-8 py-7 overflow-hidden"
            style={{
              background: 'hsla(270,45%,5%,0.82)',
              border: '1px solid hsla(0,100%,62%,0.10)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,75%,0.28),transparent)' }}
            />

            <div className="flex flex-col items-center gap-5">
              <div className="flex items-center gap-2.5">
                <Shield
                  className="w-3.5 h-3.5"
                  style={{ color: 'hsl(0,100%,62%)' }}
                />
                <span
                  className="text-[10px] font-black uppercase tracking-[0.35em]"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  Verification Required
                </span>
              </div>

              <p
                className="text-center text-xs leading-relaxed max-w-xs"
                style={{ color: 'rgba(255,255,255,0.28)' }}
              >
                {HCAPTCHA_ENABLED
                  ? "Complete hCaptcha verification before acquiring a plan."
                  : "Solve the math challenge below before purchasing (hCaptcha site key not configured)."}
              </p>

              {HCAPTCHA_ENABLED ? (
                <HCaptchaWidget
                  onVerify={setHcaptchaToken}
                  onExpire={() => setHcaptchaToken("")}
                />
              ) : (
                <div className="w-full">
                  <MathCaptcha
                    onChallengeChange={(id, answer) =>
                      setMathCaptcha({ id, answer })
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
        {pricingType === "prebuilt" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 mb-20">
            {plans.map((plan, index) => (
              <PricingCard
                key={plan.planId ?? index}
                planId={plan.planId}
                title={plan.title}
                price={plan.price}
                features={plan.features}
                premium={plan.premium}
                hcaptchaToken={hcaptchaToken}
                mathCaptcha={mathCaptcha}
                useHcaptcha={HCAPTCHA_ENABLED}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto mb-20">
            <CustomPricingCard
              price={customPrice}
              onPriceChange={setCustomPrice}
              hcaptchaToken={hcaptchaToken}
              mathCaptcha={mathCaptcha}
              useHcaptcha={HCAPTCHA_ENABLED}
            />
          </div>
        )}
      </main>
    </div>
  )
}

function buildBuyPlanBody(
  planId: number | undefined,
  customPlan: Record<string, unknown> | undefined,
  useHcaptcha: boolean,
  hcaptchaToken: string,
  mathCaptcha: { id: string; answer: string }
) {
  if (useHcaptcha) {
    return customPlan
      ? { customPlan, hcaptchaToken }
      : { planId, hcaptchaToken }
  }
  return customPlan
    ? { customPlan, captchaId: mathCaptcha.id, captchaAnswer: mathCaptcha.answer }
    : { planId, captchaId: mathCaptcha.id, captchaAnswer: mathCaptcha.answer }
}

const PricingCard = ({
  planId,
  title,
  price,
  features,
  premium,
  hcaptchaToken,
  mathCaptcha,
  useHcaptcha,
  index,
}: PricingCardProps) => {
  const router = useRouter()
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertType, setAlertType] = useState<"success" | "error">("success")
  const [hovered, setHovered] = useState(false)

  const handleBuyNow = async () => {
    if (useHcaptcha && !hcaptchaToken) {
      setAlertMessage("Please complete the captcha above before purchasing.")
      setAlertType("error")
      setShowAlert(true)
      return
    }
    if (!useHcaptcha && (!mathCaptcha.id || !mathCaptcha.answer.trim())) {
      setAlertMessage("Please solve the math verification above before purchasing.")
      setAlertType("error")
      setShowAlert(true)
      return
    }

    try {
      const response = await fetch('/api/buy-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildBuyPlanBody(planId, undefined, useHcaptcha, hcaptchaToken, mathCaptcha)
        ),
      })
      const data = await response.json()
      if (response.ok) {
        setAlertMessage('Authorization granted. Accessing hub...')
        setAlertType("success")
        setShowAlert(true)
        setTimeout(() => router.push('/dashboard'), 1500)
      } else {
        setAlertMessage(`Access Denied: ${data.message}`)
        setAlertType("error")
        setShowAlert(true)
      }
    } catch {
      setAlertMessage('Fatal System Error during acquisition')
      setAlertType("error")
      setShowAlert(true)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.10,
        duration: 0.52,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {premium && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <div
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.22em] text-white whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg,hsl(0,100%,56%),hsl(0,0%,52%))',
              boxShadow: '0 0 22px -4px hsla(0,100%,62%,0.65)',
            }}
          >
            <Crown className="w-3 h-3" />
            Premium Access
          </div>
        </div>
      )}
      <div
        className="relative flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-500"
        style={{
          background: premium
            ? 'hsla(270,45%,6%,0.88)'
            : 'hsla(270,45%,5%,0.80)',
          border: premium
            ? '1px solid hsla(0,100%,62%,0.25)'
            : '1px solid hsla(0,100%,62%,0.08)',
          backdropFilter: 'blur(16px)',
          boxShadow: premium
            ? `0 0 60px -16px hsla(0,100%,62%,${hovered ? '0.35' : '0.20'}), inset 0 0 0 0 transparent`
            : hovered
            ? '0 0 40px -12px hsla(0,0%,62%,0.18)'
            : 'none',
        }}
      >
        {premium ? (
          <div
            className="h-0.5"
            style={{
              background:
                'linear-gradient(90deg,transparent 0%,hsl(0,100%,62%) 30%,hsl(0,0%,62%) 70%,transparent 100%)',
            }}
          />
        ) : (
          <div
            className="h-px"
            style={{
              background:
                'linear-gradient(90deg,transparent,hsla(0,100%,75%,0.20),transparent)',
            }}
          />
        )}
        <div
          className="absolute top-0 right-0 w-40 h-40 pointer-events-none transition-opacity duration-500 rounded-2xl"
          style={{
            background:
              'radial-gradient(circle at top right,hsla(0,100%,62%,0.12),transparent 70%)',
            opacity: hovered ? 1 : 0,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(hsla(0,100%,62%,1) 1px,transparent 1px),linear-gradient(90deg,hsla(0,100%,62%,1) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative p-8 pb-5 flex-1">
          <div className="flex items-center gap-2 mb-6">
            {premium ? (
              <Star
                className="w-4 h-4 flex-shrink-0"
                style={{ color: 'hsl(0,100%,62%)' }}
              />
            ) : (
              <Zap
                className="w-4 h-4 flex-shrink-0"
                style={{ color: 'hsla(0,100%,62%,0.55)' }}
              />
            )}
            <h3
              className="text-xl font-black uppercase tracking-tight"
              style={{
                color: premium ? '#fff' : 'rgba(255,255,255,0.80)',
              }}
            >
              {title}
            </h3>
          </div>
          <div className="flex items-baseline gap-1.5 mb-7">
            <span
              className="text-5xl font-black tabular-nums leading-none"
              style={{
                color: premium ? '#fff' : 'rgba(255,255,255,0.88)',
              }}
            >
              {formatCurrency(price)}
            </span>
            <span
              className="text-xs font-bold uppercase tracking-widest pb-0.5"
              style={{ color: 'rgba(255,255,255,0.28)' }}
            >
              / mo
            </span>
          </div>
          <div
            className="mb-7 h-px"
            style={{
              background: premium
                ? 'hsla(0,100%,62%,0.14)'
                : 'hsla(0,100%,62%,0.07)',
            }}
          />
          <ul className="space-y-3.5">
            {features.map((feature, i) => (
              <li
                key={i}
                className="flex items-center gap-3 text-sm font-medium"
                style={{ color: 'rgba(255,255,255,0.60)' }}
              >
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: premium
                      ? 'hsla(0,100%,62%,0.18)'
                      : 'hsla(0,100%,62%,0.08)',
                    border: '1px solid hsla(0,100%,62%,0.22)',
                  }}
                >
                  <Check
                    className="h-3 w-3"
                    style={{ color: 'hsl(0,100%,68%)' }}
                  />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative p-8 pt-5">
          <button
            onClick={handleBuyNow}
            className="relative w-full h-13 rounded-xl text-xs font-black uppercase tracking-[0.22em] text-white overflow-hidden transition-all duration-300 active:scale-[0.97] group/btn"
            style={{
              height: '52px',
              ...(premium
                ? {
                    background:
                      'linear-gradient(135deg,hsl(0,100%,57%),hsl(0,0%,54%))',
                    boxShadow:
                      '0 0 28px -6px hsla(0,100%,62%,0.55)',
                  }
                : {
                    background: 'hsla(0,100%,62%,0.07)',
                    border: '1px solid hsla(0,100%,62%,0.18)',
                  }),
            }}
          >
            {premium && (
              <div
                className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    'linear-gradient(135deg,hsl(0,100%,64%),hsl(0,0%,60%))',
                }}
              />
            )}
            {!premium && (
              <div
                className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
                style={{ background: 'hsla(0,100%,62%,0.10)' }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2">
              Acquire Access
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
            </span>
          </button>
        </div>
      </div>

      {showAlert && (
        <AlertBox
          message={alertMessage}
          type={alertType}
          onClose={() => setShowAlert(false)}
        />
      )}
    </motion.div>
  )
}

const CustomPricingCard = ({
  price,
  onPriceChange,
  hcaptchaToken,
  mathCaptcha,
  useHcaptcha,
}: CustomPricingCardProps) => {
  const [concurrents, setConcurrents] = useState(1)
  const [maxAttackTime, setMaxAttackTime] = useState(1200)
  const [membershipDuration, setMembershipDuration] = useState(1)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertType, setAlertType] = useState<"success" | "error">("success")

  useEffect(() => {
    const concurrentCost = concurrents * 20
    const durationCost = Math.ceil(maxAttackTime / 500) * 10
    const baseCost = concurrentCost + durationCost
    onPriceChange(Math.round(baseCost * membershipDuration))
  }, [concurrents, maxAttackTime, membershipDuration, onPriceChange])

  const handleBuyNow = async () => {
    if (useHcaptcha && !hcaptchaToken) {
      setAlertMessage("Please complete the captcha above before purchasing.")
      setAlertType("error")
      setShowAlert(true)
      return
    }
    if (!useHcaptcha && (!mathCaptcha.id || !mathCaptcha.answer.trim())) {
      setAlertMessage("Please solve the math verification above before purchasing.")
      setAlertType("error")
      setShowAlert(true)
      return
    }

    try {
      const customPlanPayload = { concurrents, maxAttackTime, membershipDuration, price }
      const response = await fetch('/api/buy-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildBuyPlanBody(undefined, customPlanPayload, useHcaptcha, hcaptchaToken, mathCaptcha)
        ),
      })
      if (response.ok) {
        setAlertMessage('Bespoke access granted.')
        setAlertType("success")
        setShowAlert(true)
      } else {
        const data = await response.json()
        setAlertMessage(`Error: ${data.message}`)
        setAlertType("error")
        setShowAlert(true)
      }
    } catch {
      setAlertMessage('System Link Failure')
      setAlertType("error")
      setShowAlert(true)
    }
  }

  const sliders = [
    {
      label: 'Concurrent Channels',
      value: concurrents,
      display: String(concurrents),
      min: 1,
      max: 500,
      step: 1,
      onChange: (v: number[]) => setConcurrents(v[0]),
      icon: <Zap className="w-3.5 h-3.5" style={{ color: 'hsl(0,100%,62%)' }} />,
    },
    {
      label: 'Signal Duration',
      value: maxAttackTime,
      display: `${maxAttackTime}s`,
      min: 1200,
      max: 36000,
      step: 100,
      onChange: (v: number[]) => setMaxAttackTime(v[0]),
      icon: <Star className="w-3.5 h-3.5" style={{ color: 'hsl(0,0%,68%)' }} />,
    },
    {
      label: 'Lease Duration',
      value: membershipDuration,
      display: `${membershipDuration} ${membershipDuration === 1 ? 'Month' : 'Months'}`,
      min: 1,
      max: 12,
      step: 1,
      onChange: (v: number[]) => setMembershipDuration(v[0]),
      icon: <Shield className="w-3.5 h-3.5" style={{ color: 'hsl(0,100%,62%)' }} />,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="relative rounded-2xl overflow-hidden p-10 space-y-10"
        style={{
          background: 'hsla(270,45%,5%,0.85)',
          border: '1px solid hsla(0,100%,62%,0.14)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 0 60px -20px hsla(0,100%,62%,0.18)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background:
              'linear-gradient(90deg,transparent 0%,hsl(0,100%,62%) 30%,hsl(0,0%,62%) 70%,transparent 100%)',
          }}
        />
        <div
          className="absolute top-0 right-0 w-56 h-56 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at top right,hsla(0,100%,62%,0.09),transparent 65%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.022]"
          style={{
            backgroundImage:
              'linear-gradient(hsla(0,100%,62%,1) 1px,transparent 1px),linear-gradient(90deg,hsla(0,100%,62%,1) 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <Crown
                className="w-4 h-4"
                style={{ color: 'hsl(0,100%,62%)' }}
              />
              <span
                className="text-[10px] font-black uppercase tracking-[0.35em]"
                style={{ color: 'hsla(0,100%,62%,0.70)' }}
              >
                Bespoke Configuration
              </span>
            </div>
            <h2
              className="text-3xl font-black uppercase tracking-[-0.03em]"
              style={{ color: '#fff' }}
            >
              Custom Spec
            </h2>
            <p
              className="text-xs font-medium leading-relaxed max-w-xs"
              style={{ color: 'rgba(255,255,255,0.32)' }}
            >
              Dial in your exact operational parameters.
              Pricing updates in real-time.
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <div
              className="text-5xl font-black tabular-nums leading-none"
              style={{
                backgroundImage:
                  'linear-gradient(135deg,hsl(0,100%,68%),hsl(0,0%,68%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {formatCurrency(price)}
            </div>
            <div
              className="text-[10px] font-black uppercase tracking-[0.28em] mt-2"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Total Package Cost
            </div>
          </div>
        </div>
        <div className="relative space-y-9">
          {sliders.map((s, i) => (
            <div key={i} className="space-y-3.5">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2">
                  {s.icon}
                  <Label
                    className="text-[10px] font-black uppercase tracking-[0.25em] cursor-default"
                    style={{ color: 'rgba(255,255,255,0.40)' }}
                  >
                    {s.label}
                  </Label>
                </div>
                <span
                  className="text-sm font-black tabular-nums"
                  style={{ color: '#fff' }}
                >
                  {s.display}
                </span>
              </div>
              <Slider
                min={s.min}
                max={s.max}
                step={s.step}
                value={[s.value]}
                onValueChange={s.onChange}
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleBuyNow}
          className="relative w-full rounded-2xl text-white font-black text-sm uppercase tracking-[0.22em] overflow-hidden transition-all duration-300 active:scale-[0.98] group"
          style={{
            height: '60px',
            background: 'linear-gradient(135deg,hsl(0,100%,57%),hsl(0,0%,54%))',
            boxShadow: '0 0 36px -8px hsla(0,100%,62%,0.55)',
          }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(135deg,hsl(0,100%,64%),hsl(0,0%,60%))',
            }}
          />
          <div
            className="absolute inset-0 -skew-x-12 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-700 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)',
            }}
          />
          <span className="relative z-10 flex items-center justify-center gap-2.5">
            Deploy Access
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>

        {showAlert && (
          <AlertBox
            message={alertMessage}
            type={alertType}
            onClose={() => setShowAlert(false)}
          />
        )}
      </div>
    </motion.div>
  )
}
