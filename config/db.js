const mongoose = require('mongoose');
require('dotenv').config(); 

const connectDB = async () => {
  try {
    console.log("MONGO_URI =", process.env.DB_URI); // Debug line
    const conn = await mongoose.connect(process.env.DB_URI, {
    
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("Connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
