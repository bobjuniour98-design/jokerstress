'use client'

if (typeof window !== 'undefined') {
  const _orig = window.fetch
  window.fetch = async function (input, init) {
    const url =
      typeof input === 'string' ? input
      : input instanceof URL ? input.toString()
      : (input as Request).url

    const isApi = url.startsWith('/api/')

    if (isApi && url.includes('/api/auth/')) {
      try {
        const res = await _orig.call(this, input, init)
        if (res.ok) return res
        return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
      } catch {
        return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
    }

    if (isApi) {
      try {
        const res = await _orig.call(this, input, init)
        const ct = res.headers.get('content-type') ?? ''
        if (!ct.includes('application/json') && !ct.includes('text/plain')) {
          return new Response('{}', { status: res.status, headers: { 'Content-Type': 'application/json' } })
        }
        return res
      } catch {
        return new Response('{}', { status: 500, headers: { 'Content-Type': 'application/json' } })
      }
    }

    return _orig.call(this, input, init)
  }
}

export default function PreviewProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
