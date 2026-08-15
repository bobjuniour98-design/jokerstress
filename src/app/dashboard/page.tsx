import { Metadata } from 'next'
import Dashboard from '@/components/dashboard'

export const metadata: Metadata = {
  title: 'Dashboard - JokerSTRESS',
  description: 'Dashboard',
}

export default function Home() {
  return <Dashboard />
}