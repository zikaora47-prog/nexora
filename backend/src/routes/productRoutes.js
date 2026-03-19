import express from "express";
import {
  createProduct,
  getVendorProducts,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getSingleProduct
} from "../controllers/productController.js";
import auth from "../middleware/auth.js";
import { requireCommitment } from "../middleware/commitment.js";

const router = express.Router();

// All routes that modify products (vendor only) need commitment check
router.post("/", auth, requireCommitment, createProduct);
router.get("/vendor", auth, requireCommitment, getVendorProducts);
router.put("/:id", auth, requireCommitment, updateProduct);
router.delete("/:id", auth, requireCommitment, deleteProduct);

// Public routes for browsing (no commitment needed)
router.get("/", getAllProducts);
router.get("/:id", getSingleProduct);

export default router;