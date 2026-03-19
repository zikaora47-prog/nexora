import mongoose from "mongoose";

const creatorProductSchema = new mongoose.Schema(
{
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    index: true
  },

  affiliateSlug: {
    type: String,
    required: true,
    unique: true,
    index: true
  }

},
{ timestamps: true }
);

creatorProductSchema.index({ creatorId: 1, productId: 1 }, { unique: true });

export default mongoose.model("CreatorProduct", creatorProductSchema);