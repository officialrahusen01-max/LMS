import CertificateService from '../services/certificateService.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

/**
 * CertificateController
 * Handles certificate-related HTTP requests
 */
class CertificateController {
  /**
   * GET /api/v1/certificates/me
   * Get all certificates for current student
   */
  static myCertificates = catchAsync(async (req, res) => {
    const userId = req.user.id;

    const certificates = await CertificateService.getMyCertificates(userId);

    res.status(200).json({
      message: 'Certificates retrieved',
      data: certificates,
      count: certificates.length
    });
  });

  /**
   * GET /api/v1/certificates/:certificateId
   * Get specific certificate
   */
  static getCertificate = catchAsync(async (req, res) => {
    const { certificateId } = req.params;
    const userId = req.user.id;

    if (!certificateId) {
      throw new AppError('Certificate ID required', 400);
    }

    const certificate = await CertificateService.getCertificate(certificateId, userId);

    res.status(200).json({
      message: 'Certificate retrieved',
      data: certificate
    });
  });

  /**
   * GET /api/v1/certificates/verify/:hash
   * Verify certificate by hash (public endpoint - no auth required)
   */
  static verifyCertificate = catchAsync(async (req, res) => {
    const { hash } = req.params;

    if (!hash) {
      throw new AppError('Verification hash required', 400);
    }

    const certificate = await CertificateService.verifyCertificateByHash(hash);

    res.status(200).json({
      message: 'Certificate verified',
      data: {
        certificateId: certificate.certificateId,
        studentName: certificate.user.fullName,
        course: certificate.course.title,
        issuedAt: certificate.issuedAt,
        enrolledAt: certificate.enrollment?.enrolledAt,
        valid: true
      }
    });
  });
}

export default CertificateController;
