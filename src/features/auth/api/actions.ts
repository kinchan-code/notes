'use server'

import { redirect } from 'next/navigation'
import { flattenError } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { signInSchema, signUpSchema } from '@/schemas'

export interface LoginState {
  errors?: {
    email?: string[]
    password?: string[]
    'confirm-password'?: string[]
  }
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
    return { errors: flattenError(parsed.error).fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signUp(
  prevState: LoginState | undefined,
  formData: FormData
): Promise<LoginState | undefined> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    'confirm-password': formData.get('confirm-password'),
  })

  if (!parsed.success) {
    return { errors: flattenError(parsed.error).fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  })

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
