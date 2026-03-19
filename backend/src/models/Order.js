import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    affiliateSlug: {
      type: String,
      ref: "CreatorProduct"
    },
    amount: {
      type: Number,
      required: true
    },
    commission: {
      creatorPercent: Number,
      creatorAmount: Number,
      platformPercent: { type: Number, default: 10 },
      platformAmount: Number,
      vendorAmount: Number
    },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
      default: "pending"
    },
    shippingInfo: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      zipCode: { type: String }
    },
    paymentReference: { type: String } // from Paystack or other gateway
  },
  { timestamps: true }
);

// Generate unique order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${year}${month}-${random}`;
  }
  next();
});

export default mongoose.model("Order", orderSchema);