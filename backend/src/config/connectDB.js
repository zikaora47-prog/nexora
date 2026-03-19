import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // must be first

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI); // <-- NO extra options
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectDB;