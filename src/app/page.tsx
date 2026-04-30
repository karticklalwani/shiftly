import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'

export default async function HomePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return <AppShell session={session} />
}
