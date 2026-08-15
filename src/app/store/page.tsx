import { Metadata } from 'next'
import Store from '@/components/store'

export const metadata: Metadata = {
  title: 'Store - JokerSTRESS',
  description: 'Buy plan to your JokerSTRESS account',
}

export default function Home() {
  return <Store />
}