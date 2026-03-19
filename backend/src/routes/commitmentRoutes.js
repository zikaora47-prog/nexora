import express from "express";
import {
  initializeCommitmentPayment,
  verifyCommitmentPayment,
  paystackWebhook
} from "../controllers/commitmentController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Protected routes (user must be logged in)
router.post("/initialize", auth, initializeCommitmentPayment);
router.get("/verify/:reference", auth, verifyCommitmentPayment);

// Public webhook (Paystack calls this)
router.post("/webhook", express.raw({ type: 'application/json' }), paystackWebhook);

export default router;