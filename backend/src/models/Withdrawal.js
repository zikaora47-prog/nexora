
import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    amount: {
      type: mongoose.Types.Decimal128, // safer than Number
      required: true,
      min: 0,
      immutable: true
    },
    bankDetails: {
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true }, // encrypt in production
      accountName: { type: String, required: true },
      ifscCode: { type: String } 
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending"
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User" 
    },
    processedAt: Date,
    rejectionReason: String,
    transactionReference: { type: String, unique: true, sparse: true },
    metadata: {
      userRoleAtRequest: String,
      previousBalance: mongoose.Types.Decimal128
    }
  },
  { timestamps: true }
);

// Index for queries by user and status
withdrawalSchema.index({ userId: 1, status: 1 });

export default mongoose.model("Withdrawal", withdrawalSchema);
