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
  emitUserList();

  socket.on("disconnect", () => {
    console.log("user disconnected");
    delete connectedUsers[socket.id];
    emitUserList();
  });

  socket.on("nick", (nick) => {
    connectedUsers[socket.id] = nick;
    console.log("new nickname: " + nick);
    socket.broadcast.emit(
      "typing",
      `${connectedUsers[socket.id]} is typing...`
    );
    emitUserList();
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
    emitUserList();
  });

  socket.on("typing", (isTyping) => {
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

  function emitUserList()
  {
    let msg = '[';

    for (let c in connectedUsers) {

      msg += connectedUsers[c] + ', ';
    }

    msg = msg.substring(0, msg.length -2);
    msg += ']';

    io.emit('list user', msg);
  }
});

http.listen(3000, function () {
  console.log("listening on *:3000");
});
