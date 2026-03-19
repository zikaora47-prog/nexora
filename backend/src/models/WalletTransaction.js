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
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    source: {
      type: String,
      enum: ["commission", "withdrawal", "refund", "sale"],
      required: true
    },
    reference: {
      type: String,
      unique: true,
      required: true
    },
    metadata: {
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      description: String
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed"
    }
  },
  { timestamps: true }
);

export default mongoose.model("WalletTransaction", walletTransactionSchema);