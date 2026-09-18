import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
const [, , emailArg, passwordArg, ...nameParts] = process.argv;
const email = emailArg || process.env.ADMIN_EMAIL;
const password = passwordArg || process.env.ADMIN_PASSWORD;
const name = nameParts.join(" ") || process.env.ADMIN_NAME || "Admin";
if (!email || !password || password.length < 6) {
  console.error("Usage: npm run create-admin -- admin@example.com password123 Admin Name");
  process.exit(1);
}
await connectDB();
const hashed = await bcrypt.hash(password, 10);
const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { name, email: email.toLowerCase(), password: hashed, role: "admin", isBlocked: false }, { upsert: true, new: true, setDefaultsOnInsert: true });
console.log(`Admin ready: ${user.email}`);
await mongoose.disconnect();
