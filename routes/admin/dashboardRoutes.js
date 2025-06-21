


const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../../controllers/admin/dashboardController');

// GET /api/admin/dashboard/stats
router.get('/stats', getDashboardStats);

module.exports = router;