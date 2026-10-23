import { generateReply } from './chatService.js'

export const sendMessage = async (req, res) => {
  try {
    const { message, history = [] } = req.body
    const result = await generateReply(message, history)

    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || 'Server error',
    })
  }
}
