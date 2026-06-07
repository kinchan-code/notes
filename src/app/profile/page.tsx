import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'

import { getCurrentProfile, ProfileForm, UserMenu } from '@/features/profile'
import { BackToDashboardLink } from '@/features/profile/components/back-to-dashboard-link'

export default async function ProfilePage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <span className="truncate font-semibold">Pa Notes</span>
          </div>
          <UserMenu profile={profile} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <BackToDashboardLink />
        <div className="max-w-lg place-self-center">
          <ProfileForm profile={profile} />
        </div>
      </main>
    </div>
  )
}
