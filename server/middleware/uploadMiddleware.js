import multer from "multer";
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) =>
    callback(
      allowed.has(file.mimetype) && /\.(jpg|jpeg|png|webp)$/i.test(file.originalname)
        ? null
        : new Error("Only JPEG, PNG or WebP images are allowed"),
      allowed.has(file.mimetype) && /\.(jpg|jpeg|png|webp)$/i.test(file.originalname)
    ),
});
