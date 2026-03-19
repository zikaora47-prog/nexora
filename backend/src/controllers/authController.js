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
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Create JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return user info (exclude password)
    const { password: pwd, ...userData } = user._doc;

    res.status(200).json({ token, user: userData });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};



// Forgot password - generate reset token and send email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No user with that email' });
    }

    // Generate reset token (random bytes)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token (optional but good practice) – store hashed version
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token and expiry (1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL (frontend will capture token)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Nexora Password Reset',
      html: message,
    });

    res.json({ message: 'Password reset email sent' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset password - verify token and update password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // token not expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};