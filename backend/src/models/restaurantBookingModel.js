import mongoose from 'mongoose'

/**
 * Restaurant reservations. Key design points:
 *
 * - The partial-unique index on { userId, restaurantId, startUtc } with
 *   { isActive: true } prevents double-booking but allows re-booking
 *   after cancellation.
 * - holdExpiresAt is indexed with a partial filter so the reaper job
 *   can efficiently find expired holds.  TTL is NOT used here because
 *   releasing a hold requires giving seats back (decrement capacityRemaining).
 * - idempotencyKey prevents duplicate creates from retries.
 */
const restaurantBookingSchema = new mongoose.Schema(
  {
    ref: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RestaurantSlot',
      required: true,
    },
    partySize: {
      type: Number,
      required: true,
      min: 1,
    },
    startUtc: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['held', 'confirmed', 'cancelled', 'no_show'],
      default: 'held',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    holdExpiresAt: {
      type: Date,
    },
    depositPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
    },
  },
  { timestamps: true },
)

// "My bookings" — user's reservations newest-first.
restaurantBookingSchema.index({ userId: 1, startUtc: -1 })

// Idempotency: reject duplicate creates.
restaurantBookingSchema.index(
  { idempotencyKey: 1 },
  { unique: true, sparse: true },
)

// Reaper: find expired holds efficiently.
restaurantBookingSchema.index(
  { holdExpiresAt: 1 },
  { partialFilterExpression: { status: 'held' } },
)

// No duplicate active booking for the same user + restaurant + time.
restaurantBookingSchema.index(
  { userId: 1, restaurantId: 1, startUtc: 1 },
  { unique: true, partialFilterExpression: { isActive: true } },
)

export default mongoose.models.RestaurantBooking ||
  mongoose.model(
    'RestaurantBooking',
    restaurantBookingSchema,
    'restaurant_bookings',
  )
