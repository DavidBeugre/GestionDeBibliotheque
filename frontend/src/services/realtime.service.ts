import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/constants';
import { getAccessToken } from './apiClient';

let socket: Socket | null = null;
export function connectRealtime(onNotification: () => void): Socket | null {
  const token = getAccessToken();
  if (!token) return null;
  socket?.disconnect();
  socket = io(API_BASE_URL.replace(/\/api\/v1$/, ''), { auth: { token } });
  socket.on('notification:new', onNotification);
  return socket;
}
