import Enrollment from '../../models/Enrollment.js';
import Progress from '../../models/Progress.js';
import Lesson from '../../models/Lesson.js';
import Course from '../../models/Course.js';
import AIService from '../../instructor/services/aiService.js';
import AppError from '../../utils/AppError.js';

function toStr(x) {
  return x == null ? '' : String(x);
}

function maxDate(dates) {
  let best = null;
  for (const d of dates) {
    const dt = d instanceof Date ? d : d ? new Date(d) : null;
    if (!dt || Number.isNaN(dt.getTime())) continue;
    if (!best || dt > best) best = dt;
  }
  return best;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

class SmartLearningService {
  /**
   * Recommendations based on student's enrollments + progress.
   * - Continue list (sorted by recent activity)
   * - Next lesson per course (first incomplete lesson by order)
   */
  static async getRecommendations(userId, opts = {}) {
    const limit = Math.min(25, Math.max(1, parseInt(opts.limit || '10', 10) || 10));

    const enrollments = await Enrollment.find({ user: userId, status: { $in: ['active', 'completed'] } })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    const courseIds = enrollments.map((e) => e.course).filter(Boolean);
    const [courses, progresses] = await Promise.all([
      Course.find({ _id: { $in: courseIds } }).select('title slug published').lean(),
      Progress.find({ user: userId, course: { $in: courseIds } }).select('course percentComplete lessons finalQuiz updatedAt').lean(),
    ]);

    const courseById = new Map(courses.map((c) => [toStr(c._id), c]));
    const progressByCourseId = new Map(progresses.map((p) => [toStr(p.course), p]));

    const nextLessonsByCourseId = new Map();
    const lessons = await Lesson.find({ course: { $in: courseIds } })
      .select('course title slug order duration')
      .sort({ course: 1, order: 1 })
      .lean();

    const lessonsByCourse = new Map();
    for (const l of lessons) {
      const cid = toStr(l.course);
      if (!lessonsByCourse.has(cid)) lessonsByCourse.set(cid, []);
      lessonsByCourse.get(cid).push(l);
    }

    for (const [cid, list] of lessonsByCourse.entries()) {
      const p = progressByCourseId.get(cid);
      const completed = new Set((p?.lessons || []).filter((x) => x.completed).map((x) => toStr(x.lesson)));
      const next = list.find((l) => !completed.has(toStr(l._id)));
      if (next) nextLessonsByCourseId.set(cid, next);
    }

    const continueCourses = enrollments
      .map((e) => {
        const cid = toStr(e.course);
        const course = courseById.get(cid) || null;
        const prog = progressByCourseId.get(cid) || null;
        const lessonDates = (prog?.lessons || []).map((x) => x.lastSeenAt);
        const lastSeenAt = maxDate([prog?.updatedAt, ...lessonDates, e.updatedAt, e.enrolledAt]);
        return {
          courseId: cid,
          courseTitle: course?.title,
          courseSlug: course?.slug,
          status: e.status,
          percentComplete: prog?.percentComplete ?? 0,
          lastSeenAt,
          nextLesson: nextLessonsByCourseId.get(cid)
            ? {
                lessonId: toStr(nextLessonsByCourseId.get(cid)._id),
                title: nextLessonsByCourseId.get(cid).title,
                slug: nextLessonsByCourseId.get(cid).slug,
                order: nextLessonsByCourseId.get(cid).order,
              }
            : null,
        };
      })
      .sort((a, b) => {
        const ad = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
        const bd = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
        return bd - ad;
      });

    const suggestedNext = continueCourses
      .filter((c) => c.status === 'active')
      .filter((c) => (c.percentComplete ?? 0) < 100)
      .slice(0, 5);

    return {
      continueCourses,
      suggestedNext,
    };
  }

  /**
   * Weak topics heuristic:
   * - Lessons started but not completed, and either low watch time or stale activity.
   * - Final quiz score (if tracked) below a threshold.
   */
  static async getWeakTopics(userId, courseId) {
    if (!courseId) throw new AppError('courseId is required', 400);

    const enrollment = await Enrollment.findOne({ user: userId, course: courseId, status: 'active' }).lean();
    if (!enrollment) throw new AppError('Must be enrolled in course', 403);

    const [course, lessons, progress] = await Promise.all([
      Course.findById(courseId).select('title slug').lean(),
      Lesson.find({ course: courseId }).select('title slug order duration').sort({ order: 1 }).lean(),
      Progress.findOne({ user: userId, course: courseId }).select('percentComplete lessons finalQuiz updatedAt').lean(),
    ]);

    const lessonProgressById = new Map((progress?.lessons || []).map((lp) => [toStr(lp.lesson), lp]));

    const weak = [];
    const staleCutoff = daysAgo(3);
    for (const l of lessons) {
      const lp = lessonProgressById.get(toStr(l._id));
      if (!lp) continue; // not started
      if (lp.completed) continue;

      const seconds = Number(lp.secondsWatched || 0);
      const duration = Number(l.duration || 0); // seconds (if provided)
      const lastSeenAt = lp.lastSeenAt ? new Date(lp.lastSeenAt) : null;

      const lowWatch = seconds > 0 && seconds < 60;
      const stale = lastSeenAt && lastSeenAt < staleCutoff;
      const tooLittleForLongVideo = duration >= 600 && seconds < 120;

      if (lowWatch || stale || tooLittleForLongVideo) {
        weak.push({
          type: 'lesson',
          lessonId: toStr(l._id),
          title: l.title,
          slug: l.slug,
          order: l.order,
          secondsWatched: seconds,
          lastSeenAt: lp.lastSeenAt || null,
          reason: stale
            ? 'You started this lesson but have not returned recently.'
            : 'You started this lesson but watched very little so far.',
        });
      }
    }

    const quizScore = Number(progress?.finalQuiz?.score || 0);
    if (progress?.finalQuiz && progress.finalQuiz.passed === false && quizScore > 0 && quizScore < 60) {
      weak.push({
        type: 'finalQuiz',
        title: 'Final quiz',
        score: quizScore,
        reason: 'Your last recorded quiz score is below 60%.',
      });
    }

    return {
      course: course ? { courseId: toStr(course._id), title: course.title, slug: course.slug } : { courseId: toStr(courseId) },
      percentComplete: progress?.percentComplete ?? 0,
      items: weak.slice(0, 10),
    };
  }

  /**
   * Personal tutor: AI answer + auto suggestions from progress.
   * Uses course-scoped embeddings when courseId is provided.
   */
  static async tutor(userId, payload = {}) {
    const message = toStr(payload.message).trim();
    if (!message) throw new AppError('message is required', 400);
    if (message.length > 1200) throw new AppError('message must be <= 1200 characters', 400);

    const courseId = payload.courseId || null;
    let weakTopics = null;
    if (courseId) {
      weakTopics = await this.getWeakTopics(userId, courseId).catch(() => null);
    }

    const coachPrefixParts = [];
    if (weakTopics?.items?.length) {
      coachPrefixParts.push(
        `Student weak topics (auto-detected): ${weakTopics.items
          .filter((x) => x.type === 'lesson')
          .slice(0, 5)
          .map((x) => x.title)
          .filter(Boolean)
          .join(', ')}`
      );
    }
    const coachPrefix = coachPrefixParts.length ? `${coachPrefixParts.join('\n')}\n\n` : '';

    const ai = await AIService.askQuestion(`${coachPrefix}${message}`, courseId);

    const recommendations = await this.getRecommendations(userId, { limit: 10 }).catch(() => null);

    return {
      answer: ai?.answer,
      recommendedContent: ai?.recommendedContent ?? [],
      similarityScore: ai?.similarityScore ?? 0,
      coach: {
        weakTopics,
        suggestedNext: recommendations?.suggestedNext ?? [],
      },
    };
  }
}

export default SmartLearningService;

