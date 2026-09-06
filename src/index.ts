import http from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";

import { setSocketServer } from "./realtime/socket";

const app = createApp();
const server = http.createServer(app);

export const io = new SocketIOServer(server, {
  cors: {
    origin: env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

setSocketServer(io);

io.on("connection", (socket) => {
  socket.on("join:user", (userId: number) => {
    socket.join(`user:${userId}`);
  });
});

const PORT = env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    logger.info({ port: PORT, env: env.NODE_ENV }, "ITSM API server started");
  });
}

export { server };
