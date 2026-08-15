import { Metadata } from 'next'
import Api from '@/components/api-manager'

export const metadata: Metadata = {
  title: 'Api Manager - JokerSTRESS',
  description: 'Sign in to your JokerSTRESS account',
}

export default function Home() {
  return <Api />
}