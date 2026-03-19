import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
{
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true,
    min: 0
  },

  commissionPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 80
  },

  category: {
    type: String,
    index: true
  },

  images: {
    type: [String],
    default: []
  },

  shippingInfo: {
    type: String
  },

  isActive: {
    type: Boolean,
    default: true
  }

},
{ timestamps: true }
);

export default mongoose.model("Product", productSchema);