import express from "express";
import { register, login, forgotPassword, resetPassword } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);      // public
router.post("/reset-password/:token", resetPassword); // public

export default router;