import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { DocumentDashboard, getOwnedDocuments, getSharedDocuments } from '@/features/documents'
import { signOut } from '@/features/auth'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [owned, shared] = await Promise.all([
    getOwnedDocuments(),
    getSharedDocuments(),
  ])

  return (
    <div>
      <div className="fixed top-4 right-6 z-10">
        <form action={signOut}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
            Sign out
          </button>
        </form>
      </div>
      <DocumentDashboard owned={owned} shared={shared} />
    </div>
  )
}
