import mongoose from "mongoose";

let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoUri =
    process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mern_ecommerce";

  connectionPromise = mongoose
    .connect(mongoUri, {
      maxIdleTimeMS: 60000,
    })
    .then((mongooseInstance) => {
      console.log("MongoDB connected successfully");
      return mongooseInstance.connection;
    })
    .catch((error) => {
      connectionPromise = null;

      console.error("MongoDB connection failed:", error.message);

      throw error;
    });

  return connectionPromise;
};

export default connectDB;
