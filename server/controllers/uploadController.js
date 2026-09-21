import cloudinary from "../config/cloudinary.js";

const validateImageSignature = (file) => {
  const bytes = file.buffer;

  const jpeg =
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;

  const png =
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(
      Buffer.from([
        137, 80, 78, 71,
        13, 10, 26, 10,
      ])
    );

  const webp =
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP";

  if (
    jpeg &&
    file.mimetype === "image/jpeg"
  ) {
    return true;
  }

  if (
    png &&
    file.mimetype === "image/png"
  ) {
    return true;
  }

  if (
    webp &&
    file.mimetype === "image/webp"
  ) {
    return true;
  }

  return false;
};

const uploadBufferToCloudinary = (
  buffer
) =>
  new Promise((resolve, reject) => {
    const stream =
      cloudinary.uploader.upload_stream(
        {
          folder: "mern-marketplace/products",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(result);
        }
      );

    stream.end(buffer);
  });

export const uploadImage = async (
  req,
  res,
  next
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    if (!validateImageSignature(req.file)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image contents",
      });
    }

    const result =
      await uploadBufferToCloudinary(
        req.file.buffer
      );

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error(
      "Cloudinary upload failed:",
      error
    );

    next(error);
  }
};