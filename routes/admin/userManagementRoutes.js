

const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUserById } = require('../../controllers/admin/userManagementController');

// GET /api/admin/users
router.get('/', getAllUsers);

// DELETE /api/admin/users/:id
router.delete('/:id', deleteUserById);

module.exports = router;