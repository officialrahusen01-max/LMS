import mongoose from 'mongoose';

/** Blog schema */
const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  coAuthors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  excerpt: { type: String },
  content: { type: String },
  categories: [{ type: String, index: true }],
  tags: [{ type: String, index: true }],
  seo: { metaTitle: String, metaDescription: String, canonicalUrl: String },
  featuredImage: { type: String },
  featuredImagePublicId: { type: String },
  published: { type: Boolean, default: false },
  publishedAt: { type: Date },
  includeInAi: { type: Boolean, default: true },
  stats: { views: { type: Number, default: 0 }, commentsCount: { type: Number, default: 0 } },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Text index for search
blogSchema.index({ title: 'text', content: 'text' });

// Slug generation may be handled in service layer; keep hook placeholder
blogSchema.pre('save', function(next) {
  // Optionally generate slug if not provided (service layer can override)
  if (!this.slug && this.title) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  }
  next();
});

export default mongoose.model('Blog', blogSchema);
