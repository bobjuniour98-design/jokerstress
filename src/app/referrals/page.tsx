import { Metadata } from 'next'
import Referrals from '@/components/referrals'

export const metadata: Metadata = {
  title: 'Referrals - JokerSTRESS',
  description: 'Manage your referrals and earn rewards.',
}

export default function Home() {
  return <Referrals />
}
