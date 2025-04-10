const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const path = require('path');

app.use(express.static(path.join(__dirname)));

const users = new Map();

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('login', (username) => {
        users.set(socket.id, username);
        io.emit('updateOnlineCount', users.size);
    });

    // Add at the top with other constants
    const messageHistory = [];
    
    // Inside your io.on('connection') handler, add:
    socket.on('request_messages', () => {
        socket.emit('update_messages', messageHistory);
    });
    
    // Modify your chat message handler
    socket.on('chat message', (msg) => {
        const username = users.get(socket.id);
        const messageData = { username, message: msg };
        messageHistory.push(messageData);
        // Keep only last 100 messages
        if (messageHistory.length > 100) {
            messageHistory.shift();
        }
        io.emit('chat message', messageData);
    });

    socket.on('logout', () => {
        users.delete(socket.id);
        io.emit('updateOnlineCount', users.size);
    });

    socket.on('disconnect', () => {
        users.delete(socket.id);
        io.emit('updateOnlineCount', users.size);
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});