import 'dotenv/config'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dns from 'node:dns'
import express from 'express'
import connectDB from './db/db.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import routes from './routes/index.js'

dns.setDefaultResultOrder('ipv4first')

const app = express()

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())

app.use('/api', routes)

app.use(notFoundHandler)
app.use(errorHandler)

const start = async () => {
  try {
    await connectDB()
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`)
    })
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

start()

export default app
