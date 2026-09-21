import cloudinary from "../config/cloudinary.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

const PRODUCT_FOLDER = "mern-marketplace/products";

export const getCloudinaryPublicId = (url) => {
  try {
    if (
      typeof url !== "string" ||
      !url.includes("res.cloudinary.com")
    ) {
      return null;
    }

    const parsed = new URL(url);

    const uploadMarker = "/upload/";
    const uploadIndex = parsed.pathname.indexOf(uploadMarker);

    if (uploadIndex === -1) {
      return null;
    }

    let path = parsed.pathname.slice(
      uploadIndex + uploadMarker.length
    );

    // Remove Cloudinary transformation/version part like:
    // v123456789/
    path = path.replace(/^v\d+\//, "");

    // Remove file extension.
    path = path.replace(/\.[^/.]+$/, "");

    if (!path.startsWith(`${PRODUCT_FOLDER}/`)) {
      return null;
    }

    return path;
  } catch {
    return null;
  }
};

export const deleteUnusedProductImage = async (
  imageUrl,
  currentProductId = null
) => {
  try {
    const publicId = getCloudinaryPublicId(imageUrl);

    if (!publicId) {
      return false;
    }

    const productFilter = {
      images: imageUrl,
    };

    if (currentProductId) {
      productFilter._id = {
        $ne: currentProductId,
      };
    }

    const [usedByAnotherProduct, usedByOrder] =
      await Promise.all([
        Product.exists(productFilter),

        Order.exists({
          "items.image": imageUrl,
        }),
      ]);

    if (
      usedByAnotherProduct ||
      usedByOrder
    ) {
      return false;
    }

    const result =
      await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });

    return ["ok", "not found"].includes(
      result.result
    );
  } catch (error) {
    /*
     * Image cleanup should never make a successful
     * product update fail.
     */
    console.error(
      "Cloudinary image cleanup failed:",
      error.message
    );

    return false;
  }
};

export const cleanupRemovedProductImages = async ({
  previousImages = [],
  nextImages = [],
  productId = null,
}) => {
  const nextSet = new Set(nextImages);

  const removedImages =
    previousImages.filter(
      (url) => !nextSet.has(url)
    );

  if (!removedImages.length) {
    return;
  }

  await Promise.allSettled(
    removedImages.map((url) =>
      deleteUnusedProductImage(
        url,
        productId
      )
    )
  );
};