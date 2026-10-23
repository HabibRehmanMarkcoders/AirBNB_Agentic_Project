import mongoose from 'mongoose'

/**
 * Every tool call the agent makes is logged here for audit,
 * debugging, and compliance. 90-day TTL keeps the collection
 * from growing unbounded.
 */
const agentAuditLogSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String, // human-readable label, e.g. "tool_call", "tool_result"
    required: true,
  },
  toolName: {
    type: String,
  },
  toolArgs: {
    type: mongoose.Schema.Types.Mixed,
  },
  toolResult: {
    type: mongoose.Schema.Types.Mixed,
  },
  ts: {
    type: Date,
    default: Date.now,
  },
})

// Replay a conversation's agent actions in order.
agentAuditLogSchema.index({ conversationId: 1, ts: 1 })

// All actions by a given user, newest first.
agentAuditLogSchema.index({ userId: 1, ts: -1 })

// 90-day TTL — keeps the collection bounded.
agentAuditLogSchema.index(
  { ts: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
)

export default mongoose.models.AgentAuditLog ||
  mongoose.model('AgentAuditLog', agentAuditLogSchema, 'agent_audit_log')
