const http = require('http');
const { Server } = require("socket.io");
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, './.env') });
const app = require('./index'); // Your Express app configuration
const connectDB = require('./config/db.js');

// 1. Initial Setup
connectDB();

// 2. Create the main HTTP server using your Express app
const server = http.createServer(app);

// 3. Initialize Socket.IO and attach it to the HTTP server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Allow your frontend to connect
        methods: ["GET", "POST"]
    }
});

// 4. Make the 'io' instance globally accessible within your Express app
app.set('socketio', io);

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // --- Private Room for User Notifications ---
    // This is for sending private alerts like "You've been outbid".
    socket.on('join_user_room', (userId) => {
        socket.join(userId);
        console.log(`Socket ${socket.id} joined private notification room for user ${userId}`);
    });

    // --- Public Room for Product Bid Updates ---
    // This is for sending public updates like "The price is now $150".
    socket.on('join_product_room', (productId) => {
        socket.join(productId);
        console.log(`Socket ${socket.id} is now watching for updates on product ${productId}`);
    });

    // It's good practice to have a 'leave' event for cleanup, especially in single-page apps.
    socket.on('leave_product_room', (productId) => {
        socket.leave(productId);
        console.log(`Socket ${socket.id} stopped watching product ${productId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// 6. Start the server
const PORT = process.env.PORT || 5050;

server.listen(PORT, () => console.log(`Server with Socket.IO running on port ${PORT}`));