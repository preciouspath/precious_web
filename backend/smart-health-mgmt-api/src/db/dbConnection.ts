import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const baseUri = process.env.MONGO_URI || '';

export const connection = async () => {
  try {
    await mongoose.connect(baseUri || "");
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error", error);
  }
};




