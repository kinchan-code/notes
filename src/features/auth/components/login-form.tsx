'use client'

import { useActionState } from 'react'

import { Button, Input, Label } from '@/components/ui'
import { signIn } from '@/features/auth/api/actions'

import type { LoginState } from '@/features/auth/api/actions'

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState | undefined, FormData>(signIn, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-violet-700">Pa Notes</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
        </div>

        {state?.error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" aria-live="polite">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email" required>Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              error={!!state?.errors?.email}
              aria-describedby={state?.errors?.email ? 'email-error' : undefined}
              className="mt-1"
            />
            {state?.errors?.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600" aria-live="polite">
                {state.errors.email[0]}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password" required>Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              error={!!state?.errors?.password}
              aria-describedby={state?.errors?.password ? 'password-error' : undefined}
              className="mt-1"
            />
            {state?.errors?.password && (
              <p id="password-error" className="mt-1 text-sm text-red-600" aria-live="polite">
                {state.errors.password[0]}
              </p>
            )}
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
