import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// SECURITY: Never hardcode credentials. Use MONGO_URI env var.
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("FATAL: MONGO_URI environment variable is not set!");
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
