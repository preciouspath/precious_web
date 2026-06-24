import http from "http";
import app from "./app";
import { Server } from "socket.io";
import { setupSocketHandlers } from "./utils/socketHandler";

// process.env.TZ = "Asia/Kolkata";
const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

const io = new Server(server, {
  path: "/api/socket.io",
  cors: {
    origin: true, 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }
});

setupSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});
