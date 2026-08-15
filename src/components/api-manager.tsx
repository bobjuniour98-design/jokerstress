"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import Menu from "@/components/menu";
import { useSession, signIn } from "next-auth/react";
import AlertBox from "@/components/alert-box";
import { DisableApiTokenDialog } from "@/components/disable-api-token-dialog";
import HCaptchaWidget from "@/components/hcaptcha-widget";
import { Terminal, Copy, Globe, CheckCircle2, X, Loader2, Key, Shield, Zap, Server, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Field {
  parameter: string;
  type: string;
  description: string;
  value: string;
  required: boolean;
}

interface Method {
  method: string;
  protocol: string;
  description: string;
}

interface Alert {
  message: string;
  type: 'success' | 'error';
}

interface ApiMethod {
  name: string;
  type: string;
  displayName: string;
}

const PINK   = 'hsl(0,100%,62%)';
const VIOLET = 'hsl(0,0%,62%)';
const Joker  = 'linear-gradient(135deg,hsl(0,100%,58%),hsl(0,0%,58%))';
const CARD   = 'hsla(270,45%,5%,0.88)';
const BORDER = 'hsla(0,100%,62%,0.10)';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg,hsla(0,100%,62%,0.25),transparent)' }} />
      <span className="text-[9px] font-black uppercase tracking-[0.28em]" style={{ color: 'hsla(0,100%,62%,0.45)' }}>{children}</span>
      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,0%,62%,0.25))' }} />
    </div>
  );
}

function CardShell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl overflow-hidden relative ${className}`} style={{ background: CARD, border: `1px solid ${BORDER}`, backdropFilter: 'blur(20px)' }}>
      <div style={{ height: 2, background: Joker }} />
      <div className="absolute top-0.5 inset-x-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,80%,0.30),transparent)' }} />
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, title, subtitle, right }: { icon: React.ElementType; title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid hsla(0,100%,62%,0.07)' }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'hsla(0,100%,62%,0.10)', border: '1px solid hsla(0,100%,62%,0.18)' }}>
          <Icon className="h-4 w-4" style={{ color: PINK }} />
        </div>
        <div>
          <p className="text-sm font-black tracking-widest uppercase text-white leading-none">{title}</p>
          {subtitle && <p className="text-[9px] font-bold text-gray-600 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">{children}</p>;
}

function Divider() {
  return <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,62%,0.09),transparent)' }} />;
}

// Copyable URL endpoint block
function EndpointBlock({ label, url, badge, onCopy }: { label: string; url: string; badge: string; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
        <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full" style={{ color: 'rgb(52,211,153)', background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.18)' }}>
          {badge}
        </span>
      </div>
      <div
        className="group relative flex items-center rounded-2xl overflow-hidden cursor-pointer transition-all"
        style={{ background: 'hsla(270,45%,8%,0.80)', border: '1px solid hsla(0,100%,62%,0.08)' }}
        onClick={handleCopy}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsla(0,100%,62%,0.22)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsla(0,100%,62%,0.08)' }}
      >
        <div className="flex-1 px-4 py-3.5 font-mono text-[11px] truncate" style={{ color: 'hsla(0,0%,100%,0.45)' }}>
          <span style={{ color: 'hsl(0,0%,70%)' }}>GET</span>
          <span className="text-gray-600 mx-1.5">/</span>
          <span style={{ color: 'hsla(0,0%,100%,0.70)' }}>{url.replace('https://Jokerstress.st', '')}</span>
        </div>
        <div
          className="h-full px-4 flex items-center gap-2 flex-shrink-0 transition-all"
          style={{ borderLeft: '1px solid hsla(0,100%,62%,0.08)', color: copied ? 'hsl(142,76%,50%)' : 'hsla(0,0%,100%,0.30)' }}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div key="check" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}>
                <Check className="h-3.5 w-3.5" />
              </motion.div>
            ) : (
              <motion.div key="copy" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}>
                <Copy className="h-3.5 w-3.5" />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="text-[9px] font-black uppercase tracking-wider hidden sm:block">{copied ? 'Copied' : 'Copy'}</span>
        </div>
      </div>
    </div>
  );
}

export default function APIManager() {
  const session = useSession();
  const [apiToken, setApiToken]         = useState<string | null>(null);
  const [loading, setLoading]           = useState<boolean>(false);
  const [generated, setGenerated]       = useState<boolean>(false);
  const [methods, setMethods]           = useState<Method[]>([]);
  const [alert, setAlert]               = useState<Alert | null>(null);
  const [hcaptchaToken, setHcaptchaToken] = useState("");
  const [ipv4Whitelist, setIpv4Whitelist] = useState("");
  const [ipv6Whitelist, setIpv6Whitelist] = useState("");
  const [savingWhitelist, setSavingWhitelist] = useState(false);
  const [tokenCopied, setTokenCopied]   = useState(false);

  const fields: Field[] = [
    { parameter: "key",         type: "String",  description: "API Token", value: "Your API Token", required: true },
    { parameter: "host",        type: "String",  description: "Target IP/domain", value: "0.0.0.0", required: true },
    { parameter: "port",        type: "Integer", description: "Destination port", value: "80, 443", required: true },
    { parameter: "time",        type: "Integer", description: "Duration in seconds", value: "60, 300", required: true },
    { parameter: "method",      type: "String",  description: "Attack method", value: "See Methods", required: true },
    { parameter: "size",        type: "Integer", description: "Packet size (L4)", value: "64, 1024", required: false },
    { parameter: "subnet",      type: "String",  description: "Subnet (L4)", value: "24, 32", required: false },
    { parameter: "concurrents", type: "String",  description: "Concurrent count", value: "1, 50", required: false },
  ];

  useEffect(() => {
    if (session.status === "unauthenticated") signIn();
    if (session.status === "authenticated") {
      fetchApiToken();
      fetchMethods();
      fetchWhitelist();
    }
  }, [session.status]);

  const fetchApiToken = async () => {
    try {
      const response = await fetch("/api/user/details");
      const data = await response.json();
      if (response.ok) setApiToken(data.apiToken);
    } catch (error) {
      console.error("Error fetching API token:", error);
    }
  };

  const fetchMethods = async () => {
    try {
      const response = await fetch("/api/methods");
      const data = await response.json();
      if (response.ok) {
        const processedMethods: Method[] = data.methods.map((m: ApiMethod) => ({
          method: m.name,
          protocol: m.type === "l7" ? "LAYER7" : "LAYER4",
          description: m.displayName,
        }));
        setMethods(processedMethods);
      }
    } catch (error) {
      console.error("Error fetching methods:", error);
    }
  };

  const fetchWhitelist = async () => {
    try {
      const response = await fetch("/api/api-token/whitelist");
      const data = await response.json();
      if (response.ok) {
        setIpv4Whitelist(data.ipv4 || "");
        setIpv6Whitelist(data.ipv6 || "");
      }
    } catch (error) {
      console.error("Error fetching whitelist:", error);
    }
  };

  const saveWhitelist = async () => {
    setSavingWhitelist(true);
    try {
      const response = await fetch("/api/api-token/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipv4: ipv4Whitelist, ipv6: ipv6Whitelist }),
      });
      const data = await response.json();
      if (response.ok) {
        setIpv4Whitelist(data.whitelist?.ipv4 || "");
        setIpv6Whitelist(data.whitelist?.ipv6 || "");
        setAlert({ message: "IP whitelist updated successfully.", type: "success" });
      } else {
        setAlert({ message: `Error: ${data.message}`, type: "error" });
      }
    } catch (error) {
      setAlert({ message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, type: "error" });
    } finally {
      setSavingWhitelist(false);
    }
  };

  const generateApiToken = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/api-token/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hcaptchaToken ? { hcaptchaToken } : {}),
      });
      const data = await response.json();
      if (response.ok) {
        setApiToken(data.apiToken);
        setGenerated(true);
        setAlert({ message: "New API Token generated successfully", type: 'success' });
      } else {
        setAlert({ message: `Error: ${data.message}`, type: 'error' });
      }
    } catch (error) {
      setAlert({ message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const disableApiToken = async () => {
    try {
      const response = await fetch("/api/api-token/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok) {
        setApiToken(null);
        setGenerated(false);
        setAlert({ message: "API Token disabled successfully", type: 'success' });
      } else {
        setAlert({ message: `Error: ${data.message}`, type: 'error' });
      }
    } catch (error) {
      setAlert({ message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' });
    }
  };

  const copyToken = () => {
    if (!apiToken) return;
    navigator.clipboard.writeText(apiToken);
    setTokenCopied(true);
    setAlert({ message: "Token copied to clipboard.", type: 'success' });
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const BASE = 'https://Jokerstress.st';
  const startAttackUrl   = apiToken ? `${BASE}/api/external/attack?key=${apiToken}&host=[host]&port=[port]&time=[time]&method=[method]&size=[size]&subnet=[subnet]` : "No API token — generate one first";
  const stopAttacksUrl   = apiToken ? `${BASE}/api/external/stop?key=${apiToken}&host=[host]&method=[method]` : "No API token — generate one first";
  const stopAllAttacksUrl = apiToken ? `${BASE}/api/external/stopall?key=${apiToken}` : "No API token — generate one first";

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#08000f' }}>
      <div className="fixed top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[160px] pointer-events-none" style={{ background: 'hsla(0,100%,62%,0.09)' }} />
      <div className="fixed bottom-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full blur-[160px] pointer-events-none" style={{ background: 'hsla(0,0%,62%,0.07)' }} />

      <Menu />

      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-2">
          <div className="flex items-center gap-2.5 mb-3">
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ background: apiToken ? 'hsl(142,76%,50%)' : PINK, boxShadow: apiToken ? '0 0 8px hsl(142,76%,50%)' : `0 0 8px ${PINK}` }}
              animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <span className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: apiToken ? 'hsl(142,76%,55%)' : 'hsla(0,100%,62%,0.55)' }}>
              {apiToken ? 'API ACCESS ACTIVE' : 'API ACCESS INACTIVE'}
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase text-white leading-none">
            Protocol <span className="bg-clip-text text-transparent" style={{ backgroundImage: Joker }}>Interface</span>
          </h1>
          <p className="text-gray-600 text-sm font-bold mt-2">Integrate tactical operations directly into your automated workflows.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div
            className="lg:col-span-4 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SectionLabel>Key Management</SectionLabel>

            <CardShell>
              <CardHeader icon={Key} title="API Credentials" subtitle="Manage your access token" />

              <div className="p-6 space-y-6">
                <div>
                  <FieldLabel>Access Status</FieldLabel>
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                    style={apiToken ? {
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.20)',
                      color: 'rgb(16,185,129)',
                      boxShadow: '0 0 20px -8px rgba(16,185,129,0.35)',
                    } : {
                      background: 'hsla(0,100%,62%,0.07)',
                      border: `1px solid hsla(0,100%,62%,0.18)`,
                      color: PINK,
                    }}
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: apiToken ? 'rgb(16,185,129)' : PINK, boxShadow: apiToken ? '0 0 6px rgb(16,185,129)' : `0 0 6px ${PINK}` }}
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                    />
                    {apiToken ? "Operational" : "Deactivated"}
                  </div>
                </div>
                <AnimatePresence>
                  {apiToken && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <FieldLabel>Your Token</FieldLabel>
                      <div
                        className="relative rounded-2xl overflow-hidden cursor-pointer group"
                        style={{ background: 'hsla(270,45%,8%,0.80)', border: `1px solid hsla(0,100%,62%,0.14)` }}
                        onClick={copyToken}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsla(0,100%,62%,0.28)' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsla(0,100%,62%,0.14)' }}
                      >
                        <div className="px-4 py-3.5 pr-16 font-mono text-[11px] truncate" style={{ color: 'hsla(0,0%,100%,0.55)' }}>
                          {apiToken}
                        </div>
                        <div
                          className="absolute right-0 top-0 bottom-0 px-4 flex items-center gap-1.5 transition-colors"
                          style={{ borderLeft: `1px solid hsla(0,100%,62%,0.10)`, color: tokenCopied ? 'hsl(142,76%,50%)' : 'hsla(0,0%,100%,0.30)' }}
                        >
                          <AnimatePresence mode="wait">
                            {tokenCopied ? (
                              <motion.div key="check" initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }}>
                                <Check className="h-3.5 w-3.5" />
                              </motion.div>
                            ) : (
                              <motion.div key="copy" initial={{ scale: 0.6 }} animate={{ scale: 1 }} exit={{ scale: 0.6 }}>
                                <Copy className="h-3.5 w-3.5" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg,transparent,hsla(0,100%,80%,0.18),transparent)' }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Divider />
                <div>
                  <FieldLabel>Verification Checkpoint</FieldLabel>
                  <div className="flex flex-col items-center gap-3 py-5 rounded-2xl" style={{ background: 'hsla(0,100%,62%,0.04)', border: '1px solid hsla(0,100%,62%,0.09)' }}>
                    <div className="flex items-center gap-2">
                      <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: PINK }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Biometric Checkpoint</span>
                    </div>
                    <HCaptchaWidget onVerify={setHcaptchaToken} onExpire={() => setHcaptchaToken("")} />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <motion.button
                    onClick={generateApiToken}
                    disabled={loading || generated}
                    whileHover={!loading && !generated ? { scale: 1.02, boxShadow: '0 0 36px -6px hsla(0,100%,62%,0.65)' } : {}}
                    whileTap={!loading && !generated ? { scale: 0.97 } : {}}
                    className="h-13 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl border-0 w-full relative overflow-hidden flex items-center justify-center gap-2.5 disabled:cursor-not-allowed"
                    style={{
                      height: 52,
                      background: (loading || generated) ? 'hsla(0,100%,62%,0.22)' : Joker,
                      boxShadow: (loading || generated) ? 'none' : '0 0 22px -5px hsla(0,100%,62%,0.50)',
                      transition: 'box-shadow 0.25s ease',
                    }}
                  >
                    <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)' }} />
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                    ) : (
                      <><Zap className="h-4 w-4 fill-current" /> Initialize New Key</>
                    )}
                  </motion.button>
                  {apiToken && <DisableApiTokenDialog onConfirm={disableApiToken} />}
                </div>

                <Divider />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FieldLabel>IP Whitelisting</FieldLabel>
                    <Shield className="h-3.5 w-3.5" style={{ color: 'hsla(0,100%,62%,0.40)' }} />
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-1.5">IPv4</p>
                      <Input
                        value={ipv4Whitelist}
                        onChange={(e) => setIpv4Whitelist(e.target.value)}
                        placeholder="e.g. 1.2.3.4"
                        className="premium-input h-11 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-1.5">IPv6</p>
                      <Input
                        value={ipv6Whitelist}
                        onChange={(e) => setIpv6Whitelist(e.target.value)}
                        placeholder="e.g. 2001:db8::1"
                        className="premium-input h-11 text-xs font-mono"
                      />
                    </div>
                    <motion.button
                      onClick={saveWhitelist}
                      disabled={savingWhitelist}
                      whileHover={!savingWhitelist ? { scale: 1.02 } : {}}
                      whileTap={!savingWhitelist ? { scale: 0.97 } : {}}
                      className="w-full h-11 rounded-xl font-black text-[11px] uppercase tracking-widest relative overflow-hidden flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: 'hsla(0,100%,62%,0.08)',
                        border: `1px solid hsla(0,100%,62%,0.18)`,
                        color: PINK,
                      }}
                    >
                      {savingWhitelist ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : 'Save Whitelist'}
                    </motion.button>
                  </div>
                </div>

              </div>
            </CardShell>
          </motion.div>
          <motion.div
            className="lg:col-span-8 space-y-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <SectionLabel>API Reference</SectionLabel>
            <CardShell>
              <CardHeader
                icon={Globe}
                title="Signal Endpoints"
                subtitle="HTTP endpoints for automated attack control"
                right={
                  <span className="text-[9px] font-black px-3 py-1 rounded-full" style={{ background: 'hsla(0,100%,62%,0.08)', border: `1px solid hsla(0,100%,62%,0.16)`, color: PINK }}>
                    v2.4.0
                  </span>
                }
              />
              <div className="p-6 space-y-6">
                <EndpointBlock label="Deployment Uplink"     url={startAttackUrl}    badge="GET" onCopy={() => setAlert({ message: "Endpoint copied.", type: 'success' })} />
                <Divider />
                <EndpointBlock label="Target Termination"    url={stopAttacksUrl}    badge="GET" onCopy={() => setAlert({ message: "Endpoint copied.", type: 'success' })} />
                <Divider />
                <EndpointBlock label="Global Abort Sequence" url={stopAllAttacksUrl} badge="GET" onCopy={() => setAlert({ message: "Endpoint copied.", type: 'success' })} />
              </div>
            </CardShell>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CardShell>
                <CardHeader icon={Terminal} title="Parameters" subtitle="Request payload schema" />
                <div className="overflow-x-auto">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'hsla(0,100%,62%,0.03)' }}>
                        {['Parameter', 'Type', ''].map((h, i) => (
                          <th key={i} style={{
                            padding: i === 0 ? '10px 20px' : '10px 12px',
                            textAlign: i === 2 ? 'center' : 'left',
                            fontSize: '9px', fontWeight: 900,
                            color: 'rgb(75,85,99)', letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            borderBottom: '1px solid hsla(0,100%,62%,0.07)',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((f, i) => (
                        <tr
                          key={i}
                          style={{ borderBottom: '1px solid hsla(0,100%,62%,0.05)', transition: 'background 0.15s' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsla(0,100%,62%,0.03)' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: '11px', color: 'hsl(0,0%,72%)', fontWeight: 700 }}>
                            {f.parameter}
                          </td>
                          <td style={{ padding: '12px', fontSize: '10px', fontWeight: 700, color: 'rgb(107,114,128)' }}>{f.type}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {f.required ? (
                              <span style={{ display: 'inline-flex', padding: '3px 6px', borderRadius: 6, background: 'hsla(0,100%,62%,0.10)', color: PINK, fontSize: 9, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                REQ
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', padding: '3px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', color: 'rgb(55,65,81)', fontSize: 9, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                OPT
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardShell>
              <CardShell>
                <CardHeader
                  icon={Server}
                  title="Vectors"
                  subtitle="Available attack methods"
                  right={
                    <span className="text-[9px] font-black px-2.5 py-1 rounded-full" style={{ background: 'hsla(0,0%,62%,0.10)', border: '1px solid hsla(0,0%,62%,0.20)', color: VIOLET }}>
                      {methods.length} methods
                    </span>
                  }
                />
                <div className="overflow-x-auto">
                  {methods.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'hsla(0,100%,62%,0.03)', position: 'sticky', top: 0, zIndex: 1 }}>
                          {['Vector', 'Tier'].map((h, i) => (
                            <th key={i} style={{
                              padding: i === 0 ? '10px 20px' : '10px',
                              textAlign: i === 1 ? 'right' : 'left',
                              fontSize: '9px', fontWeight: 900,
                              color: 'rgb(75,85,99)', letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              borderBottom: '1px solid hsla(0,100%,62%,0.07)',
                              background: 'hsla(270,45%,5%,0.97)',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {methods.map((m, i) => (
                          <tr
                            key={i}
                            style={{ borderBottom: '1px solid hsla(0,100%,62%,0.05)', transition: 'background 0.15s' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsla(0,100%,62%,0.03)' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                          >
                            <td style={{ padding: '11px 20px', fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.80)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                              {m.method}
                            </td>
                            <td style={{ padding: '11px', textAlign: 'right' }}>
                              <span style={m.protocol === "LAYER7" ? {
                                fontSize: '8px', fontWeight: 900, padding: '3px 8px', borderRadius: 6,
                                background: 'hsla(0,100%,62%,0.10)', color: PINK, border: `1px solid hsla(0,100%,62%,0.20)`,
                              } : {
                                fontSize: '8px', fontWeight: 900, padding: '3px 8px', borderRadius: 6,
                                background: 'hsla(0,0%,62%,0.10)', color: VIOLET, border: `1px solid hsla(0,0%,62%,0.20)`,
                              }}>
                                {m.protocol}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 py-16">
                      <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'hsla(0,100%,62%,0.35)' }} />
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'hsla(0,100%,62%,0.30)' }}>Fetching Vectors…</span>
                    </div>
                  )}
                </div>
              </CardShell>

            </div>
          </motion.div>
        </div>
      </main>

      {alert && <AlertBox message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
    </div>
  );
}
