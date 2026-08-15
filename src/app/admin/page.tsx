import { Metadata } from 'next'
import AdminPage from '@/components/admin'

export const metadata: Metadata = {
  title: 'Admin - JokerSTRESS',
  description: 'Admin panel',
}

export default function Page() {
  return <AdminPage />
}

