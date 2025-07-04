// File: backend/index.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db.js');

// --- Load Middlewares ---
const { protect, isAdmin } = require('./middlewares/authMiddleware.js');

// --- Load ALL Route Files ---
const authRoutes = require('./routes/userRoutes.js'); 
const biddingRoutes = require('./routes/biddingRoomRoutes.js'); // <-- THIS IS THE UNIFIED PUBLIC ROUTE FILE
const adminDashboardRoutes = require('./routes/admin/dashboardRoutes.js');
const adminUserRoutes = require('./routes/admin/userManagementRoutes.js');
const adminBiddingRoomRoutes = require('./routes/admin/biddingRoomManagementRoutes.js');

// --- Initial Setup ---
dotenv.config();
connectDB();
const app = express();

// --- Core Middlewares ---
app.use(cors());
app.use(express.json());

// === 1. Public & User-Level Routes (No Admin Required) ===
app.use('/api/auth', authRoutes);
// This is the crucial line: any request to /api/bidding-rooms will be handled by our unified public routes.
app.use('/api/bidding-rooms', biddingRoutes);


// === 2. Admin Routes (Protected by 'protect' and 'isAdmin' middleware) ===
app.use('/api/admin/dashboard', protect, isAdmin, adminDashboardRoutes);
app.use('/api/admin/users', protect, isAdmin, adminUserRoutes);
app.use('/api/admin/bidding-rooms', protect, isAdmin, adminBiddingRoomRoutes); // Admin C-U-D route


// --- Start the Server --- 
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));