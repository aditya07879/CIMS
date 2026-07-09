const mongoose = require('mongoose');

/**
 * IssueEscalation: tracks when a mentor forwards an issue to their assigned HOD.
 * One escalation record per (issue + mentor) pair — a mentor cannot forward the same
 * issue twice. Immutable once created; HOD updates only the `status` field.
 */
const ESCALATION_STATUSES = ['Forwarded', 'Acknowledged', 'Resolved'];

const issueEscalationSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
    },
    forwardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    forwardedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Snapshot at forward-time so HOD view stays consistent even if issue is edited
    snapshot: {
      title:       { type: String, required: true },
      description: { type: String, required: true },
      category:    { type: String, required: true },
    },
    // Escalation-level status (independent of the issue's own status)
    status: {
      type: String,
      enum: ESCALATION_STATUSES,
      default: 'Forwarded',
    },
    statusUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    statusUpdatedAt: { type: Date },
    note: { type: String, maxlength: 500 }, // optional mentor note when forwarding
  },
  { timestamps: true }
);

// A mentor can forward a specific issue only once
issueEscalationSchema.index({ issue: 1, forwardedBy: 1 }, { unique: true });

// HOD inbox query: all escalations addressed to them, newest first
issueEscalationSchema.index({ forwardedTo: 1, createdAt: -1 });

// Mentor's forwarded-issues list
issueEscalationSchema.index({ forwardedBy: 1, createdAt: -1 });

module.exports = mongoose.model('IssueEscalation', issueEscalationSchema);
module.exports.ESCALATION_STATUSES = ESCALATION_STATUSES;
