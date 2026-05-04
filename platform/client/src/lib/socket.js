import { io } from 'socket.io-client';
import { API_URL } from '../api/client.js';

let socket = null;

export const getSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();
  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
