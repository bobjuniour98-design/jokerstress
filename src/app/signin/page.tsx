import { Metadata } from 'next'
import SignIn from '@/components/sign-in'

export const metadata: Metadata = {
  title: 'Sign In - JokerSTRESS'
}

export default function Home() {
  return <SignIn />
}