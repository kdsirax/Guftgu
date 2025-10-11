const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");

const port = process.env.PORT || 3000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store connected users
const users = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle user joining
  socket.on("user-join", (username) => {
    users.set(socket.id, username);
    socket.broadcast.emit("user-joined", username);
    socket.emit("users-list", Array.from(users.values()));
    socket.broadcast.emit("users-list", Array.from(users.values()));
    console.log(`${username} joined the chat`);
  });

  // Handle new messages
  socket.on("new-message", (data) => {
    const username = users.get(socket.id);
    const messageData = {
      username: username,
      message: data.message,
      timestamp: new Date().toLocaleTimeString()
    };
    io.emit("message", messageData);
    console.log(`${username}: ${data.message}`);
  });

  // Handle user typing
  socket.on("typing", (data) => {
    const username = users.get(socket.id);
    socket.broadcast.emit("user-typing", { username, isTyping: data.isTyping });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const username = users.get(socket.id);
    if (username) {
      users.delete(socket.id);
      socket.broadcast.emit("user-left", username);
      socket.broadcast.emit("users-list", Array.from(users.values()));
      console.log(`${username} left the chat`);
    }
  });
});

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

httpServer.listen(port, () => {
  console.log(`Chat application is running at: http://localhost:${port}`);
});