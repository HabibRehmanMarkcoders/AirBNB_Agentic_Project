import { z } from 'zod'

export const signupSchema = z
  .object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
    username: z.string().trim().min(2).max(40).optional(),
    name: z.string().trim().min(2).max(40).optional(),
  })
  .refine((data) => Boolean((data.username || data.name || '').trim()), {
    message: 'Name is required',
    path: ['username'],
  })
  .transform((data) => ({
    username: (data.username || data.name).trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password,
  }))

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
})
