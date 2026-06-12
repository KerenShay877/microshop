import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.NOTIFICATION_SERVICE_PORT || "3005");
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "notification-service", timestamp: new Date().toISOString() });
});

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log("Received:", message.toString());
  });
  ws.send(JSON.stringify({ type: "connected", message: "Notification service connected" }));
});

server.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});
