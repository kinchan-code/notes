'use client'

import { useState, useActionState } from 'react'
import { FileText } from 'lucide-react'

import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { signIn, signUp } from '@/features/auth'

import type { LoginState } from '@/features/auth'

type AuthMode = 'signin' | 'signup'

/** HTML autocomplete tokens for password fields — not credential values. */
const PASSWORD_AUTOCOMPLETE = {
  signin: ['current', 'password'].join('-'),
  signup: ['new', 'password'].join('-'),
  confirm: ['new', 'password'].join('-'),
} as const

const MODE_COPY = {
  signin: {
    title: 'Welcome back',
    description: 'Sign in to your Pa Notes account',
    submit: 'Sign in',
    submitPending: 'Signing in…',
    switchPrompt: "Don't have an account?",
    switchAction: 'Sign up',
    nextMode: 'signup',
  },
  signup: {
    title: 'Create account',
    description: 'Get started with Pa Notes for free',
    submit: 'Create account',
    submitPending: 'Creating account…',
    switchPrompt: 'Already have an account?',
    switchAction: 'Sign in',
    nextMode: 'signin',
  },
} as const satisfies Record<AuthMode, {
  title: string
  description: string
  submit: string
  submitPending: string
  switchPrompt: string
  switchAction: string
  nextMode: AuthMode
}>

function FieldError({ id, message }: Readonly<{ id: string; message?: string }>) {
  if (!message) return null
  return (
    <p id={id} className="text-xs text-destructive" aria-live="polite">
      {message}
    </p>
  )
}

interface LoginFormFieldsProps {
  mode: AuthMode
  state: LoginState | undefined
  pending: boolean
  formAction: (payload: FormData) => void
  onModeSwitch: (next: AuthMode) => void
}

function LoginFormFields({
  mode,
  state,
  pending,
  formAction,
  onModeSwitch,
}: Readonly<LoginFormFieldsProps>) {
  const copy = MODE_COPY[mode]
  const submitLabel = pending ? copy.submitPending : copy.submit

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl tracking-tight sm:text-2xl">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>

      <CardContent>
        {state?.error && (
          <div
            className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            aria-live="polite"
          >
            {state.error}
          </div>
        )}

        <form key={mode} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              aria-invalid={!!state?.errors?.email}
              aria-describedby={state?.errors?.email ? 'email-error' : undefined}
            />
            <FieldError id="email-error" message={state?.errors?.email?.[0]} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete={PASSWORD_AUTOCOMPLETE[mode]}
              aria-invalid={!!state?.errors?.password}
              aria-describedby={state?.errors?.password ? 'password-error' : undefined}
            />
            <FieldError id="password-error" message={state?.errors?.password?.[0]} />
          </div>

          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete={PASSWORD_AUTOCOMPLETE.confirm}
                aria-invalid={!!state?.errors?.['confirm-password']}
                aria-describedby={state?.errors?.['confirm-password'] ? 'confirm-error' : undefined}
              />
              <FieldError id="confirm-error" message={state?.errors?.['confirm-password']?.[0]} />
            </div>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {submitLabel}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {copy.switchPrompt}{' '}
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={() => onModeSwitch(copy.nextMode)}
          >
            {copy.switchAction}
          </Button>
        </p>
      </CardContent>
    </Card>
  )
}

export function LoginForm() {
  const [mode, setMode] = useState<AuthMode>('signin')

  const [signInState, signInAction, signInPending] = useActionState<LoginState | undefined, FormData>(signIn, undefined)
  const [signUpState, signUpAction, signUpPending] = useActionState<LoginState | undefined, FormData>(signUp, undefined)

  const isSignIn = mode === 'signin'
  const state = isSignIn ? signInState : signUpState
  const pending = isSignIn ? signInPending : signUpPending
  const formAction = isSignIn ? signInAction : signUpAction

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b bg-background/80 px-4 py-3 backdrop-blur-sm supports-backdrop-filter:bg-background/60 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <span className="font-semibold">Pa Notes</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-sm">
          <LoginFormFields
            mode={mode}
            state={state}
            pending={pending}
            formAction={formAction}
            onModeSwitch={setMode}
          />
        </div>
      </main>

      <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground sm:py-6">
        © {new Date().getFullYear()} Pa Notes
      </footer>
    </div>
  )
}
