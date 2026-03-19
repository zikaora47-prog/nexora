export const requireCommitment = async (req, res, next) => {
  // Buyers and admins don't need to pay
  if (req.user.role === 'buyer' || req.user.role === 'admin') {
    return next();
  }

  // Check if commitment is paid
  if (!req.user.commitmentPaid) {
    return res.status(403).json({ 
      message: "Activation fee required. Please pay $2 to continue.",
      requiresActivation: true
    });
  }

  next();
};