import mongoose from 'mongoose';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Certificate from '../models/Certificate.js';
import RefreshToken from '../models/RefreshToken.js';
import Blog from '../models/Blog.js';
import Comment from '../models/Comment.js';
import Progress from '../models/Progress.js';
import Embedding from '../models/Embedding.js';
import AppError from '../utils/AppError.js';

/** JWT stores user id as string; aggregation $match does not cast to ObjectId like find() does. */
function toObjectId(id) {
  if (id == null) return id;
  if (id instanceof mongoose.Types.ObjectId) return id;
  const s = String(id);
  if (!mongoose.Types.ObjectId.isValid(s)) return id;
  return new mongoose.Types.ObjectId(s);
}

class DashboardService {
  // ===== ADMIN DASHBOARD =====

  static async getAdminStats() {
    try {
      const [
        userStats,
        roleMetrics,
        courseStats,
        enrollmentStats,
        certificateStats,
        sessionStats,
        topCourses,
      ] = await Promise.all([
        this.getUserStats(),
        this.getAdminRoleMetrics(),
        this.getCourseStats(),
        this.getEnrollmentStats(),
        this.getCertificateStats(),
        this.getSessionStats(),
        this.getTopCoursesByEnrollment(),
      ]);

      return {
        users: userStats,
        roleMetrics,
        courses: courseStats,
        enrollments: enrollmentStats,
        certificates: certificateStats,
        sessions: sessionStats,
        topCourses,
      };
    } catch (error) {
      throw new AppError(`Failed to fetch admin stats: ${error.message}`, 500);
    }
  }

  static async getUserStats() {
    const result = await User.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          active: [
            { $match: { status: { $ne: 'suspended' } } },
            { $count: 'count' },
          ],
          suspended: [
            { $match: { status: 'suspended' } },
            { $count: 'count' },
          ],
          byRole: [
            { $unwind: '$roles' },
            { $group: { _id: '$roles', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]);

    return {
      totalUsers: result[0].total[0]?.count || 0,
      activeUsers: result[0].active[0]?.count || 0,
      suspendedUsers: result[0].suspended[0]?.count || 0,
      byRole: result[0].byRole || [],
    };
  }

  /** Instructors / students counts for admin dashboard cards */
  static async getAdminRoleMetrics() {
    const [totalInstructors, instructorActive, totalStudents] = await Promise.all([
      User.countDocuments({ roles: 'instructor' }),
      User.countDocuments({
        roles: 'instructor',
        status: 'active',
        approvedInstructor: true,
      }),
      User.countDocuments({ roles: 'student' }),
    ]);
    const instructorInactive = Math.max(0, totalInstructors - instructorActive);
    return {
      totalInstructors,
      instructorActive,
      instructorInactive,
      totalStudents,
    };
  }

  static async getCourseStats() {
    const result = await Course.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          published: [
            { $match: { published: true } },
            { $count: 'count' },
          ],
          draft: [
            { $match: { published: false } },
            { $count: 'count' },
          ],
          byLevel: [
            {
              $group: {
                _id: '$level',
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    return {
      totalCourses: result[0].total[0]?.count || 0,
      publishedCourses: result[0].published[0]?.count || 0,
      draftCourses: result[0].draft[0]?.count || 0,
      byLevel: result[0].byLevel || [],
    };
  }

  static async getEnrollmentStats() {
    const result = await Enrollment.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          active: [
            { $match: { status: { $in: ['enrolled', 'in_progress'] } } },
            { $count: 'count' },
          ],
          completed: [
            { $match: { status: 'completed' } },
            { $count: 'count' },
          ],
          cancelled: [
            { $match: { status: 'cancelled' } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    return {
      totalEnrollments: result[0].total[0]?.count || 0,
      activeEnrollments: result[0].active[0]?.count || 0,
      completedEnrollments: result[0].completed[0]?.count || 0,
      cancelledEnrollments: result[0].cancelled[0]?.count || 0,
    };
  }

  static async getCertificateStats() {
    const result = await Certificate.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          thisMonth: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    '$issuedAt',
                    new Date(new Date().setDate(1)),
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    return {
      totalCertificates: result[0]?.total || 0,
      certificatesThisMonth: result[0]?.thisMonth || 0,
    };
  }

  static async getSessionStats() {
    const result = await RefreshToken.aggregate([
      {
        $group: {
          _id: null,
          activeSessions: {
            $sum: {
              $cond: [{ $eq: ['$revoked', false] }, 1, 0],
            },
          },
          revokedSessions: {
            $sum: {
              $cond: [{ $eq: ['$revoked', true] }, 1, 0],
            },
          },
        },
      },
    ]);

    return {
      activeSessions: result[0]?.activeSessions || 0,
      revokedSessions: result[0]?.revokedSessions || 0,
    };
  }

  static async getTopCoursesByEnrollment() {
    const result = await Enrollment.aggregate([
      {
        $group: {
          _id: '$course',
          enrollmentCount: { $sum: 1 },
        },
      },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      {
        $project: {
          _id: 1,
          courseTitle: '$course.title',
          courseSlug: '$course.slug',
          enrollmentCount: 1,
        },
      },
    ]);

    return result;
  }

  // ===== INSTRUCTOR DASHBOARD =====

  static async getInstructorStats(instructorId) {
    try {
      const oid = toObjectId(instructorId);
      const [
        courseStats,
        enrollmentStats,
        certificateStats,
        blogStats,
      ] = await Promise.all([
        this.getInstructorCourses(oid),
        this.getInstructorEnrollments(oid),
        this.getInstructorCertificates(oid),
        this.getInstructorBlogStats(oid),
      ]);

      return {
        courses: courseStats,
        enrollments: enrollmentStats,
        certificates: certificateStats,
        blog: blogStats,
      };
    } catch (error) {
      throw new AppError(`Failed to fetch instructor stats: ${error.message}`, 500);
    }
  }

  static async getInstructorCourses(instructorId) {
    const result = await Course.aggregate([
      {
        $match: {
          $or: [
            { primaryInstructor: instructorId },
            { 'instructors.user': instructorId },
          ],
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          published: 1,
          publishedAt: 1,
        },
      },
      { $sort: { publishedAt: -1 } },
    ]);

    return result;
  }

  static async getInstructorEnrollments(instructorId) {
    const result = await Course.aggregate([
      {
        $match: {
          $or: [
            { primaryInstructor: instructorId },
            { 'instructors.user': instructorId },
          ],
        },
      },
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollments',
        },
      },
      {
        $project: {
          courseId: '$_id',
          courseTitle: '$title',
          enrollmentCount: { $size: '$enrollments' },
        },
      },
      { $sort: { enrollmentCount: -1 } },
    ]);

    const totalEnrollments = result.reduce((sum, course) => sum + course.enrollmentCount, 0);

    return {
      courses: result,
      totalEnrollments,
    };
  }

  static async getInstructorCertificates(instructorId) {
    const result = await Certificate.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo',
        },
      },
      { $unwind: '$courseInfo' },
      {
        $match: {
          'courseInfo.primaryInstructor': instructorId,
        },
      },
      {
        $facet: {
          total: [{ $count: 'count' }],
          thisMonth: [
            {
              $match: {
                issuedAt: {
                  $gte: new Date(new Date().setDate(1)),
                },
              },
            },
            { $count: 'count' },
          ],
          byCourse: [
            {
              $group: {
                _id: '$courseInfo.title',
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]);

    return {
      totalCertificates: result[0].total[0]?.count || 0,
      certificatesThisMonth: result[0].thisMonth[0]?.count || 0,
      byCourse: result[0].byCourse || [],
    };
  }

  static async getInstructorBlogStats(instructorId) {
    const result = await Blog.aggregate([
      {
        $match: { author: instructorId },
      },
      {
        $facet: {
          totalBlogs: [{ $count: 'count' }],
          publishedBlogs: [
            { $match: { published: true } },
            { $count: 'count' },
          ],
          totalLikes: [
            {
              $group: {
                _id: null,
                likes: { $sum: '$likes' },
              },
            },
          ],
          totalComments: [
            {
              $group: {
                _id: null,
                comments: { $sum: '$commentCount' },
              },
            },
          ],
        },
      },
    ]);

    return {
      totalBlogs: result[0].totalBlogs[0]?.count || 0,
      publishedBlogs: result[0].publishedBlogs[0]?.count || 0,
      totalLikes: result[0].totalLikes[0]?.likes || 0,
      totalComments: result[0].totalComments[0]?.comments || 0,
    };
  }

  // ===== STUDENT DASHBOARD =====

  static async getStudentStats(userId) {
    try {
      const uid = toObjectId(userId);
      const [
        enrollmentStats,
        progressStats,
        certificateStats,
        recommendedCourses,
        recentActivity,
      ] = await Promise.all([
        this.getStudentEnrollments(uid),
        this.getStudentProgress(uid),
        this.getStudentCertificates(uid),
        this.getRecommendedCourses(uid),
        this.getStudentRecentActivity(uid),
      ]);

      return {
        enrollments: enrollmentStats,
        progress: progressStats,
        certificates: certificateStats,
        recommendedCourses,
        recentActivity,
      };
    } catch (error) {
      throw new AppError(`Failed to fetch student stats: ${error.message}`, 500);
    }
  }

  static async getStudentEnrollments(userId) {
    const result = await Enrollment.aggregate([
      {
        $match: { user: userId },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo',
        },
      },
      { $unwind: '$courseInfo' },
      {
        $project: {
          _id: 1,
          courseId: '$course',
          courseTitle: '$courseInfo.title',
          courseSlug: '$courseInfo.slug',
          coverImage: {
            $ifNull: ['$courseInfo.coverUrl', '$courseInfo.thumbnailUrl'],
          },
          status: 1,
          enrolledAt: 1,
          completedAt: 1,
        },
      },
      { $sort: { enrolledAt: -1 } },
    ]);

    return result;
  }

  static async getStudentProgress(userId) {
    const result = await Progress.aggregate([
      {
        $match: { user: userId },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo',
        },
      },
      { $unwind: '$courseInfo' },
      {
        $project: {
          courseId: '$course',
          courseTitle: '$courseInfo.title',
          percentComplete: 1,
          lessonsCompleted: 1,
          totalLessons: 1,
        },
      },
      { $sort: { percentComplete: -1 } },
    ]);

    return result;
  }

  static async getStudentCertificates(userId) {
    const result = await Certificate.aggregate([
      {
        $match: { user: userId },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo',
        },
      },
      { $unwind: '$courseInfo' },
      {
        $project: {
          _id: 1,
          certificateId: 1,
          courseTitle: '$courseInfo.title',
          issuedAt: 1,
          verificationHash: 1,
        },
      },
      { $sort: { issuedAt: -1 } },
    ]);

    return result;
  }

  static async getRecommendedCourses(userId) {
    // Get user's enrolled courses
    const enrolledCourseIds = await Enrollment.find({ user: userId }).distinct('course');

    // Get published courses not enrolled in
    const result = await Course.aggregate([
      {
        $match: {
          _id: { $nin: enrolledCourseIds },
          published: true,
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          shortDescription: 1,
          level: 1,
          categories: 1,
          duration: 1,
          coverUrl: 1,
          thumbnailUrl: 1,
          coverImage: { $ifNull: ['$coverUrl', '$thumbnailUrl'] },
          contentType: { $ifNull: ['$meta.contentType', 'course'] },
          hoursPerWeek: { $ifNull: ['$meta.hoursPerWeek', null] },
          durationWeeks: { $ifNull: ['$meta.durationWeeks', null] },
        },
      },
      { $limit: 8 },
    ]);

    return result;
  }

  static async getStudentRecentActivity(userId) {
    const result = await Progress.aggregate([
      {
        $match: { user: userId },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo',
        },
      },
      { $unwind: '$courseInfo' },
      {
        $lookup: {
          from: 'lessons',
          localField: 'completedLessons',
          foreignField: '_id',
          as: 'lessons',
        },
      },
      {
        $project: {
          courseTitle: '$courseInfo.title',
          courseSlug: '$courseInfo.slug',
          recentlyCompleted: { $slice: ['$lessons', 5] },
          updatedAt: 1,
        },
      },
      { $sort: { updatedAt: -1 } },
      { $limit: 10 },
    ]);

    return result;
  }
}

export default DashboardService;
