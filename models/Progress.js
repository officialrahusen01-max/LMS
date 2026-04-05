import mongoose from 'mongoose';

/** Progress per (user, course) */
const lessonProgressSub = new mongoose.Schema({
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  completed: { type: Boolean, default: false },
  lastSeenAt: { type: Date },
  lastPosition: { type: Number, default: 0 },
  secondsWatched: { type: Number, default: 0 },
  // Quiz tracking
  quizAttempts: { type: Number, default: 0 },
  quizScore: { type: Number, default: 0 }, // Percentage
  quizPassed: { type: Boolean, default: false },
  lastQuizAttemptAt: { type: Date },
}, { _id: false });

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  lessons: { type: [lessonProgressSub], default: [] },
  percentComplete: { type: Number, default: 0, index: true },
  finalQuiz: { passed: { type: Boolean, default: false }, score: { type: Number, default: 0 } },
  certificateIssuedAt: { type: Date, default: null },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

progressSchema.index({ user: 1, course: 1 }, { unique: true });

// Virtual: completed lessons count
progressSchema.virtual('completedLessonsCount').get(function() {
  return (this.lessons || []).filter(l => l.completed).length;
});

/** Recalculate percentComplete given totalLessonsCount (if omitted, fetch count from Lesson model) */
progressSchema.methods.recalculatePercent = async function(totalLessonsCount) {
  if (typeof totalLessonsCount !== 'number') {
    const Lesson = mongoose.model('Lesson');
    totalLessonsCount = await Lesson.countDocuments({ course: this.course });
  }
  const completed = (this.lessons || []).filter(l => l.completed).length;
  this.percentComplete = totalLessonsCount ? Math.round((completed / totalLessonsCount) * 100) : 0;
  this.markModified('percentComplete');
  return this.percentComplete;
};

/** Mark a lesson completed (creates lesson entry if missing) */
progressSchema.methods.markLessonCompleted = async function(lessonId, opts = {}) {
  const now = new Date();
  let item = (this.lessons || []).find(l => l.lesson.toString() === lessonId.toString());
  if (!item) {
    item = { lesson: lessonId, completed: true, lastSeenAt: now, lastPosition: opts.lastPosition || 0, secondsWatched: opts.secondsWatched || 0 };
    this.lessons.push(item);
  } else {
    item.completed = true;
    item.lastSeenAt = now;
    if (typeof opts.lastPosition === 'number') item.lastPosition = opts.lastPosition;
    if (typeof opts.secondsWatched === 'number') item.secondsWatched = (item.secondsWatched || 0) + opts.secondsWatched;
  }
  await this.recalculatePercent(opts.totalLessonsCount);
  return this.save();
};

/** Certificate eligibility check (uses Course.certificate settings) */
progressSchema.methods.isCertificateEligible = async function() {
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course).select('certificate').lean();
  if (!course) return false;
  const threshold = (course.certificate && course.certificate.certificateThresholdPct) || 80;
  if (this.percentComplete < threshold) return false;
  if (course.certificate && course.certificate.requiresFinalQuiz) {
    return !!(this.finalQuiz && this.finalQuiz.passed);
  }
  return true;
};

export default mongoose.model('Progress', progressSchema);
