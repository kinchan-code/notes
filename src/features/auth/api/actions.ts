'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { signInSchema } from '@/schemas'

export interface LoginState {
  errors?: { email?: string[]; password?: string[] }
  error?: string
}

export async function signIn(
  prevState: LoginState | undefined,
  formData: FormData
): Promise<LoginState | undefined> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
