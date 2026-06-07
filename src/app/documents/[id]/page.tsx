import { redirect, notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { checkDocumentAccess } from '@/features/documents'
import { DocumentEditor } from '@/features/editor'

export default async function DocumentPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>
}>) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = await checkDocumentAccess(id)
  if (!role) redirect('/dashboard')

  const { data: doc } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (!doc) notFound()

  return <DocumentEditor key={`${doc.id}-${doc.updated_at}`} document={doc} role={role} />
}
