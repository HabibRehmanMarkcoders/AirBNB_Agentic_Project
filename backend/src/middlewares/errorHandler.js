import { HTTP_STATUS } from '../constants/httpStatus.js'
import { env } from '../config/env.js'

export function notFoundHandler(_req, res) {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
  })
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
  const message = err.message || 'Internal server error'

  if (env.nodeEnv !== 'production') {
    console.error(err)
  }

  res.status(statusCode).json({
    success: false,
    message,
  })
}
