import { z } from 'zod'

export const updateProfileSchema = z.object({
  display_name: z
    .string()
    .min(1, 'Display name cannot be empty.')
    .max(100, 'Display name must be 100 characters or fewer.'),
})

const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_TYPES.has(file.type)) {
    return 'Avatar must be a JPEG, PNG, WebP, or GIF image.'
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return 'Avatar must be 2 MB or smaller.'
  }
  return null
}
