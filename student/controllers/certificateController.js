import CertificateService from '../services/certificateService.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';

class CertificateController {
  static myCertificates = catchAsync(async (req, res) => {
    const certificates = await CertificateService.getMyCertificates(req.user.id);
    res.status(200).json({
      message: 'Certificates retrieved',
      data: certificates,
      count: certificates.length
    });
  });

  static getCertificate = catchAsync(async (req, res) => {
    const { certificateId } = req.params;
    const userId = req.user.id;
    if (!certificateId) throw new AppError('Certificate ID required', 400);
    const certificate = await CertificateService.getCertificate(certificateId, userId);
    res.status(200).json({
      message: 'Certificate retrieved',
      data: certificate
    });
  });

  static verifyCertificate = catchAsync(async (req, res) => {
    const { hash } = req.params;
    if (!hash) throw new AppError('Verification hash required', 400);
    const certificate = await CertificateService.verifyCertificateByHash(hash);
    res.status(200).json({
      message: 'Certificate verified',
      data: {
        certificateId: certificate.certificateId,
        studentName: certificate.user.fullName,
        course: certificate.course.title,
        issuedAt: certificate.issuedAt,
        /** Course access / start (enrollment) — use with issuedAt for “kab se kab tak” */
        enrolledAt: certificate.enrollment?.enrolledAt ?? null,
        courseDurationStart: certificate.enrollment?.enrolledAt ?? null,
        courseDurationEnd: certificate.issuedAt,
        valid: true
      }
    });
  });
}

export default CertificateController;
