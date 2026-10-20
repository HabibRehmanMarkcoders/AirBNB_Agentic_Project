import { Router } from 'express'
import * as chatController from '../controllers/chatController.js'

const router = Router()

router.post('/', chatController.sendMessage)

export default router
