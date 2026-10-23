import { Router } from 'express'
import authRoutes from './authRoutes.js'
import chatRoutes from './chatRoutes.js'

const router = Router()

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Agentic AirBNB API is running' })
})

router.use('/auth', authRoutes)
router.use('/chat', chatRoutes)

export default router
