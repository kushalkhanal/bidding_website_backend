// const router = require("express").Router();
// const userController = require("../controllers/userController");

// router.post("/register", userController.registerUser)
// router.post('/login', userController.loginUser);
// module.exports = router;



// const express = require('express');
// const router = express.Router();
// const authRoutes = require('./routes/userRoutes.js'); 
// const { 
//     registerUser, 
//     loginUser, 
//     getMyBidHistory // <-- Import the new function
// } = require('../controllers/userController.js'); 

// const { protect } = require('../middlewares/authMiddleware.js');

// router.post('/register', registerUser);
// router.post('/login', loginUser);

// router.get('/my-bids', protect, getMyBidHistory);


// module.exports = router;



const express = require('express');
const router = express.Router();
const { getMyBidHistory } = require('../controllers/userController.js');
const { protect } = require('../middlewares/authMiddleware.js');

// This defines the route: GET /api/users/my-bids
// It is protected, so a user must be logged in.
router.get('/my-bids', protect, getMyBidHistory);

module.exports = router;