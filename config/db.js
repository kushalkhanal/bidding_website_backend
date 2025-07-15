

const mongoose = require('mongoose');

const connectDB = async () => {
  try {

    if (process.env.NODE_ENV !== 'test') {
        console.log("MONGO_URI =", process.env.DB_URI);
    }
    const conn = await mongoose.connect(process.env.DB_URI);
 
    if (process.env.NODE_ENV !== 'test') {
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
  } catch (err) {
    console.error("Connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;