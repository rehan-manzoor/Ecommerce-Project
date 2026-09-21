import mongoose from "mongoose";

export const errorHandler = (err, _req, res, _next) => {
  if (process.env.NODE_ENV !== "test") {
    console.error(err);
  }

  let status = Number(err.statusCode) || 500;
  let message = err.publicMessage || "Server error";
  let errors = [];

  if (err.code === 11000) {
    status = 409;
    message = "Duplicate value";
    errors = Object.keys(err.keyPattern || {});
  } else if (err instanceof mongoose.Error.CastError || err.name === "CastError") {
    status = 400;
    message = "Invalid identifier";
  } else if (err.name === "ValidationError") {
    status = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((item) => item.message);
  } else if (
    ["LIMIT_FILE_SIZE", "LIMIT_UNEXPECTED_FILE"].includes(err.code) ||
    /Only JPEG|Only PNG|Invalid image/.test(String(err.message || ""))
  ) {
    status = 400;
    message = "Invalid image upload";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON";
  }

  res.status(status).json({
    success: false,
    message,
    errors,
  });
};
