export function getProfileInitials(profile: {
  email: string
  display_name?: string | null
}): string {
  if (profile.display_name?.trim()) {
    return profile.display_name
      .trim()
      .split(/\s+/)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
  return profile.email.slice(0, 2).toUpperCase()
}
