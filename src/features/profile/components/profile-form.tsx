'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Trash2 } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage, Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from '@/components/ui'

import { removeAvatar, updateProfile } from '@/features/profile/api/actions'
import { getProfileInitials } from '@/features/profile/lib/initials'

import type { Profile } from '@/features/profile/api/actions'

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: Readonly<ProfileFormProps>) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatar_url)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const initials = getProfileInitials({ ...profile, display_name: displayName })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setSuccess(false)
    setError(null)
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const file = fileRef.current?.files?.[0]
    if (file) formData.set('avatar', file)

    startTransition(async () => {
      const result = await updateProfile(formData)
      if (!result.success) {
        setError(result.error)
        setPreviewUrl(profile.avatar_url)
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }

  function handleRemoveAvatar() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await removeAvatar()
      if (!result.success) {
        setError(result.error)
        return
      }
      setPreviewUrl(null)
      if (fileRef.current) fileRef.current.value = ''
      setSuccess(true)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your display name and avatar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar size="lg" className="size-20">
              {previewUrl && (
                <AvatarImage src={previewUrl} alt={displayName || profile.email} />
              )}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                name="avatar"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={isPending}
              >
                <Camera className="h-4 w-4" />
                Change avatar
              </Button>
              {previewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove avatar
                </Button>
              )}
              <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or GIF. Max 2 MB.</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="display_name">Display name</Label>
            <Input
              id="display_name"
              name="display_name"
              value={displayName}
              onChange={e => { setDisplayName(e.target.value); setSuccess(false) }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled />
            <p className="text-xs text-muted-foreground">Email is managed through your account and cannot be changed here.</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-muted-foreground">Profile updated.</p>}

          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
