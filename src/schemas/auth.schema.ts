import { z } from 'zod'

export const signInSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export const signUpSchema = z
  .object({
    email: z.email('Enter a valid email address.'),
    password: z.string().min(1, 'Password is required.'),
    'confirm-password': z.string().min(1, 'Please confirm your password.'),
  })
  .refine(data => data.password === data['confirm-password'], {
    message: 'Passwords do not match.',
    path: ['confirm-password'],
  })
