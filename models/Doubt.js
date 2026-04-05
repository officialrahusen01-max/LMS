import mongoose from 'mongoose';

/** Doubt/Q&A Document */
const doubtSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
  
  // Question
  question: { type: String, required: true },
  questionEmbedding: { type: [Number], default: [] }, // Vector embedding for semantic search
  
  // AI Response
  answer: { type: String, required: true },
  sourceType: { type: String, enum: ['lesson', 'course-note', 'blog'] }, // Source of context used
  sourceId: { type: mongoose.Schema.Types.ObjectId }, // Which lesson/blog was used
  relevantChunks: [{ // Top K chunks used for context
    text: String,
    type: String,
    similarity: Number,
  }],
  
  // Quality metrics
  isHelpful: { type: Boolean, default: null }, // Student feedback
  rating: { type: Number, min: 1, max: 5, default: null }, // 1-5 star rating
  clearedDoubt: { type: Boolean, default: false }, // Did this solve the doubt?
  followUpQuestions: [String], // Related questions the student might ask
  
  // Admin/Instructor response
  instructorComment: { type: String, default: null },
  instructorCommentedAt: { type: Date, default: null },
  
  status: { type: String, enum: ['open', 'resolved', 'pending-review'], default: 'open' },
  
}, { timestamps: true });

doubtSchema.index({ student: 1, course: 1 });
doubtSchema.index({ status: 1 });
doubtSchema.index({ createdAt: -1 });

export default mongoose.model('Doubt', doubtSchema);
