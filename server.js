const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "public")));

const botName = "Examenchat bot";

const PORT = process.env.PORT || 3000;

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    socket.on("klickadpå", (data) => {
      console.log(data);
      socket
        .to(user.room)
        .emit("message", formatMessage(botName, `Du klickade på ${data.name}`));
    });
    //skickar till endast en socket.id
    socket.on("say to someone", ({ id, value, msg }) => {
      console.log(id + " mitt id");
      console.log(msg);
      // send a private message to the socket with the given id
      io.to(id).emit("privateMessage", formatMessage(user.username, msg));
      //send message to currentuser
      socket.emit(
        "message",
        formatMessage(
          botName,
          `Du skickade privat till ${value} med texten: ${msg}`
        )
      );
    });

    socket.emit("message", formatMessage(botName, "Välkommen till examenchat"));

    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} har anslutit till chatten`)
      );
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  socket.on("messageToMe", (msg) => {
    socket.emit("message", formatMessage(botName, msg));
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} har lämnat chatten`)
      );
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

server.listen(PORT, () => console.log(`server is on port ${PORT}`));
