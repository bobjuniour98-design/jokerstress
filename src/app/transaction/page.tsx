import { Metadata } from 'next'
import Transaction from '@/components/transaction'

export const metadata: Metadata = {
  title: 'Transaction - JokerSTRESS',
  description: 'Add funds to your JokerSTRESS account',
}

export default function Home() {
  return <Transaction />
}