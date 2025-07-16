// File: backend/server.js

const http = require('http');
const { Server } = require("socket.io");
const app = require('./index'); // Your Express app configuration
const dotenv = require('dotenv');
const connectDB = require('./config/db.js');

// 1. Initial Setup
dotenv.config();
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
// This allows your controllers to access it via `req.app.get('socketio')`
app.set('socketio', io);

// 5. Define what happens when a new client connects via WebSocket
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Listen for a 'join_user_room' event from the client
    socket.on('join_user_room', (userId) => {
        socket.join(userId); // Put this socket into a private room
        console.log(`Socket ${socket.id} joined private room for user ${userId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// 6. Start the server
const PORT = process.env.PORT || 5050;



server.listen(PORT, () => console.log(`Server with Socket.IO running on port ${PORT}`));
