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
    console.log(connectedUsers);
  });

  socket.on("priv", ({ msg, dest }) => {
    console.log("MSG: " + msg);
    console.log("DEST: " + dest);
    let dest_socket = null;
    for (let c in connectedUsers) {
      if (connectedUsers[c] == dest) {
        dest_socket = c;
      }
    }
    console.log("Dest socket : " + dest_socket);
    if (dest_socket) {
      socket
        .to(dest_socket)
        .emit("chat message", `${connectedUsers[socket.id]}: ${msg}`);
    }
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
    console.log("message: " + msg);
    socket.broadcast.emit(
      "chat message",
      `${connectedUsers[socket.id]}: ${msg}`
    );
  });
});

http.listen(3000, function () {
  console.log("listening on *:3000");
});
