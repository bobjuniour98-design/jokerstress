import { Metadata } from 'next'
import SignUp from '@/components/sign-up'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Sign Up - JokerSTRESS'
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#09060e] text-gray-300">Loading...</div>}>
      <SignUp />
    </Suspense>
  )
}