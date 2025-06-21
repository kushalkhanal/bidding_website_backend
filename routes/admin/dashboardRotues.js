


const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../../controllers/admin/dashboard.controller');

// GET /api/admin/dashboard/stats
router.get('/stats', getDashboardStats);

module.exports = router;