import mongoose from 'mongoose';

/** Embedding document used by AI assistant
 * - Scoped by course or blog
 */
const embeddingSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
  blog: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', default: null, index: true },
  sourceType: { type: String, enum: ['lesson','course-note','blog'], required: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  chunkText: { type: String, required: true },
  embeddingVectorId: { type: String, required: true },
  embeddingMeta: {
    score: Number,
    tokens: Number,
    /** Dense embedding vector (e.g. OpenAI embeddings). */
    vector: { type: [Number], default: undefined },
  },
  createdAt: { type: Date, default: Date.now }
});

// Composite index for lookups by source
embeddingSchema.index({ sourceType: 1, sourceId: 1 });

export default mongoose.model('Embedding', embeddingSchema);
