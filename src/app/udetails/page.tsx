import { Metadata } from 'next'
import UDetails from '@/components/change-password'

export const metadata: Metadata = {
  title: 'User Details - JokerSTRESS',
  description: 'User details for your JokerSTRESS account',
}

export default function Home() {
  return <UDetails />
}