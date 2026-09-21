import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required", data: null, error: null });
    }

    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId).select("_id email role isBlocked");

    if (!user || user.isBlocked) {
      return res
        .status(401)
        .json({ success: false, message: "Account is unavailable", data: null, error: null });
    }

    req.user = { userId: user._id.toString(), role: user.role, email: user.email };
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token", data: null, error: null });
  }
};
