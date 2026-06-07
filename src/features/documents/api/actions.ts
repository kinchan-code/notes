'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { renameTitleSchema, documentContentSchema, importContentSchema } from '@/schemas'

export type ActionResult =
  | { success: true }
  | { success: false; error: string; errors?: Record<string, string[]> }

export type DocumentRole = 'owner' | 'editor' | 'viewer'

export interface Document {
  id: string
  owner_id: string
  title: string
  content_html: string
  content_text: string
  created_at: string
  updated_at: string
}

export interface SharedDocument extends Document {
  role: 'editor' | 'viewer'
}

export async function getOwnedDocuments(): Promise<Document[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  return data ?? []
}

export async function getSharedDocuments(): Promise<SharedDocument[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('document_shares')
    .select('role, documents(*)')
    .eq('shared_with_user_id', user.id)
    .order('created_at', { ascending: false })

  if (!data) return []
  return data.map((row: { role: 'editor' | 'viewer'; documents: unknown }) => ({
    ...(row.documents as Document),
    role: row.role,
  }))
}

export async function createDocument(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('documents')
    .insert({ owner_id: user.id, title: 'Untitled' })
    .select('id')
    .single()

  if (error || !data) redirect('/dashboard')
  redirect(`/documents/${data.id}`)
}

export async function renameDocument(id: string, title: string): Promise<ActionResult> {
  const parsed = renameTitleSchema.safeParse({ title })
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    return { success: false, error: errors.title?.[0] ?? 'Invalid title.', errors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('documents')
    .update({ title: parsed.data.title.trim() })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { success: false, error: 'Failed to rename document.' }

  revalidatePath('/dashboard')
  revalidatePath(`/documents/${id}`)
  return { success: true }
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { success: false, error: 'Failed to delete document.' }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateDocument(
  id: string,
  data: { content_html: string; content_text: string }
): Promise<ActionResult> {
  const parsed = documentContentSchema.safeParse(data)
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    return { success: false, error: errors.content_text?.[0] ?? 'Invalid content.', errors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const access = await checkDocumentAccess(id)
  if (!access || access === 'viewer') {
    return { success: false, error: 'You do not have permission to edit this document.' }
  }

  const { error } = await supabase
    .from('documents')
    .update({ content_html: data.content_html, content_text: data.content_text })
    .eq('id', id)

  if (error) return { success: false, error: 'Failed to save document.' }

  revalidatePath(`/documents/${id}`)
  return { success: true }
}

export async function checkDocumentAccess(id: string): Promise<DocumentRole | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: doc } = await supabase
    .from('documents')
    .select('owner_id')
    .eq('id', id)
    .single()

  if (!doc) return null
  if (doc.owner_id === user.id) return 'owner'

  const { data: share } = await supabase
    .from('document_shares')
    .select('role')
    .eq('document_id', id)
    .eq('shared_with_user_id', user.id)
    .single()

  if (!share) return null
  return share.role as 'editor' | 'viewer'
}

export async function importTextFile(content: string, filename: string): Promise<ActionResult & { id?: string }> {
  const parsed = importContentSchema.safeParse({ content })
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    return { success: false, error: errors.content?.[0] ?? 'Invalid file.', errors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const title = filename.replace(/\.(txt|md)$/, '') || 'Imported Document'
  const content_html = content
    .split('\n')
    .map(line => line.trim() ? `<p>${line}</p>` : '<p></p>')
    .join('')

  const { data, error } = await supabase
    .from('documents')
    .insert({ owner_id: user.id, title, content_html, content_text: content })
    .select('id')
    .single()

  if (error || !data) return { success: false, error: 'Failed to import file.' }

  revalidatePath('/dashboard')
  return { success: true, id: data.id }
}
