import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";
import AdminApiService from "../services/adminApiService.js";

function requireAdmin(req) {
  const roles = req.user?.roles || [];
  if (!roles.includes("admin")) throw new AppError("Admin only", 403);
}

export const listAdminUsers = catchAsync(async (req, res) => {
  requireAdmin(req);
  const role = req.query.role;
  if (!role || !["instructor", "student"].includes(String(role))) {
    throw new AppError('Query "role" must be instructor or student', 400);
  }
  const result = await AdminApiService.listUsersByRole(role, req.query);
  res.json({ status: true, message: "OK", data: result });
});

export const listAdminCertificates = catchAsync(async (req, res) => {
  requireAdmin(req);
  const result = await AdminApiService.listCertificates(req.query);
  res.json({ status: true, message: "OK", data: result });
});

export const listAdminInstitutionUpdates = catchAsync(async (req, res) => {
  requireAdmin(req);
  const result = await AdminApiService.listInstitutionUpdatesAdmin(req.query);
  res.json({ status: true, message: "OK", data: result });
});

export const createAdminInstitutionUpdate = catchAsync(async (req, res) => {
  requireAdmin(req);
  const doc = await AdminApiService.createInstitutionUpdate(req.user.id, req.body);
  res.status(201).json({ status: true, message: "Created", data: doc });
});

export const patchAdminInstitutionUpdate = catchAsync(async (req, res) => {
  requireAdmin(req);
  const doc = await AdminApiService.updateInstitutionUpdate(req.params.id, req.body);
  res.json({ status: true, message: "Updated", data: doc });
});

export const deleteAdminInstitutionUpdate = catchAsync(async (req, res) => {
  requireAdmin(req);
  await AdminApiService.deleteInstitutionUpdate(req.params.id);
  res.json({ status: true, message: "Deleted" });
});

export const listMyInstitutionUpdates = catchAsync(async (req, res) => {
  if (!req.user?.roles) throw new AppError("Unauthorized", 401);
  const items = await AdminApiService.listInstitutionUpdatesForUser(req.user.roles);
  res.json({ status: true, message: "OK", data: { items } });
});
