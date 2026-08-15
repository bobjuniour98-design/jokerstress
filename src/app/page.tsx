import { Metadata } from 'next'
import Landing from '@/components/landing-page'

export const metadata: Metadata = {
  title: 'Welcome to JokerSTRESS',
  description: 'The Premier Platform for Layer 4/7 Excellence',
}

export default function Home() {
  return <Landing />
}