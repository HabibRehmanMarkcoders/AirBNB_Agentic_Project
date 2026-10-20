import cors from 'cors'
import dns from 'node:dns'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB } from './config/db.js'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'
import routes from './routes/index.js'

// Prefer IPv4 so Gemini calls don't hang on broken IPv6 routes.
dns.setDefaultResultOrder('ipv4first')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

const corsOrigins = env.corsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true)
        return
      }
      callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.resolve(__dirname, '../public')))

app.use('/api', routes)

app.use(notFoundHandler)
app.use(errorHandler)

async function start() {
  await connectDB()

  app.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`)
    if (!env.jwtSecret) {
      console.warn('Warning: JWT_SECRET is empty. Set it in backend/.env before using auth.')
    }
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err.message)
  process.exit(1)
})

export default app
