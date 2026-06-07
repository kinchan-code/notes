'use server'

import { revalidatePath } from 'next/cache'
import { flattenError } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { updateProfileSchema, validateAvatarFile } from '@/schemas/profile.schema'

import type { ActionResult } from '@/features/documents/api/actions'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url, created_at')
    .eq('id', user.id)
    .single()

  return data
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse({
    display_name: formData.get('display_name'),
  })

  if (!parsed.success) {
    const errors = flattenError(parsed.error).fieldErrors
    return {
      success: false,
      error: errors.display_name?.[0] ?? 'Invalid profile data.',
      errors,
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const updates: { display_name: string; avatar_url?: string } = {
    display_name: parsed.data.display_name.trim(),
  }

  const avatar = formData.get('avatar')
  if (avatar instanceof File && avatar.size > 0) {
    const uploaded = await uploadAvatar(supabase, user.id, avatar)
    if ('error' in uploaded) return { success: false, error: uploaded.error }
    updates.avatar_url = uploaded.url
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) return { success: false, error: 'Failed to update profile.' }

  revalidatePath('/dashboard')
  revalidatePath('/profile')
  return { success: true }
}

function mapAvatarUploadError(message: string): string {
  if (message.includes('Bucket not found')) {
    return 'Avatar storage is not set up. Apply the avatars section from supabase/schema.sql in the Supabase SQL editor.'
  }
  if (message.toLowerCase().includes('row-level security')) {
    return 'Avatar upload was blocked by storage permissions. Apply the avatars section from supabase/schema.sql in the Supabase SQL editor.'
  }
  return `Failed to upload avatar: ${message}`
}

async function uploadAvatar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  avatar: File,
): Promise<{ url: string } | { error: string }> {
  const avatarError = validateAvatarFile(avatar)
  if (avatarError) return { error: avatarError }

  const ext = avatar.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
  const path = `${userId}/avatar.${ext}`

  const { data: existingFiles } = await supabase.storage.from('avatars').list(userId)
  if (existingFiles?.length) {
    await supabase.storage
      .from('avatars')
      .remove(existingFiles.map(file => `${userId}/${file.name}`))
  }

  const body = new Uint8Array(await avatar.arrayBuffer())
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, body, { contentType: avatar.type, cacheControl: '3600' })

  if (uploadError) return { error: mapAvatarUploadError(uploadError.message) }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
  return { url: `${publicUrl}?t=${Date.now()}` }
}

export async function removeAvatar(): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.avatar_url) {
    const { data: files } = await supabase.storage
      .from('avatars')
      .list(user.id)

    if (files?.length) {
      await supabase.storage
        .from('avatars')
        .remove(files.map(f => `${user.id}/${f.name}`))
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', user.id)

  if (error) return { success: false, error: 'Failed to remove avatar.' }

  revalidatePath('/dashboard')
  revalidatePath('/profile')
  return { success: true }
}
