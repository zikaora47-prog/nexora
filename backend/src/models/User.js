import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["creator", "vendor", "admin", "buyer"], default: "buyer", required: true },
    commitmentPaid: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    activatedAt: { type: Date }, // when they paid
    // Auto-delete after 14 days if not paid (only for creators/vendors)
    deleteAt: {
      type: Date,
      default: function() {
        if (this.role === 'creator' || this.role === 'vendor') {
          return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
        }
        return null;
      },
      index: { expires: 0 } // TTL index: MongoDB deletes doc at this date
    },
    businessName: { type: String },
    bankDetails: {
      bankName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
  },
  { timestamps: true }
);



const User = mongoose.model("User", userSchema);
export default User;