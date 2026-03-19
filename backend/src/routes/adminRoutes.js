import express from "express";
import {
  getAllWithdrawals,
  processWithdrawal
} from "../controllers/adminController.js";
import auth from "../middleware/auth.js";
import { requireAdmin } from "../middleware/roles.js"; // we need this middleware

const router = express.Router();

// All admin routes require auth + admin role
router.use(auth, requireAdmin);

router.get("/withdrawals", getAllWithdrawals);
router.put("/withdrawals/:id", processWithdrawal);

export default router;