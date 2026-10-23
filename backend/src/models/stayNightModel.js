import mongoose from 'mongoose'

/**
 * One document per RESERVED night. Absence of a document = night is free.
 * The unique compound index on { listingId, date } is the double-booking
 * guard — the database rejects the second insert, not application code.
 */
const stayNightSchema = new mongoose.Schema(
  {
    listingId: {
      type: String,
      required: true,
    },
    date: {
      type: String, // ISO date "2026-11-03"
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    state: {
      type: String,
      enum: ['held', 'booked'],
      required: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true },
)

// Unique compound index: no two reservations for the same listing-night.
stayNightSchema.index({ listingId: 1, date: 1 }, { unique: true })

export default mongoose.models.StayNight ||
  mongoose.model('StayNight', stayNightSchema, 'stay_nights')
