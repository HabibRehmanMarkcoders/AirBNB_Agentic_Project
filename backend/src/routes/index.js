import { Router } from 'express'
import { MESSAGES } from '../constants/messages.js'
import authRoutes from './authRoutes.js'
import chatRoutes from './chatRoutes.js'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ success: true, message: MESSAGES.SERVER_RUNNING })
})

router.use('/auth', authRoutes)
router.use('/chat', chatRoutes)

export default router
