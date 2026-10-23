import { Router } from 'express'
import {
  signup,
  login,
  logout,
  me,
} from '../controllers/authController.js'
import { optionalAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { signupSchema, loginSchema } from '../middleware/userSchema.js'

const router = Router()

router.post('/signup', validate(signupSchema), signup)
router.post('/login', validate(loginSchema), login)
router.post('/logout', logout)
router.get('/me', optionalAuth, me)

export default router
