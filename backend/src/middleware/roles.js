export const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export const requireVendor = (req, res, next) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({ message: "Vendor access required" });
  }
  next();
};

export const requireCreator = (req, res, next) => {
  if (req.user.role !== "creator") {
    return res.status(403).json({ message: "Creator access required" });
  }
  next();
};