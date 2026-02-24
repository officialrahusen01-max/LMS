import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.warn("⚠️ Running in offline mode - database not available");
    // For testing purposes, allow app to start without database
    // In production, this should not be used
  }
};


export default connectDB;

