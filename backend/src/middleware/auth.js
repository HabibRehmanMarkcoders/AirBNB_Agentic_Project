import jwt from 'jsonwebtoken'
import User from '../models/userModel.js'

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
    }
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}


