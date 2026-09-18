import { validate } from "../middleware/validate.js";
import { productSchema } from "../validators/marketplaceValidator.js";import express from "express";
import {
  createProduct, getProducts, getProductById, getMyProducts, updateProduct, deleteProduct,
  getProductsForAdmin, moderateProduct,
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
const router = express.Router();
router.get("/", getProducts);
router.get("/vendor/my", protect, authorize("vendor"), getMyProducts);
router.get("/admin/all", protect, authorize("admin"), getProductsForAdmin);
router.post("/", protect, authorize("vendor"), validate(productSchema), createProduct);
router.put("/:id/moderate", protect, authorize("admin"), moderateProduct);
router.put("/:id/approve", protect, authorize("admin"), moderateProduct);
router.put("/:id", protect, authorize("vendor"), validate(productSchema.partial()), updateProduct);
router.delete("/:id", protect, authorize("vendor"), deleteProduct);
router.get("/:id", getProductById);
export default router;
