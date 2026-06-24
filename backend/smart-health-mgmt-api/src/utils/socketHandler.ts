import { Server, Socket } from "socket.io";
import User from "../models/user";

let ioInstance: Server | null = null;

export const setupSocketHandlers = (io: Server) => {
  ioInstance = io;
  io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room based on userId
    socket.on("join_room", (data: { userId: string }) => {
      const { userId } = data;
      if (userId) {
        socket.join(userId);
        console.log(`Socket ${socket.id} joined room: ${userId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

/**
 * Helper to emit data to a specific user's web dashboard
 * Can be called from standard REST controllers
 */
export const notifyDashboardUpdate = (userId: string, data: any) => {
  if (ioInstance) {
    ioInstance.to(userId).emit("smartwatch_data_updated", data);
    console.log(`Real-time notification sent to user: ${userId}`);
  } else {
    console.warn("Socket.io instance not initialized yet");
  }
};
