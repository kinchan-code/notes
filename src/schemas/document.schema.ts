import { z } from 'zod'

export const renameTitleSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty.')
    .max(255, 'Title must be 255 characters or fewer.'),
})

export const documentContentSchema = z.object({
  content_text: z.string().min(1, 'Document content cannot be empty.'),
  content_html: z.string(),
})

export const importContentSchema = z.object({
  content: z.string().min(1, 'The uploaded file is empty.'),
})
