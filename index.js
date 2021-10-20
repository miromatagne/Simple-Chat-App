const { SocketAddress } = require("net");

var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

const connectedUsers = {};

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  console.log("a user connected");
  connectedUsers[socket.id] = "user";
  io.emit("chat message", "Nuevo usuario conectado");
  console.log(connectedUsers);

  socket.on("disconnect", () => {
    console.log("user disconnected");
    delete connectedUsers[socket.id];
  });

  socket.on("nick", (nick) => {
    connectedUsers[socket.id] = nick;
    console.log("new nickname: " + nick);
    socket.broadcast.emit(
      "typing",
      `${connectedUsers[socket.id]} is typing...`
    );
  });

  socket.on("pm", ({ msg, dest }) => {
    let dest_socket = null;
    for (let c in connectedUsers) {
      if (connectedUsers[c] == dest) {
        dest_socket = c;
      }
    }
    if (dest_socket) {
      socket
        .to(dest_socket)
        .emit("chat message", `${connectedUsers[socket.id]}: ${msg}`);
    }
  });

  socket.on('list', () => {
    console.log('Me ha llegado list');
    let msg = '[';

    for (let c in connectedUsers) {

      msg += connectedUsers[c] + ', ';
    }

    msg = msg.substring(0, msg.length -2);
    msg += ']';

    io.emit('chat message', msg);
  });

  socket.on("typing", (isTyping) => {
    console.log("Typing Event: " + isTyping);
    if (isTyping) {
      socket.broadcast.emit(
        "typing",
        `${connectedUsers[socket.id]} is typing...`
      );
    } else {
      socket.broadcast.emit("typing", `No one is typing`);
    }
  });

  socket.on("chat message", (msg) => {
    socket.broadcast.emit(
      "chat message",
      `${connectedUsers[socket.id]}: ${msg}`
    );
  });
});

http.listen(3000, function () {
  console.log("listening on *:3000");
});
