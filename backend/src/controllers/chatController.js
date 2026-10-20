import { HTTP_STATUS } from '../constants/httpStatus.js'
import * as chatService from '../services/chatService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const sendMessage = asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body
  const result = await chatService.generateReply(message, history)

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result,
  })
})
