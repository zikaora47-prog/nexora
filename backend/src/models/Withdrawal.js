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
      type: Number,
      required: true,
      min: 0
    },
    bankDetails: {
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      accountName: { type: String, required: true },
      ifscCode: { type: String } // optional, for international
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending"
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User" // admin who processed
    },
    processedAt: Date,
    rejectionReason: String,
    transactionReference: String, // from payment gateway if we pay out
    metadata: {
      userRoleAtRequest: String, // store role (creator/vendor)
      previousBalance: Number // snapshot before withdrawal
    }
  },
  { timestamps: true }
);

export default mongoose.model("Withdrawal", withdrawalSchema);