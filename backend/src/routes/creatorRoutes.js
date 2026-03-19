import express from "express";
import {
  selectProduct,
  getCreatorProducts,
  removeCreatorProduct
} from "../controllers/creatorController.js";
import auth from "../middleware/auth.js";
import { requireCommitment } from "../middleware/commitment.js";

const router = express.Router();

// All creator actions need commitment check
router.post("/select", auth, requireCommitment, selectProduct);
router.get("/products", auth, requireCommitment, getCreatorProducts);
router.delete("/products/:id", auth, requireCommitment, removeCreatorProduct);

export default router;