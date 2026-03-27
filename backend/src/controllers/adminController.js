import Withdrawal from "../models/Withdrawal.js";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import mongoose from "mongoose";

// Get all withdrawals (admin)
export const getAllWithdrawals = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) filter.status = status;

    const withdrawals = await Withdrawal.find(filter)
      .populate("userId", "username email role walletBalance")
      .sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Process withdrawal (approve/reject)
export const processWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: "approve" or "reject"

    const withdrawal = await Withdrawal.findById(id).populate("userId").session(session);
    if (!withdrawal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "pending") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: `Withdrawal already ${withdrawal.status}` });
    }

    const user = withdrawal.userId;

    if (action === "approve") {
      // Withdrawal already deducted from wallet at request time, just update status
      withdrawal.status = "approved";
      withdrawal.processedBy = req.user.id;
      withdrawal.processedAt = new Date();

      // Update the associated transaction to completed
      await WalletTransaction.findOneAndUpdate(
        { "metadata.withdrawalId": withdrawal._id },
        { status: "completed" },
        { session }
      );

    } else if (action === "reject") {
      // Refund the amount back to user's wallet
      if (!rejectionReason) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Rejection reason required" });
      }

      // Credit back the amount
      user.walletBalance += withdrawal.amount;
      await user.save({ session });

      // Create credit transaction for refund
      await WalletTransaction.create([{
        userId: user._id,
        type: "credit",
        amount: withdrawal.amount,
        source: "refund",
        reference: `REF_${user._id}_${Date.now()}`,
        metadata: {
          withdrawalId: withdrawal._id,
          description: `Withdrawal rejected: ${rejectionReason}`
        }
      }], { session });

      // Update withdrawal
      withdrawal.status = "rejected";
      withdrawal.rejectionReason = rejectionReason;
      withdrawal.processedBy = req.user.id;
      withdrawal.processedAt = new Date();

      // Update original transaction to failed
      await WalletTransaction.findOneAndUpdate(
        { "metadata.withdrawalId": withdrawal._id },
        { status: "failed" },
        { session }
import Withdrawal from "../models/Withdrawal.js";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import mongoose from "mongoose";


// ===============================
// Get all withdrawals (ADMIN)
// ===============================
export const getAllWithdrawals = async (req, res) => {
  try {

    // ADMIN AUTHORIZATION
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required"
      });
    }

    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const withdrawals = await Withdrawal.find(filter)
      .populate("userId", "username email role walletBalance")
      .sort({ createdAt: -1 });

    res.json(withdrawals);

  } catch (error) {

    console.error("Get withdrawals error:", error);

    res.status(500).json({
      message: "Internal server error"
    });
  }
};


// ===============================
// Process withdrawal (ADMIN)
// ===============================
export const processWithdrawal = async (req, res) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    // ADMIN AUTHORIZATION
    if (req.user.role !== "admin") {
      await session.abortTransaction();
      session.endSession();

      return res.status(403).json({
        message: "Admin access required"
      });
    }

    const { id } = req.params;
    const { action, rejectionReason } = req.body;


    // ===============================
    // ObjectId validation
    // ===============================
    if (!mongoose.Types.ObjectId.isValid(id)) {

      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        message: "Invalid withdrawal ID"
      });
    }


    // ===============================
    // Action validation
    // ===============================
    const allowedActions = ["approve", "reject"];

    if (!allowedActions.includes(action)) {

      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        message: "Invalid action"
      });
    }


    // ===============================
    // Fetch withdrawal inside transaction
    // ===============================
    const withdrawal = await Withdrawal
      .findById(id)
      .populate("userId")
      .session(session);


    if (!withdrawal) {

      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        message: "Withdrawal not found"
      });
    }


    // ===============================
    // Prevent double processing
    // ===============================
    if (withdrawal.status !== "pending") {

      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        message: `Withdrawal already ${withdrawal.status}`
      });
    }


    const user = withdrawal.userId;


    // ===============================
    // APPROVE
    // ===============================
    if (action === "approve") {

      withdrawal.status = "approved";
      withdrawal.processedBy = req.user.id;
      withdrawal.processedAt = new Date();

      await WalletTransaction.findOneAndUpdate(
        { "metadata.withdrawalId": withdrawal._id },
        { status: "completed" },
        { session }
      );

    }


    // ===============================
    // REJECT
    // ===============================
    if (action === "reject") {

      if (!rejectionReason) {

        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          message: "Rejection reason required"
        });
      }

      // Refund user wallet
      user.walletBalance += withdrawal.amount;

      await user.save({ session });


      // Create refund transaction
      await WalletTransaction.create([{

        userId: user._id,
        type: "credit",
        amount: withdrawal.amount,
        source: "refund",
        reference: `REF_${user._id}_${Date.now()}`,

        metadata: {
          withdrawalId: withdrawal._id,
          description: `Withdrawal rejected: ${rejectionReason}`
        }

      }], { session });


      withdrawal.status = "rejected";
      withdrawal.rejectionReason = rejectionReason;
      withdrawal.processedBy = req.user.id;
      withdrawal.processedAt = new Date();


      await WalletTransaction.findOneAndUpdate(
        { "metadata.withdrawalId": withdrawal._id },
        { status: "failed" },
        { session }
      );

    }


    // ===============================
    // Save withdrawal
    // ===============================
    await withdrawal.save({ session });


    // Commit transaction
    await session.commitTransaction();
    session.endSession();


    res.json({
      message: `Withdrawal ${action}ed successfully`,
      withdrawal
    });


  } catch (error) {

    await session.abortTransaction();
    session.endSession();

    console.error("Process withdrawal error:", error);

    res.status(500).json({
      message: "Internal server error"
    });
  }

};
