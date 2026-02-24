import mongoose from 'mongoose';

/** Comment schema for lessons, courses, blogs and course-level Q&A */
const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true },
  targetType: { type: String, enum: ['lesson','course','blog'], required: true, index: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  isQuestion: { type: Boolean, default: false },
  acceptedAnswer: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  status: { type: String, enum: ['visible','hidden','reported'], default: 'visible', index: true },
  votes: { type: Number, default: 0 },
  editedAt: { type: Date },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

commentSchema.index({ targetType: 1, targetId: 1 });

// Virtual children count (can be populated in aggregation)
commentSchema.virtual('childrenCount', {
  ref: 'Comment', localField: '_id', foreignField: 'parent', count: true
});

/** Mark an answer as accepted (service layer should validate permission before calling) */
commentSchema.methods.markAccepted = function(answerCommentId) {
  this.acceptedAnswer = answerCommentId;
  return this.save();
};

export default mongoose.model('Comment', commentSchema);
