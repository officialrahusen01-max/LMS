import User from "../../models/User.js";
import Certificate from "../../models/Certificate.js";
import InstitutionUpdate from "../../models/InstitutionUpdate.js";
import AppError from "../../utils/AppError.js";

const MAX_LIMIT = 100;

class AdminApiService {
  static async listUsersByRole(role, query = {}) {
    if (role !== "instructor" && role !== "student") {
      throw new AppError("role must be instructor or student", 400);
    }
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const filter = { roles: role };

    if (role === "instructor" && query.instructorFilter === "active") {
      filter.status = "active";
      filter.approvedInstructor = true;
    } else if (role === "instructor" && query.instructorFilter === "inactive") {
      filter.$or = [
        { status: { $ne: "active" } },
        { approvedInstructor: { $ne: true } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(
          "fullName publicUsername email roles status approvedInstructor avatarUrl lastLoginAt createdAt bio"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  static async listCertificates(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      Certificate.find({})
        .populate("user", "fullName email publicUsername")
        .populate("course", "title slug")
        .sort({ issuedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Certificate.countDocuments({}),
    ]);

    const items = rows.map((c) => ({
      _id: c._id,
      certificateId: c.certificateId,
      issuedAt: c.issuedAt,
      verificationHash: c.verificationHash,
      user: c.user
        ? {
            fullName: c.user.fullName,
            email: c.user.email,
            publicUsername: c.user.publicUsername,
          }
        : null,
      course: c.course
        ? { title: c.course.title, slug: c.course.slug }
        : null,
    }));

    return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 };
  }

  // --- Institution updates (admin) ---

  static async createInstitutionUpdate(adminId, body) {
    const { title, content, targetAudience = "all", published = true } = body;
    if (!title || !content) throw new AppError("title and content required", 400);
    const doc = await InstitutionUpdate.create({
      title: String(title).trim(),
      content: String(content).trim(),
      targetAudience,
      published: Boolean(published),
      createdBy: adminId,
    });
    return doc.toObject();
  }

  static async listInstitutionUpdatesAdmin(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      InstitutionUpdate.find({})
        .populate("createdBy", "fullName email publicUsername")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InstitutionUpdate.countDocuments({}),
    ]);
    return { items: rows, total, page, limit, pages: Math.ceil(total / limit) || 1 };
  }

  static async updateInstitutionUpdate(id, body) {
    const allowed = ["title", "content", "targetAudience", "published"];
    const patch = {};
    for (const k of allowed) {
      if (body[k] !== undefined) patch[k] = body[k];
    }
    const doc = await InstitutionUpdate.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    }).lean();
    if (!doc) throw new AppError("Update not found", 404);
    return doc;
  }

  static async deleteInstitutionUpdate(id) {
    const r = await InstitutionUpdate.findByIdAndDelete(id);
    if (!r) throw new AppError("Update not found", 404);
    return true;
  }

  /** Logged-in user: published notices for their roles */
  static async listInstitutionUpdatesForUser(userRoles = []) {
    const roles = Array.isArray(userRoles) ? userRoles : [];
    const isStudent = roles.includes("student");
    const isInstructor = roles.includes("instructor");
    const isAdmin = roles.includes("admin");

    const audienceOr = [{ targetAudience: "all" }];
    if (isStudent || isAdmin) audienceOr.push({ targetAudience: "students" });
    if (isInstructor || isAdmin) audienceOr.push({ targetAudience: "instructors" });

    const items = await InstitutionUpdate.find({
      published: true,
      $or: audienceOr,
    })
      .select("title content targetAudience createdAt updatedAt")
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return items;
  }
}

export default AdminApiService;
