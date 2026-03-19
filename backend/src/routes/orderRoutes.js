import express from "express";
import {
  createOrder,
  getMyOrders,
  updateOrderStatus
} from "../controllers/orderController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// All order routes require authentication
router.post("/", auth, createOrder);               // create an order (buyer)
router.get("/", auth, getMyOrders);                 // get user's orders
router.patch("/:id/status", auth, updateOrderStatus); // update status (vendor/admin)

export default router;