import "dotenv/config";
import mongoose from "mongoose";

import cloudinary from "../config/cloudinary.js";
import Product from "../models/Product.js";

const isCloudinaryUrl = (url) =>
  typeof url === "string" &&
  url.includes("res.cloudinary.com");

const migrateImages = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI is not configured"
      );
    }

    await mongoose.connect(mongoUri);

    console.log("MongoDB connected");

    const products = await Product.find({
      images: {
        $exists: true,
        $ne: [],
      },
    });

    console.log(
      `Found ${products.length} products with images`
    );

    let migratedProducts = 0;
    let migratedImages = 0;
    let skippedImages = 0;
    let failedImages = 0;

    for (const product of products) {
      let changed = false;

      const nextImages = [];

      console.log("");
      console.log(
        `Processing: ${product.name}`
      );

      for (const imageUrl of product.images) {
        if (!imageUrl) {
          continue;
        }

        if (isCloudinaryUrl(imageUrl)) {
          console.log(
            "  ✓ Already Cloudinary"
          );

          nextImages.push(imageUrl);
          skippedImages++;
          continue;
        }

        try {
          console.log(
            "  Uploading external image..."
          );

          const result =
            await cloudinary.uploader.upload(
              imageUrl,
              {
                folder:
                  "mern-marketplace/products",
                resource_type: "image",

                transformation: [
                  {
                    width: 1200,
                    height: 1200,
                    crop: "limit",
                    quality: "auto",
                    fetch_format: "auto",
                  },
                ],
              }
            );

          nextImages.push(
            result.secure_url
          );

          migratedImages++;
          changed = true;

          console.log(
            "  ✓ Migrated to Cloudinary"
          );
        } catch (error) {
          failedImages++;

          console.error(
            `  ✗ Upload failed: ${error.message}`
          );

          /*
           * Preserve original URL if migration
           * fails so the product never loses
           * its existing image.
           */
          nextImages.push(imageUrl);
        }
      }

      if (changed) {
        product.images = nextImages;

        await product.save();

        migratedProducts++;

        console.log(
          "  ✓ Product updated in MongoDB"
        );
      }
    }

    console.log("");
    console.log(
      "=============================="
    );

    console.log(
      `Products migrated: ${migratedProducts}`
    );

    console.log(
      `Images migrated:   ${migratedImages}`
    );

    console.log(
      `Already Cloudinary: ${skippedImages}`
    );

    console.log(
      `Failed:            ${failedImages}`
    );

    console.log(
      "=============================="
    );

    console.log(
      "✅ Product image migration complete"
    );
  } catch (error) {
    console.error(
      "Migration failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

migrateImages();