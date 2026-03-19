import CreatorProduct from "../models/CreatorProduct.js";
import Product from "../models/Product.js";
import crypto from "crypto";

export const selectProduct = async (req, res) => {
  try {

    if (req.user.role !== "creator") {
      return res.status(403).json({ message: "Only creators can select products" });
    }

    const product = await Product.findById(req.body.productId);

    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not available" });
    }

    const slug = crypto.randomBytes(6).toString("hex");

    const creatorProduct = await CreatorProduct.create({
      creatorId: req.user.id,
      productId: req.body.productId,
      affiliateSlug: slug
    });

    res.status(201).json({
      affiliateLink: `${process.env.FRONTEND_URL}/a/${slug}`,
      creatorProduct
    });

  } catch (err) {

    if (err.code === 11000) {
      return res.status(400).json({ message: "Product already selected" });
    }

    res.status(500).json({ message: err.message });
  }
};


export const getCreatorProducts = async (req, res) => {
  try {

    const products = await CreatorProduct.find({
      creatorId: req.user.id
    })
      .populate("productId")
      .sort({ createdAt: -1 });

    res.json(products);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const removeCreatorProduct = async (req, res) => {
  try {

    const deleted = await CreatorProduct.findOneAndDelete({
      _id: req.params.id,
      creatorId: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ message: "Removed" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};