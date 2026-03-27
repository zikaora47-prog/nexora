import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
      immutable: true
    },
    amount: {
      type: mongoose.Types.Decimal128, // safer than Number
      required: true,
      min: 0,
      immutable: true
    },
    source: {
      type: String,
      enum: ["commission", "withdrawal", "refund", "sale"],
      required: true,
      immutable: true
    },
    reference: {
      type: String,
      unique: true,
      required: true,
      immutable: true
    },
    metadata: {
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      description: String
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

// Indexes for fast queries
walletTransactionSchema.index({ userId: 1, status: 1 });
walletTransactionSchema.index({ reference: 1 }, { unique: true });

export default mongoose.model("WalletTransaction", walletTransactionSchema);
