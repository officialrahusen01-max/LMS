import Certificate from '../models/Certificate.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import AppError from '../utils/AppError.js';
import crypto from 'crypto';

/**
 * CertificateService
 * Manages certificate generation and verification
 */
class CertificateService {
  /**
   * Generate certificate for completed course
   * @param {string} userId - Student user ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Certificate document
   */
  static async generateCertificate(userId, courseId) {
    // Verify progress is 100%
    const progress = await Progress.findOne({
      user: userId,
      course: courseId
    });

    if (!progress) {
      throw new AppError('Progress not found', 404);
    }

    if (progress.percentComplete !== 100) {
      throw new AppError('Course not completed (less than 100%)', 400);
    }

    // Verify enrollment is completed
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    if (enrollment.status !== 'completed') {
      throw new AppError('Enrollment not in completed status', 400);
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      user: userId,
      course: courseId
    });

    if (existingCertificate) {
      return existingCertificate;
    }

    // Generate unique certificate ID
    const certificateId = this.generateCertificateId();

    // Generate verification hash
    const verificationHash = this.generateVerificationHash();

    // Create certificate
    const certificate = await Certificate.create({
      user: userId,
      course: courseId,
      enrollment: enrollment._id,
      certificateId,
      verificationHash
    });

    // Update progress with issuance timestamp
    progress.certificateIssuedAt = new Date();
    await progress.save();

    // Populate before return
    await certificate.populate('user', 'fullName email');
    await certificate.populate('course', 'title');

    return certificate;
  }

  /**
   * Verify certificate by hash (public endpoint)
   * @param {string} hash - Verification hash
   * @returns {Promise<Object>} Certificate data with user and course
   */
  static async verifyCertificateByHash(hash) {
    const certificate = await Certificate.findOne({
      verificationHash: hash
    })
      .populate('user', 'fullName email')
      .populate('course', 'title category')
      .populate('enrollment', 'enrolledAt status');

    if (!certificate) {
      throw new AppError('Certificate not found', 404);
    }

    return certificate;
  }

  /**
   * Get all certificates for a student
   * @param {string} userId - Student user ID
   * @returns {Promise<Array>} Array of certificate documents
   */
  static async getMyCertificates(userId) {
    const certificates = await Certificate.find({ user: userId })
      .populate('course', 'title category')
      .populate('enrollment', 'enrolledAt')
      .sort({ issuedAt: -1 });

    return certificates;
  }

  /**
   * Get certificate by ID
   * @param {string} certificateId - Certificate database ID
   * @param {string} userId - Student user ID (for ownership check)
   * @returns {Promise<Object>} Certificate document
   */
  static async getCertificate(certificateId, userId) {
    const certificate = await Certificate.findOne({
      _id: certificateId,
      user: userId
    })
      .populate('user', 'fullName email')
      .populate('course', 'title category description')
      .populate('enrollment', 'enrolledAt status');

    if (!certificate) {
      throw new AppError('Certificate not found', 404);
    }

    return certificate;
  }

  /**
   * Generate unique certificate ID
   * Format: LMS-YYYY-XXXXX
   * @returns {string} Certificate ID
   */
  static generateCertificateId() {
    const year = new Date().getFullYear();
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();
    return `LMS-${year}-${randomPart}`;
  }

  /**
   * Generate verification hash (crypto random)
   * @returns {string} Verification hash
   */
  static generateVerificationHash() {
    return crypto.randomBytes(32).toString('hex');
  }
}

export default CertificateService;
