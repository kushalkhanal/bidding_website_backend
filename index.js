
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db.js');
const bodyParser = require('body-parser');

// --- Load Middlewares ---
const { protect, isAdmin } = require('./middlewares/authMiddleware.js');

// --- Load ALL Route Files ---
const authRoutes = require('./routes/userRoutes.js');
const publicBiddingRoutes = require('./routes/biddingRoomRoutes.js'); // For public viewing
const adminDashboardRoutes = require('./routes/admin/dashboardRoutes.js');
const adminUserRoutes = require('./routes/admin/userManagementRoutes.js');
const adminBiddingRoomRoutes = require('./routes/admin/biddingRoomManagementRoutes.js');

// --- Initial Setup ---
dotenv.config();
connectDB();
const app = express();

// --- Core Middlewares (MUST be before routes) ---
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- API ROUTING (Clear Separation - THE FIX) ---

// === 1. Public Routes (No security) ===
app.use('/api/auth', authRoutes);
app.use('/api/bidding-rooms', publicBiddingRoutes); // This now exclusively handles public GET requests for rooms

// === 2. Admin Routes (Protected) ===
app.use('/api/admin/dashboard', protect, isAdmin, adminDashboardRoutes);
app.use('/api/admin/users', protect, isAdmin, adminUserRoutes);
// This route is now unique and will not conflict with the public one.
app.use('/api/admin/bidding-rooms', protect, isAdmin, adminBiddingRoomRoutes);


// --- Start the Server ---
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));