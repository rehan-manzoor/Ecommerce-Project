import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect((process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mern_ecommerce"));

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;