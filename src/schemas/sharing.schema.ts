import { z } from 'zod'

export const shareDocumentSchema = z.object({
  email: z.email('Enter a valid email address.'),
  role: z.enum(['viewer', 'editor'], { error: 'Role must be viewer or editor.' }),
})
