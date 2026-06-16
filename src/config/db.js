import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

 export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    
    // Log masked URI for debugging
    const maskedUri = uri.replace(/\/\/.*@/, "//****:****@");
    console.log(`Attempting to connect to: ${maskedUri}`);

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

// module.exports = connectDB;