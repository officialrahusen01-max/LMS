import Certificate from '../../models/Certificate.js';
import Enrollment from '../../models/Enrollment.js';
import Progress from '../../models/Progress.js';
import AppError from '../../utils/AppError.js';
import crypto from 'crypto';

class CertificateService {
  static async generateCertificate(userId, courseId) {
    const progress = await Progress.findOne({ user: userId, course: courseId });
    if (!progress) throw new AppError('Progress not found', 404);
    if (progress.percentComplete !== 100) throw new AppError('Course not completed (less than 100%)', 400);
    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (!enrollment) throw new AppError('Enrollment not found', 404);
    if (enrollment.status !== 'completed') throw new AppError('Enrollment not in completed status', 400);
    const existingCertificate = await Certificate.findOne({ user: userId, course: courseId });
    if (existingCertificate) return existingCertificate;
    const certificateId = this.generateCertificateId();
    const verificationHash = this.generateVerificationHash();
    const certificate = await Certificate.create({
      user: userId,
      course: courseId,
      enrollment: enrollment._id,
      certificateId,
      verificationHash
    });
    progress.certificateIssuedAt = new Date();
    await progress.save();
    await certificate.populate('user', 'fullName email');
    await certificate.populate('course', 'title');
    return certificate;
  }

  static async verifyCertificateByHash(hash) {
    const certificate = await Certificate.findOne({ verificationHash: hash })
      .populate('user', 'fullName email')
      .populate('course', 'title category')
      .populate('enrollment', 'enrolledAt status');
    if (!certificate) throw new AppError('Certificate not found', 404);
    return certificate;
  }

  static async getMyCertificates(userId) {
    return Certificate.find({ user: userId })
      .populate('course', 'title category')
      .populate('enrollment', 'enrolledAt')
      .sort({ issuedAt: -1 });
  }

  static async getCertificate(certificateId, userId) {
    const certificate = await Certificate.findOne({ _id: certificateId, user: userId })
      .populate('user', 'fullName email')
      .populate('course', 'title category description')
      .populate('enrollment', 'enrolledAt status');
    if (!certificate) throw new AppError('Certificate not found', 404);
    return certificate;
  }

  static generateCertificateId() {
    const year = new Date().getFullYear();
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `LMS-${year}-${randomPart}`;
  }

  static generateVerificationHash() {
    return crypto.randomBytes(32).toString('hex');
  }
}

export default CertificateService;
