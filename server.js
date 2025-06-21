const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const { protect, isAdmin } = require('./middlewares/auth.middleware');

// --- Load Route Files ---
const authRoutes = require('./routes/auth.routes');
// --- SPRINT 2 ADDITIONS ---
const adminDashboardRoutes = require('./routes/admin/dashboard.routes');
const adminUserRoutes = require('./routes/admin/userManagement.routes');
const adminBiddingRoomRoutes = require('./routes/admin/biddingRoomManagement.routes');
// --- END ADDITIONS ---


dotenv.config();
connectDB();
const app = express();

// --- Core Middlewares ---
app.use(cors());
app.use(express.json());


// --- API ROUTES ---

// Public Auth Routes (from Sprint 1)
app.use('/api/auth', authRoutes);


// --- SPRINT 2: ADMIN ROUTES ---
// All routes below this point will first check for a valid login token (protect),
// and then check if the user's role is 'admin' (isAdmin).
app.use('/api/admin/dashboard', protect, isAdmin, adminDashboardRoutes);
app.use('/api/admin/users', protect, isAdmin, adminUserRoutes);
// Using `bidding-rooms` in the URL is a good RESTful practice
app.use('/api/admin/bidding-rooms', protect, isAdmin, adminBiddingRoomRoutes); 
// --- END SPRINT 2 ---


const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));