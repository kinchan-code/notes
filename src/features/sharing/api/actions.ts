'use server'

import { revalidatePath } from 'next/cache'

import { flattenError } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { shareDocumentSchema } from '@/schemas'

import type { ActionResult } from '@/features/documents'

export interface ShareRecord {
  id: string
  shared_with_user_id: string
  role: 'viewer' | 'editor'
  profiles: { email: string; display_name: string | null }
}

export async function getDocumentShares(documentId: string): Promise<ShareRecord[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('document_shares')
    .select('id, shared_with_user_id, role, profiles(email, display_name)')
    .eq('document_id', documentId)

  if (!data) return []

  return data.map(row => ({
    id: row.id,
    shared_with_user_id: row.shared_with_user_id,
    role: row.role,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] : row.profiles,
  }))
}

export async function shareDocument(
  documentId: string,
  email: string,
  role: 'viewer' | 'editor'
): Promise<ActionResult> {
  const parsed = shareDocumentSchema.safeParse({ email, role })
  if (!parsed.success) {
    const errors = flattenError(parsed.error).fieldErrors
    return { success: false, error: errors.email?.[0] ?? errors.role?.[0] ?? 'Invalid input.', errors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: doc } = await supabase
    .from('documents')
    .select('owner_id')
    .eq('id', documentId)
    .single()

  if (!doc || doc.owner_id !== user.id) {
    return { success: false, error: 'Only the document owner can share it.' }
  }

  const { data: target } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', parsed.data.email.toLowerCase())
    .single()

  if (!target) {
    return { success: false, error: `No user found with email "${email}".` }
  }

  if (target.id === user.id) {
    return { success: false, error: 'You cannot share a document with yourself.' }
  }

  const { error } = await supabase
    .from('document_shares')
    .upsert(
      { document_id: documentId, shared_with_user_id: target.id, role: parsed.data.role, created_by: user.id },
      { onConflict: 'document_id,shared_with_user_id' }
    )

  if (error) return { success: false, error: 'Failed to share document.' }

  revalidatePath(`/documents/${documentId}`)
  return { success: true }
}

export async function removeShare(shareId: string, documentId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: doc } = await supabase
    .from('documents')
    .select('owner_id')
    .eq('id', documentId)
    .single()

  if (!doc || doc.owner_id !== user.id) {
    return { success: false, error: 'Only the owner can remove shares.' }
  }

  const { error } = await supabase
    .from('document_shares')
    .delete()
    .eq('id', shareId)

  if (error) return { success: false, error: 'Failed to remove share.' }

  revalidatePath(`/documents/${documentId}`)
  return { success: true }
}
