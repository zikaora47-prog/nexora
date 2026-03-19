import Order from "../models/Order.js";
import Product from "../models/Product.js";
import CreatorProduct from "../models/CreatorProduct.js";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import mongoose from "mongoose";

// Helper to generate unique order number
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}-${random}`;
};

// Helper to generate unique reference for wallet transaction
const generateReference = (prefix, userId) => {
  return `${prefix}_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Create a new order (buyer purchases)
export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, affiliateSlug, shippingInfo, paymentReference, amount } = req.body;
    const buyerId = req.user.id;

    // Fetch product with vendor
    const product = await Product.findById(productId).populate("vendorId");
    if (!product || !product.isActive) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Product not available" });
    }

    // Determine creator if affiliateSlug is provided
    let creatorId = null;
    if (affiliateSlug) {
      const creatorProduct = await CreatorProduct.findOne({ affiliateSlug }).populate("creatorId");
      if (creatorProduct) {
        creatorId = creatorProduct.creatorId._id;
      }
    }

    // Calculate commissions
    const platformPercent = 10; // fixed 10%
    const creatorPercent = creatorId ? product.commissionPercent : 0;
    
    const creatorAmount = (amount * creatorPercent) / 100;
    const platformAmount = (amount * platformPercent) / 100;
    const vendorAmount = amount - creatorAmount - platformAmount;

    // Create order with generated order number
    const order = new Order({
      orderNumber: generateOrderNumber(),
      buyerId,
      creatorId,
      vendorId: product.vendorId._id,
      productId,
      affiliateSlug,
      amount,
      commission: {
        creatorPercent,
        creatorAmount,
        platformPercent,
        platformAmount,
        vendorAmount
      },
      shippingInfo,
      paymentReference,
      status: "paid" // assume payment already confirmed
    });

    await order.save({ session });

    // Update wallets
    // 1. Credit creator's wallet (if any)
    if (creatorId && creatorAmount > 0) {
      await User.findByIdAndUpdate(
        creatorId,
        { $inc: { walletBalance: creatorAmount } },
        { session }
      );

      // Create transaction record for creator
      await WalletTransaction.create([{
        userId: creatorId,
        type: "credit",
        amount: creatorAmount,
        source: "commission",
        reference: generateReference("COMM", creatorId),
        metadata: {
          orderId: order._id,
          productId: product._id,
          description: `Commission from order ${order.orderNumber}`
        }
      }], { session });
    }

    // 2. Credit vendor's wallet
    if (vendorAmount > 0) {
      await User.findByIdAndUpdate(
        product.vendorId._id,
        { $inc: { walletBalance: vendorAmount } },
        { session }
      );

      await WalletTransaction.create([{
        userId: product.vendorId._id,
        type: "credit",
        amount: vendorAmount,
        source: "sale",
        reference: generateReference("SALE", product.vendorId._id),
        metadata: {
          orderId: order._id,
          productId: product._id,
          description: `Sale from order ${order.orderNumber}`
        }
      }], { session });
    }

    // 3. Platform fee – optionally track in admin wallet if needed
    // (omitted for now)

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Order created successfully",
      order
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

// Get orders for a specific user (role-based)
export const getMyOrders = async (req, res) => {
  try {
    const user = req.user;
    let filter = {};

    if (user.role === "buyer") {
      filter.buyerId = user.id;
    } else if (user.role === "creator") {
      filter.creatorId = user.id;
    } else if (user.role === "vendor") {
      filter.vendorId = user.id;
    } else if (user.role === "admin") {
      // admin can see all? maybe with pagination
    } else {
      return res.status(403).json({ message: "Not authorized" });
    }

    const orders = await Order.find(filter)
      .populate("buyerId", "username email")
      .populate("creatorId", "username email")
      .populate("vendorId", "username businessName")
      .populate("productId", "title price images")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update order status (vendor marks shipped, etc.)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only vendor of this product or admin can update status
    if (req.user.role !== "admin" && req.user.id !== order.vendorId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    order.status = status;
    await order.save();

    res.json({ message: "Order status updated", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};