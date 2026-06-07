'use client'

import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { signOut } from '@/features/auth/api/actions'
import type { Profile } from '@/features/profile/api/actions'
import { getProfileInitials } from '@/features/profile/lib/initials'

interface UserMenuProps {
  profile: Profile
}

export function UserMenu({ profile }: Readonly<UserMenuProps>) {
  const router = useRouter()
  const initials = getProfileInitials(profile)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
          'rounded-full'
        )}
        aria-label="Open user menu"
      >
        <Avatar size="sm">
          {profile.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? profile.email} />
          )}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="truncate font-medium">{profile.display_name ?? 'User'}</p>
            <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <User className="h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
