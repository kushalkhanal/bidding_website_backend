
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db.js');
const { protect, isAdmin } = require('./middlewares/authMiddleware.js');
const authRoutes = require('./routes/userRoutes.js');


const adminDashboardRoutes = require('./routes/admin/dashboardRoutes.js');
const adminUserRoutes = require('./routes/admin/userManagementRoutes.js');
const adminBiddingRoomRoutes = require('./routes/admin/biddingRoomManagementRoutes.js');


dotenv.config();
connectDB();
const app = express();


app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);


// Any request to these endpoints will first be checked by 'protect', then by 'isAdmin'
app.use('/api/admin/dashboard', protect, isAdmin, adminDashboardRoutes);
app.use('/api/admin/users', protect, isAdmin, adminUserRoutes);
app.use('/api/admin/bidding-rooms', protect, isAdmin, adminBiddingRoomRoutes);



const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));