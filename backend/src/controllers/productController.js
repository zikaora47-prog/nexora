import Product from "../models/Product.js";

export const createProduct = async (req, res) => {
  try {

    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Only vendors can create products" });
    }

    const product = await Product.create({
      vendorId: req.user.id,
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      commissionPercent: req.body.commissionPercent,
      category: req.body.category,
      images: req.body.images,
      shippingInfo: req.body.shippingInfo
    });

    res.status(201).json(product);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getVendorProducts = async (req, res) => {
  try {

    const products = await Product.find({
      vendorId: req.user.id
    }).sort({ createdAt: -1 });

    res.json(products);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const updateProduct = async (req, res) => {
  try {

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        vendorId: req.user.id
      },
      req.body,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const deleteProduct = async (req, res) => {
  try {

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        vendorId: req.user.id
      },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product removed" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getAllProducts = async (req, res) => {
  try {

    const products = await Product.find({ isActive: true })
      .populate("vendorId", "username businessName")
      .sort({ createdAt: -1 });

    res.json(products);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getSingleProduct = async (req, res) => {
  try {

    const product = await Product.findById(req.params.id)
      .populate("vendorId", "username businessName");

    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};