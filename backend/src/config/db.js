import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDB() {
  if (!env.mongoUri) {
    throw new Error('MONGO_URI is not set in environment variables')
  }

  mongoose.set('strictQuery', true)
  await mongoose.connect(env.mongoUri)
  console.log('MongoDB connected')
}
