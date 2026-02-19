import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Ensure env vars are loaded

// Use MONGO_URI env var, falling back to a default that uses JoinMeDB
const DEFAULT_URI = 'mongodb+srv://JoinMe:Uday2005*@cluster0.dfncc07.mongodb.net/JoinMeDB?retryWrites=true&w=majority';
const uri = process.env.MONGO_URI || DEFAULT_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully to:", uri.includes('JoinMeDB') ? 'JoinMeDB' : uri);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
