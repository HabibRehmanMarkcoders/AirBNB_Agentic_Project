import mongoose from 'mongoose'

/**
 * Confirmation gate — the agent creates a pending action, shows it
 * to the user, and only executes after explicit confirmation.
 *
 * TTL index on expiresAt is safe here because expiring a pending
 * action has no side-effects (no counters, no seats to release).
 */
const pendingActionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actionType: {
      type: String, // "book_stay", "book_restaurant", "process_payment"
      required: true,
    },
    actionPayload: {
      type: mongoose.Schema.Types.Mixed, // the full action details
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'expired', 'cancelled'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
)

// Find pending actions for a user.
pendingActionSchema.index({ userId: 1, status: 1 })

// TTL: auto-delete expired actions. Safe because no counters are involved.
pendingActionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.PendingAction ||
  mongoose.model('PendingAction', pendingActionSchema, 'pending_actions')
