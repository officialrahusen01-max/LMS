import express from "express";
import { authenticate } from "../../middleware/auth.js";
import * as adminApi from "../controllers/adminApiController.js";

const router = express.Router();

router.get("/users", authenticate, adminApi.listAdminUsers);
router.get("/certificates", authenticate, adminApi.listAdminCertificates);
router.get("/institution-updates", authenticate, adminApi.listAdminInstitutionUpdates);
router.post("/institution-updates", authenticate, adminApi.createAdminInstitutionUpdate);
router.patch("/institution-updates/:id", authenticate, adminApi.patchAdminInstitutionUpdate);
router.delete("/institution-updates/:id", authenticate, adminApi.deleteAdminInstitutionUpdate);

export default router;
