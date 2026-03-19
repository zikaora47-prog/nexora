import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/connectDB.js';
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import creatorRoutes from "./routes/creatorRoutes.js";
import commitmentRoutes from "./routes/commitmentRoutes.js";
import orderRoutes from "./routes/orderRoutes.js"; // new
import walletRoutes from "./routes/walletRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();
const app = express();

// Webhook must be raw
app.use('/api/commitment/webhook', express.raw({ type: 'application/json' }));

// Regular JSON parsing
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/creator", creatorRoutes);
app.use("/api/commitment", commitmentRoutes);
app.use("/api/orders", orderRoutes); // new
app.use("/api/wallet", walletRoutes);
app.use("/api/admin", adminRoutes);


const startserver = async () => {
  try {
    await connectDB(); 
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

startserver();