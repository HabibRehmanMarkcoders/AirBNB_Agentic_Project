import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AppError } from './AppError.js'
import { HTTP_STATUS } from '../constants/httpStatus.js'
import { MESSAGES } from '../constants/messages.js'

function assertJwtSecret() {
  if (!env.jwtSecret) {
    throw new AppError(MESSAGES.JWT_SECRET_MISSING, HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
}

export function signToken(payload) {
  assertJwtSecret()
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}

export function verifyToken(token) {
  assertJwtSecret()
  try {
    return jwt.verify(token, env.jwtSecret)
  } catch {
    throw new AppError(MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED)
  }
}
