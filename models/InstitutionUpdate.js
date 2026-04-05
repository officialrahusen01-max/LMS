import mongoose from "mongoose";

const institutionUpdateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 20000 },
    /** Who should see this in the LMS */
    targetAudience: {
      type: String,
      enum: ["all", "students", "instructors"],
      default: "all",
    },
    published: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

institutionUpdateSchema.index({ published: 1, createdAt: -1 });

export default mongoose.model("InstitutionUpdate", institutionUpdateSchema);
