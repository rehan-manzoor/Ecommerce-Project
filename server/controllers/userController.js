import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import { registerSchema, loginSchema } from "../validators/userValidator.js";
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "../services/notificationService.js";

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar || "",
  addresses: user.addresses || [],
});
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/users", maxAge: 7 * 86400000 };
const issueTokens = async (user, res) => {
  const token = jwt.sign({ userId: user._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" });
  const refresh = crypto.randomBytes(48).toString("hex");
  user.refreshTokenHash = crypto.createHash("sha256").update(refresh).digest("hex");
  user.refreshTokenExpires = new Date(Date.now() + cookieOptions.maxAge);
  await user.save();
  res.cookie("refreshToken", refresh, cookieOptions);
  return token;
};

export const createUser = async (req, res, next) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: "Invalid input", data: null, error: result.error.flatten() });
    }

    const { name, email, password } = result.data;
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: "Email already exists", data: null, error: null });
    }

    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
   await sendWelcomeEmail(user);
    res.status(201).json({ success: true, message: "User registered successfully", data: publicUser(user), error: null });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: "Invalid input", data: null, error: result.error.flatten() });
    }

    const user = await User.findOne({ email: result.data.email });
    if (!user || !(await bcrypt.compare(result.data.password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password", data: null, error: null });
    }
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "Your account has been blocked", data: null, error: null });
    }

    const token = await issueTokens(user, res);

    res.json({ success: true, message: "Login successful", data: { token, user: publicUser(user) }, error: null });
  } catch (error) {
    next(error);
  }
};


export const refreshLogin = async (req, res, next) => {
  try {
    const refresh = req.cookies?.refreshToken;

    if (!refresh) {
      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    const hash = crypto
      .createHash("sha256")
      .update(refresh)
      .digest("hex");

    const user = await User.findOne({
      refreshTokenHash: hash,
      refreshTokenExpires: { $gt: new Date() },
    }).select("+refreshTokenHash +refreshTokenExpires");

    if (!user || user.isBlocked) {
      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    const token = await issueTokens(user, res);

    return res.json({
      success: true,
      data: {
        token,
        user: publicUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};



export const logoutUser = async (req, res, next) => {
  try {
    const refresh = req.cookies?.refreshToken;

    if (refresh) {
      await User.updateOne(
        {
          refreshTokenHash: crypto
            .createHash("sha256")
            .update(refresh)
            .digest("hex"),
        },
        {
          $set: {
            refreshTokenHash: null,
            refreshTokenExpires: null,
          },
        }
      );
    }

    res.clearCookie("refreshToken", cookieOptions);

    res.json({
      success: true,
      message: "Logged out",
    });
  } catch (error) {
    next(error);
  }
};



export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("-password -resetPasswordToken -resetPasswordExpires");
    if (!user) return res.status(404).json({ success: false, message: "User not found", data: null, error: null });
    res.json({ success: true, message: "Profile fetched", data: user, error: null });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const updates = {};

    if (typeof req.body.name === "string" && req.body.name.trim()) {
      updates.name = req.body.name.trim();
    }

    if (typeof req.body.avatar === "string") {
      updates.avatar = req.body.avatar.trim();
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
        error: null,
      });
    }

    res.json({
      success: true,
      message: "Profile updated",
      data: user,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const { label = "Home", address, city, state = "", postalCode, country, isDefault = false } = req.body;
    if (!address || !city || !postalCode || !country) {
      return res.status(400).json({ success: false, message: "Address, city, postal code and country are required", data: null, error: null });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
  return res.status(404).json({
    success: false,
    message: "User not found",
    data: null,
    error: null,
  });
}
    if (isDefault) user.addresses.forEach((item) => { item.isDefault = false; });
    user.addresses.push({ label, address, city, state, postalCode, country, isDefault: isDefault || user.addresses.length === 0 });
    await user.save();
    res.status(201).json({ success: true, message: "Address added", data: user.addresses, error: null });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
  return res.status(404).json({
    success: false,
    message: "User not found",
    data: null,
    error: null,
  });
}
    user.addresses = user.addresses.filter((item) => item._id.toString() !== req.params.id);
    if (user.addresses.length && !user.addresses.some((item) => item.isDefault)) user.addresses[0].isDefault = true;
    await user.save();
    res.json({ success: true, message: "Address removed", data: user.addresses, error: null });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: String(req.body.email || "").toLowerCase() });
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
      user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;
      await user.save();
      await sendPasswordResetEmail(user, token);
    }
    res.json({ success: true, message: "If the email exists, a reset link has been generated. In local development check the server console.", data: null, error: null });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const password = String(req.body.password || "");
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters", data: null, error: null });
    const tokenHash = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({ resetPasswordToken: tokenHash, resetPasswordExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success: false, message: "Reset token is invalid or expired", data: null, error: null });
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshTokenHash = null;
    user.refreshTokenExpires = null;
    await user.save();
    res.json({ success: true, message: "Password reset successfully", data: null, error: null });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const filter = req.query.role ? { role: req.query.role } : {};
    const totalResults = await User.countDocuments(filter);
    const users = await User.find(filter).select("-password -resetPasswordToken -resetPasswordExpires").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    res.json({ success: true, message: "Users fetched", data: users, pagination: { page, limit, totalPages: Math.ceil(totalResults / limit), totalResults }, error: null });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const role = req.body.role;
    if (!["customer", "vendor", "admin"].includes(role)) return res.status(400).json({ success: false, message: "Invalid role", data: null, error: null });
    if (role === "vendor" && !await Vendor.exists({ user: req.params.id, status: "approved" })) return res.status(400).json({ success: false, message: "Approve the seller application before assigning vendor role" });
    if (req.params.id === req.user.userId && role !== "admin") return res.status(400).json({ success: false, message: "You cannot remove your own admin access" });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found", data: null, error: null });
    res.json({ success: true, message: "User role updated", data: user, error: null });
  } catch (error) {
    next(error);
  }
};

export const toggleUserBlock = async (req, res, next) => {
  try {
    if (req.params.id === req.user.userId && req.body.isBlocked) return res.status(400).json({ success: false, message: "You cannot block your own account" });
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: Boolean(req.body.isBlocked) }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found", data: null, error: null });
    res.json({ success: true, message: user.isBlocked ? "User blocked" : "User unblocked", data: user, error: null });
  } catch (error) {
    next(error);
  }
};
