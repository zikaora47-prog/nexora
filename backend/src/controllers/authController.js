import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import { sendEmail } from '../utils/email.js';
// -----------------------
// REGISTER
// -----------------------
export const register = async (req, res) => {
  try {
    const { username, email, password, role, businessName, bankDetails } = req.body;

    // Check vendor requirement
    if (role === "vendor" && !businessName) {
      return res.status(400).json({ message: "Vendor must provide businessName" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      businessName: businessName || undefined,
      bankDetails: bankDetails || undefined,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ message: "Registration failed", error: error.message });
  }
};

// -----------------------
// LOGIN
// -----------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.find
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/email.js";


// -----------------------
// REGISTER
// -----------------------
export const register = async (req, res) => {
  try {

    const { username, email, password, businessName, bankDetails } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Password policy
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prevent role injection
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: "user",
      businessName: businessName || undefined,
      bankDetails: bankDetails || undefined
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully"
    });

  } catch (error) {

    console.error("Register error:", error);

    res.status(500).json({
      message: "Registration failed"
    });
  }
};


// -----------------------
// LOGIN
// -----------------------
export const login = async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
        issuer: "nexora-api"
      }
    );

    const { password: pwd, ...userData } = user._doc;

    res.status(200).json({
      token,
      user: userData
    });

  } catch (error) {

    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed"
    });
  }
};


// -----------------------
// FORGOT PASSWORD
// -----------------------
export const forgotPassword = async (req, res) => {

  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (user) {

      const resetToken = crypto.randomBytes(32).toString("hex");

      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 3600000;

      await user.save();

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken};

      const message = `
      <h1>Password Reset Request</h1>
      <p>Click link to reset password</p>
      <a href="${resetUrl}">${resetUrl}</a>
      `;

      await sendEmail({
        email: user.email,
        subject: "Password Reset",
        html: message
      });
    }

    // Prevent email enumeration
    res.json({
      message: "If an account exists, a reset email has been sent"
    });

  } catch (error) {

    console.error("Forgot password error:", error);

    res.status(500).json({
      message: "Error processing request"
    });
  }
};


// -----------------------
// RESET PASSWORD
// -----------------------
export const resetPassword = async (req, res) => {

  try {

    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token"
      });
    }

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      message: "Password reset successful"
    });

  } catch (error) {

    console.error("Reset password error:", error);

    res.status(500).json({
      message: "Password reset failed"
    });
  }
};
