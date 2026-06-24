import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        path: "/api/socket.io",
        withCredentials: true,
      });

      this.socket.on("connect", () => {
        console.log("Connected to Socket.io server");
      });

      this.socket.on("connect_error", (error: any) => {
        console.error("Socket connection error:", error);
      });
    }
    return this.socket;
  }

  joinRoom(userId: string) {
    if (this.socket) {
      this.socket.emit("join_room", { userId });
      console.log(`Requested to join room: ${userId}`);
    }
  }

  onSmartwatchUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("smartwatch_data_updated", callback);
    }
  }

  offSmartwatchUpdate() {
    if (this.socket) {
      this.socket.off("smartwatch_data_updated");
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
