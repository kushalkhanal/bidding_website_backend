
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db.js');

// --- Load Middlewares ---
const { protect, isAdmin } = require('./middlewares/authMiddleware.js');

// --- Load Route Files ---
// Sprint 1 Route (make sure the path is correct for your structure)
const authRoutes = require('./routes/userRoutes.js'); 

// Sprint 2 Admin Routes
const adminDashboardRoutes = require('./routes/admin/dashboardRoutes.js');
const adminUserRoutes = require('./routes/admin/userManagementRoutes.js');
const adminBiddingRoomRoutes = require('./routes/admin/biddingRoomManagementRoutes.js');

// --- Step 2: Initial Setup ---
dotenv.config(); // Load environment variables from .env file
connectDB();     // Connect to MongoDB
const app = express();

// --- Step 3: Use Core Middlewares ---
app.use(cors());           // Enable Cross-Origin Resource Sharing
app.use(express.json());   // Allow the server to accept JSON in the body of requests

// --- Step 4: Define API Routes ---

// Public Auth Routes (from Sprint 1)
// Any request to /api/auth/... will be handled by authRoutes
app.use('/api/auth', authRoutes);


// Admin Routes (from Sprint 2)
// Any request to these endpoints will first be checked by 'protect', then by 'isAdmin'
app.use('/api/admin/dashboard', protect, isAdmin, adminDashboardRoutes);
app.use('/api/admin/users', protect, isAdmin, adminUserRoutes);
app.use('/api/admin/bidding-rooms', protect, isAdmin, adminBiddingRoomRoutes); 


// --- Step 5: Start the Server ---
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));