import { Metadata } from 'next'
import Panel from '@/components/panel'

export const metadata: Metadata = {
  title: 'Attack Hub - JokerSTRESS'
}

export default function Home() {
  return <Panel />
}