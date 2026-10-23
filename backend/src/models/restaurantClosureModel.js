import mongoose from 'mongoose'

/**
 * Holidays, private events, or any day a restaurant is closed
 * outside its regular schedule. The unique index prevents
 * duplicate closure entries for the same restaurant + date.
 */
const restaurantClosureSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    localDate: {
      type: String, // "2026-11-03"
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
)

restaurantClosureSchema.index(
  { restaurantId: 1, localDate: 1 },
  { unique: true },
)

export default mongoose.models.RestaurantClosure ||
  mongoose.model(
    'RestaurantClosure',
    restaurantClosureSchema,
    'restaurant_closures',
  )
