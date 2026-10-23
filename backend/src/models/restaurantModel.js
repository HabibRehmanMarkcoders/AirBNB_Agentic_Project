import mongoose from 'mongoose'

const periodSchema = new mongoose.Schema(
  {
    open: { type: String, required: true },     // "12:00"
    close: { type: String, required: true },    // "15:00"
    lastSeating: { type: String },              // "14:30"
  },
  { _id: false },
)

const hoursSchema = new mongoose.Schema(
  {
    dow: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday
    periods: [periodSchema],
  },
  { _id: false },
)

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    cuisine: {
      type: [String],
      default: [],
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
      },
    },
    timezone: {
      type: String, // IANA, e.g. "Asia/Karachi"
      required: true,
    },
    hours: {
      type: [hoursSchema],
      default: [],
    },
    slotIntervalMin: {
      type: Number,
      default: 30,
    },
    maxPartySize: {
      type: Number,
      default: 10,
    },
    paxPerSlot: {
      type: Number,
      default: 20,
    },
    depositPolicy: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    cancellationPolicy: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true },
)

// ESR: city + status equalities, then cuisine range.
restaurantSchema.index({ city: 1, status: 1, cuisine: 1 })
// Geo queries: "restaurants near listing X".
restaurantSchema.index({ location: '2dsphere' })

export default mongoose.models.Restaurant ||
  mongoose.model('Restaurant', restaurantSchema, 'restaurants')
