import { HTTP_STATUS } from '../constants/httpStatus.js'
import { MESSAGES } from '../constants/messages.js'
import User from '../models/userModel.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { verifyToken } from '../utils/token.js'

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const token = header.slice(7).trim()
  if (!token) {
    throw new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  const payload = verifyToken(token)
  const user = await User.findById(payload.sub)

  if (!user) {
    throw new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
  }

  req.user = user.toPublicJSON()
  next()
})
