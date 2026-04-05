import Quiz from '../../models/Quiz.js';
import Lesson from '../../models/Lesson.js';
import Progress from '../../models/Progress.js';
import AppError from '../../utils/AppError.js';

class StudentQuizService {
  /**
   * Get quiz questions for a lesson (student view - hides correct answers)
   */
  static async getQuizForTaking(lessonId, userId) {
    const quiz = await Quiz.findOne({ lesson: lessonId })
      .populate('lesson', 'title slug')
      .populate('course', 'title slug');

    if (!quiz) {
      throw new AppError('No quiz available for this lesson', 404);
    }

    if (!quiz.isPublished) {
      throw new AppError('This quiz is not yet published', 403);
    }

    // Return quiz with questions but hide correct answers/sample answers for MCQ
    const questionsForStudent = quiz.questions.map((q) => {
      const questionCopy = {
        _id: q._id,
        type: q.type,
        question: q.question,
        difficulty: q.difficulty,
      };

      if (q.type === 'mcq') {
        questionCopy.options = q.options;
        // Don't include correctOption
      } else if (q.type === 'subjective') {
        // Don't include sampleAnswer for student taking quiz
      }

      return questionCopy;
    });

    return {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      lesson: quiz.lesson,
      course: quiz.course,
      totalQuestions: quiz.totalQuestions,
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
      randomizeQuestions: quiz.randomizeQuestions,
      randomizeOptions: quiz.randomizeOptions,
      questions: questionsForStudent,
    };
  }

  /**
   * Submit quiz answers
   */
  static async submitQuizAnswers(quizId, userId, answers) {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    // Calculate score
    let score = 0;
    let totalPoints = 0;
    const results = [];

    for (const answer of answers) {
      const question = quiz.questions.id(answer.questionId);
      if (!question) continue;

      totalPoints += 1;
      let isCorrect = false;
      let feedback = '';

      if (question.type === 'mcq') {
        isCorrect = answer.selectedOption === question.correctOption;
        if (isCorrect) {
          score += 1;
          feedback = '✓ Correct answer';
        } else {
          feedback = `✗ Incorrect. The correct answer is: ${question.options[question.correctOption]}`;
        }
      } else if (question.type === 'subjective') {
        // For subjective, store the answer for manual review/grading
        feedback = `Your answer has been recorded. Expected answer: ${question.sampleAnswer}`;
      }

      results.push({
        questionId: answer.questionId,
        question: question.question,
        type: question.type,
        studentAnswer: answer.studentAnswer || answer.selectedOption,
        isCorrect,
        feedback,
      });
    }

    const scorePercentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    const isPassed = scorePercentage >= quiz.passingScore;

    // Update lesson progress with quiz score
    const progress = await Progress.findOne({
      user: userId,
      course: quiz.course,
    });

    if (progress) {
      // Find or create lesson entry
      let lessonProgress = progress.lessons.find(
        l => l.lesson.toString() === quiz.lesson.toString()
      );

      if (!lessonProgress) {
        lessonProgress = { lesson: quiz.lesson };
        progress.lessons.push(lessonProgress);
      }

      lessonProgress.quizAttempts = (lessonProgress.quizAttempts || 0) + 1;
      lessonProgress.quizScore = scorePercentage;
      lessonProgress.quizPassed = isPassed;
      lessonProgress.lastQuizAttemptAt = new Date();

      await progress.save();
    } else {
      // Create new progress if doesn't exist
      await Progress.create({
        user: userId,
        course: quiz.course,
        lessons: [
          {
            lesson: quiz.lesson,
            quizAttempts: 1,
            quizScore: scorePercentage,
            quizPassed: isPassed,
            lastQuizAttemptAt: new Date(),
          },
        ],
      });
    }

    return {
      quizId,
      scorePercentage,
      score,
      totalPoints,
      passed: isPassed,
      passingScore: quiz.passingScore,
      results,
      showAnswers: quiz.showAnswers,
    };
  }

  /**
   * Get quiz results for a student
   */
  static async getQuizResults(quizId, userId) {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    const progress = await Progress.findOne({
      user: userId,
      course: quiz.course,
    }).populate('lessons.lesson', 'title slug');

    if (!progress) {
      throw new AppError('No quiz attempts found', 404);
    }

    const lessonProgress = progress.lessons.find(
      l => l.lesson._id.toString() === quiz.lesson.toString()
    );

    if (!lessonProgress || lessonProgress.quizAttempts === 0) {
      throw new AppError('No quiz attempts for this lesson', 404);
    }

    return {
      quizId,
      quizTitle: quiz.title,
      lesson: lessonProgress.lesson,
      quizAttempts: lessonProgress.quizAttempts,
      lastAttemptAt: lessonProgress.lastQuizAttemptAt,
      score: lessonProgress.quizScore,
      passed: lessonProgress.quizPassed,
      passingScore: quiz.passingScore,
    };
  }

  /**
   * Get published quiz for student (can only take if enrolled)
   */
  static async getPublishedQuizByLesson(lessonId) {
    const quiz = await Quiz.findOne({ lesson: lessonId, isPublished: true })
      .select('-questions') // Don't return questions in list view
      .populate('lesson', 'title slug')
      .populate('course', 'title slug');

    return quiz;
  }
}

export default StudentQuizService;
