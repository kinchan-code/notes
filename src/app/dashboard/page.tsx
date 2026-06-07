import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { DocumentDashboard, getOwnedDocuments, getSharedDocuments } from '@/features/documents'
import { getCurrentProfile } from '@/features/profile'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [owned, shared, profile] = await Promise.all([
    getOwnedDocuments(),
    getSharedDocuments(),
    getCurrentProfile(),
  ])

  if (!profile) redirect('/login')

  return (
    <DocumentDashboard
      owned={owned}
      shared={shared}
      profile={profile}
    />
  )
}
