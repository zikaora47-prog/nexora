import User from "../models/User.js";
import crypto from "crypto";

// Initialize Paystack payment
export const initializeCommitmentPayment = async (req, res) => {
  try {
    // Only creators and vendors need to pay
    if (!["creator", "vendor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only creators and vendors need activation" });
    }

    if (req.user.commitmentPaid) {
      return res.status(400).json({ message: "Already activated" });
    }

    // Generate unique reference
    const reference = `COMMIT_${req.user.id}_${Date.now()}`;

    // Call Paystack API
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: req.user.email,
        amount: 310000, // 310000 kobo = ₦3,100 (approx $2.00 USD)
        // No currency field – uses your dashboard default (should be NGN)
        reference,
        metadata: {
          userId: req.user.id.toString(),
          purpose: 'activation_fee'
        },
        callback_url: `${process.env.FRONTEND_URL}/activation-success`
      })
    });

    const data = await response.json();

    if (!data.status) {
      return res.status(400).json({ message: data.message });
    }

    res.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify payment after user returns from Paystack
export const verifyCommitmentPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    const data = await response.json();

    if (!data.status || data.data.status !== 'success') {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const userId = data.data.metadata.userId;

    // Activate user
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        commitmentPaid: true,
        activatedAt: new Date(),
        deleteAt: null
      },
      { new: true }
    ).select('-password');

    res.json({ 
      message: 'Account activated successfully',
      user 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Paystack webhook
export const paystackWebhook = async (req, res) => {
  try {
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
      
      if (metadata.purpose === 'activation_fee') {
        await User.findByIdAndUpdate(metadata.userId, {
          commitmentPaid: true,
          activatedAt: new Date(),
          deleteAt: null
        });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};