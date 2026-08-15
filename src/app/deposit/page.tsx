import { Metadata } from 'next'
import Funds from '@/components/add-funds'

export const metadata: Metadata = {
  title: 'Add Funds - JokerSTRESS',
  description: 'Add Funds to your JokerSTRESS account',
}

export default function Home() {
  return <Funds />
}