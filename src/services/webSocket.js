// Frontend WebSocket service
import { io } from "socket.io-client";

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:3000");

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    this.socket.on("connect", () => {
      console.log("✅ Connected to WebSocket server at", WS_URL);
      this.isConnected = true;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from WebSocket:", reason);
      this.isConnected = false;
    });

    this.socket.on("dashboard-update", (data) => {
      console.log("📊 Dashboard update received:", data);
      // Handle real-time updates here
      this.handleDashboardUpdate(data);
    });

    this.socket.on("connected", (data) => {
      console.log("🔌 WebSocket connection confirmed:", data);
    });

    return this.socket;
  }

  joinAdminDashboard(adminId, role) {
    if (!this.socket) {
      console.error("WebSocket not connected");
      return;
    }

    this.socket.emit("join-admin-dashboard", { adminId, role });
    console.log(`👤 Joining admin dashboard as ${role}`);
  }

  handleDashboardUpdate(data) {
    // Dispatch custom event or update state based on the data
    const event = new CustomEvent("websocket-update", { detail: data });
    window.dispatchEvent(event);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

export const webSocketService = new WebSocketService();
