import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import Withdrawal from "../models/Withdrawal.js";
import mongoose from "mongoose";

// Get current wallet balance
export const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("walletBalance");
    res.json({ balance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's transaction history
export const getTransactions = async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request a withdrawal
export const requestWithdrawal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, bankDetails } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId).session(session);

    // Check role – only creators and vendors can withdraw
    if (!["creator", "vendor"].includes(user.role)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "Only creators and vendors can withdraw" });
    }

    // Check minimum withdrawal (e.g., $10)
    const MIN_WITHDRAWAL = 10; // you can set in .env
    if (amount < MIN_WITHDRAWAL) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: `Minimum withdrawal amount is $${MIN_WITHDRAWAL}` });
    }

    // Check sufficient balance
    if (user.walletBalance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Debit wallet (temporarily hold amount? or immediately deduct)
    // We'll immediately deduct and set status to pending. If rejected, we'll credit back.
    user.walletBalance -= amount;
    await user.save({ session });

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      userId,
      amount,
      bankDetails,
      status: "pending",
      metadata: {
        userRoleAtRequest: user.role,
        previousBalance: user.walletBalance + amount // before deduction
      }
    });
    await withdrawal.save({ session });

    // Create transaction record for the debit
    const transaction = new WalletTransaction({
      userId,
      type: "debit",
      amount,
      source: "withdrawal",
      reference: `WD_${userId}_${Date.now()}`,
      metadata: {
        withdrawalId: withdrawal._id,
        description: "Withdrawal request (pending)"
      },
      status: "pending"
    });
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Withdrawal request submitted",
      withdrawal
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

// Get user's withdrawal requests
export const getMyWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};