import { HTTP_STATUS } from '../constants/httpStatus.js'
import { MESSAGES } from '../constants/messages.js'
import User from '../models/userModel.js'
import * as authService from '../services/authService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body

  const result = await authService.signup({ username, email, password })

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: MESSAGES.SIGNUP_SUCCESS,
    data: result,
  })
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const result = await authService.login({ email, password })

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: MESSAGES.LOGIN_SUCCESS,
    data: result,
  })
})

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: MESSAGES.USER_NOT_FOUND,
    })
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { user: user.toPublicJSON() },
  })
})
