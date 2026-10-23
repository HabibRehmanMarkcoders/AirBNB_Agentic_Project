import { Router } from 'express'
import { sendMessage } from '../controllers/chatController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/', authenticate, sendMessage)

export default router
