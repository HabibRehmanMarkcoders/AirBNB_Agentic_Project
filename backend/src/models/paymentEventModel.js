import mongoose from 'mongoose'

/**
 * Webhook event log. Every incoming payment provider event is
 * recorded here for audit and deduplication. The unique index
 * on { provider, eventId } rejects re-processing the same event.
 */
const paymentEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    eventId: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      trim: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

paymentEventSchema.index({ provider: 1, eventId: 1 }, { unique: true })

export default mongoose.models.PaymentEvent ||
  mongoose.model('PaymentEvent', paymentEventSchema, 'payment_events')
