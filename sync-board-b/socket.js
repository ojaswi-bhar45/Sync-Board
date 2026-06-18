const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const onlineUsers = new Map();

function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (process.env.CORS_ORIGIN || "http://localhost:5173")
        .split(",")
        .map((s) => s.trim()),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    onlineUsers.set(socket.userId, socket.id);

    socket.on("join-project", (projectId) => {
      if (!projectId) return;
      socket.join(`project:${projectId}`);
      io.to(`project:${projectId}`).emit("user-online", {
        userId: socket.userId,
        username: socket.user.username,
      });
    });

    socket.on("leave-project", (projectId) => {
      if (!projectId) return;
      socket.leave(`project:${projectId}`);
      io.to(`project:${projectId}`).emit("user-offline", {
        userId: socket.userId,
      });
    });

    socket.on("chat:typing", ({ projectId }) => {
      if (!projectId) return;
      socket.to(`project:${projectId}`).emit("chat:typing", {
        userId: socket.userId,
        username: socket.user.username,
      });
    });

    socket.on("chat:stop-typing", ({ projectId }) => {
      if (!projectId) return;
      socket.to(`project:${projectId}`).emit("chat:stop-typing", {
        userId: socket.userId,
      });
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.userId);
      for (const room of socket.rooms) {
        if (room.startsWith("project:")) {
          io.to(room).emit("user-offline", {
            userId: socket.userId,
          });
        }
      }
    });
  });

  return io;
}

function getOnlineUsers() {
  return onlineUsers;
}

module.exports = { createSocketServer, getOnlineUsers };
