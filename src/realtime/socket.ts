import type { Server as SocketIOServer } from "socket.io";

let ioInstance: SocketIOServer | null = null;

export function setSocketServer(io: SocketIOServer): void {
  ioInstance = io;
}

export function getSocketServer(): SocketIOServer | null {
  return ioInstance;
}

export function emitToUser(userId: number, event: string, data: unknown): void {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
}

export function broadcastEvent(event: string, data: unknown): void {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
}
