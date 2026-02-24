import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import CertificateController from '../controllers/certificateController.js';

const router = express.Router();

/**
 * GET /api/v1/certificates/me
 * Get all certificates for current student
 * Auth: Required (student role)
 */
router.get('/me', authenticate, authorize(['student']), CertificateController.myCertificates);

/**
 * GET /api/v1/certificates/:certificateId
 * Get specific certificate
 * Auth: Required (student role, ownership check)
 */
router.get(
  '/:certificateId',
  authenticate,
  authorize(['student']),
  CertificateController.getCertificate
);

/**
 * GET /api/v1/certificates/verify/:hash
 * Verify certificate by hash (public endpoint)
 * Auth: Not required (public verification)
 */
router.get('/verify/:hash', CertificateController.verifyCertificate);

export default router;
