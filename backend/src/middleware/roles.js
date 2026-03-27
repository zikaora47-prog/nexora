export const requireRole = (role) => {
  return (req, res, next) => {

    // Check authentication
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    // Check role
    if (req.user.role !== role) {
      return res.status(403).json({
        message: `${role} access required`
      });
    }

    next();
  };
};

// Specific role middleware
export const requireAdmin = requireRole("admin");
export const requireVendor = requireRole("vendor");
export const requireCreator = requireRole("creator");
