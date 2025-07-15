const connectDB = require('./config/db.js');
const app = require('./index'); // Import the Express app from index.js
const dotenv = require('dotenv');

dotenv.config();
connectDB();

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));