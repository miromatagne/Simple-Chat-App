const { SocketAddress } = require("net");

var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

//Contiene todos los usuarios conectados
const connectedUsers = {};

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

//Precisa las acciones del socket cuando se conecta alguién
io.on("connection", (socket) => {
  console.log("A user connected");

  //Se añade el nuevo usuario a la lista de usuarios, el nombre por defecto es "user"
  connectedUsers[socket.id] = "user";

  //Se envia a todos los otros usuarios conectados que el nuevo usuario se ha conectado
  io.emit("chat message", "Nuevo usuario conectado");
  emitUserList();

  //Acciones tomadas cuando un usuario se desconecta
  socket.on("disconnect", () => {
    console.log("User disconnected");

    //Se quita el usuario de la lista de usuarios conectados
    delete connectedUsers[socket.id];
    emitUserList();
  });

  //Acciones tomadas cuando un usuario cambia su nickname
  socket.on("nick", (nick) => {
    connectedUsers[socket.id] = nick;
    console.log("New nickname: " + nick);
    emitUserList();
  });

  //Acciones tomadas cuando el usuario quiere enviar un mensaje privado
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

  //Cuando el usuario está escribiendo, se notifica a los otros usuarios conectados
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

  //Envio de mensaje del usuario a todos los otros usuarios conectados
  socket.on("chat message", (msg) => {
    socket.broadcast.emit(
      "chat message",
      `${connectedUsers[socket.id]}: ${msg}`
    );
  });

  /**
   * Envia una lista de todos los usuarios conectados
   */
  function emitUserList() {
    let msg = "[";

    for (let c in connectedUsers) {
      msg += connectedUsers[c] + ", ";
    }

    msg = msg.substring(0, msg.length - 2);
    msg += "]";

    io.emit("list", msg);
  }
});

http.listen(3000, function () {
  console.log("Listening on *:3000");
});
