import { Router } from 'express'
import * as authController from '../controllers/authController.js'
import { authenticate } from '../middlewares/authMiddleware.js'

const router = Router()

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.get('/me', authenticate, authController.me)

export default router
