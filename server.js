const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utility/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utility/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// set static foler
app.use(express.static(path.join(__dirname, "public")));

const modName = "SysAdm";

// Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    socket.emit("message", formatMessage(modName, "Welcome to Chat!"));

    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(
          modName,
          `${user.username} has joined the chat room ${room}.`
        )
      );
    io.to(user.name).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Broadcast when a user connects

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(modName, `${user.username} has left the chat room.`)
      );

      io.to(user.name).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });

  // listen to chat messages
  socket.on("chatMessage", (message) => {
    const user = getCurrentUser(socket.id);
    io.emit("message", formatMessage(user.username, message));
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () =>
  console.log(`Server successfully running on port: ${PORT}`)
);
