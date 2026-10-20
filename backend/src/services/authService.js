import { HTTP_STATUS } from '../constants/httpStatus.js'
import { MESSAGES } from '../constants/messages.js'
import User from '../models/userModel.js'
import { AppError } from '../utils/AppError.js'
import { signToken } from '../utils/token.js'

function isDuplicateKeyError(err) {
  return err?.code === 11000
}

function duplicateFieldMessage(err) {
  const field = Object.keys(err.keyPattern || {})[0]
  if (field === 'username') return MESSAGES.USERNAME_EXISTS
  if (field === 'email') return MESSAGES.EMAIL_EXISTS
  return MESSAGES.EMAIL_EXISTS
}

export async function signup({ username, email, password }) {
  try {
    const user = await User.create({ username, email, password })
    const token = signToken({
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
    })

    return { user: user.toPublicJSON(), token }
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new AppError(duplicateFieldMessage(err), HTTP_STATUS.CONFLICT)
    }

    if (err?.name === 'ValidationError') {
      const message = Object.values(err.errors)
        .map((e) => e.message)
        .join('. ')
      throw new AppError(message || MESSAGES.VALIDATION_FAILED, HTTP_STATUS.BAD_REQUEST)
    }

    throw err
  }
}

export async function login({ email, password }) {
  if (!email || !password) {
    throw new AppError('Email and password are required', HTTP_STATUS.BAD_REQUEST)
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password')

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError(MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED)
  }

  const token = signToken({
    sub: user._id.toString(),
    email: user.email,
    username: user.username,
  })

  return { user: user.toPublicJSON(), token }
}

export async function getMe(userId) {
  const user = await User.findById(userId)
  if (!user) {
    throw new AppError(MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }
  return user.toPublicJSON()
}
