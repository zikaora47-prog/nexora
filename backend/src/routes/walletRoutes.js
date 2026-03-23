import express from "express";
import {
  getBalance,
  getTransactions,
  requestWithdrawal,
  getMyWithdrawals
} from "../controllers/walletController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/balance", auth, getBalance);
router.get("/transactions", auth, getTransactions);
router.post("/withdraw", auth, requestWithdrawal);
router.get("/withdrawals", auth, getMyWithdrawals);

export default router;
