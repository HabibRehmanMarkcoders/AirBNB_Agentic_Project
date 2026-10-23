import mongoose from 'mongoose'

/**
 * Payments for stays and restaurant deposits.
 *
 * Amounts are stored as integers in the smallest currency unit
 * (e.g. cents for USD) to avoid floating-point arithmetic issues.
 *
 * The provider + providerPaymentId unique index deduplicates
 * webhook deliveries.  The idempotencyKey unique index prevents
 * duplicate payment creation from client retries.
 */

const payableSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['stay', 'restaurant_deposit'],
      required: true,
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { _id: false },
)

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    payable: {
      type: payableSchema,
      required: true,
    },
    amountMinor: {
      type: Number, // cents / paise / etc.
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['created', 'requires_action', 'succeeded', 'failed', 'refunded'],
      default: 'created',
    },
    provider: {
      type: String, // "stripe", "paddle", etc.
      required: true,
      trim: true,
    },
    providerPaymentId: {
      type: String,
      trim: true,
    },
    checkoutUrl: {
      type: String,
      default: null,
    },
    refundedMinor: {
      type: Number,
      default: 0,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

// Deduplicate webhook deliveries from the payment provider.
paymentSchema.index(
  { provider: 1, providerPaymentId: 1 },
  { unique: true },
)

// Prevent duplicate payment creation from client retries.
paymentSchema.index({ idempotencyKey: 1 }, { unique: true })

// "My payments" — user's payment history newest-first.
paymentSchema.index({ userId: 1, createdAt: -1 })

// Look up all payments for a given stay or restaurant booking.
paymentSchema.index({ 'payable.type': 1, 'payable.id': 1 })

// Find stale pending payments for cleanup.
paymentSchema.index(
  { expiresAt: 1 },
  {
    partialFilterExpression: {
      status: { $in: ['created', 'requires_action'] },
    },
  },
)

export default mongoose.models.Payment ||
  mongoose.model('Payment', paymentSchema, 'payments')
