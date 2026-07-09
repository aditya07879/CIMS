const mongoose = require('mongoose');

const CATEGORIES = ['Academic', 'Infrastructure', 'Administration', 'Faculty', 'Other'];
const STATUSES = ['Open', 'Under Review', 'Resolved', 'Rejected'];

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 1000 },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  category: { type: String, required: true, enum: CATEGORIES },
  status: { type: String, enum: STATUSES, default: 'Open' },
  isAnonymous: { type: Boolean, default: false },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  tags: [{ type: String, trim: true }],
  isDeleted: { type: Boolean, default: false },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deleteReason: { type: String },
  deletedAt: { type: Date },
  statusUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  statusUpdatedAt: { type: Date },
  resolvedAt: { type: Date },
}, { timestamps: true });

issueSchema.index({ classroom: 1, status: 1 });
issueSchema.index({ author: 1, createdAt: -1 });
issueSchema.index({ isDeleted: 1 });

issueSchema.virtual('voteScore').get(function () {
  return this.upvotes.length - this.downvotes.length;
});

module.exports = mongoose.model('Issue', issueSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.STATUSES = STATUSES;
