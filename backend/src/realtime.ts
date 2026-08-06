import type { Server } from 'socket.io';
let io: Server | undefined;
export const setRealtimeServer = (server: Server) => { io = server; };
export const emitToUser = (userId: string, event: string, payload: unknown) => io?.to(`user:${userId}`).emit(event, payload);
