import { io } from 'socket.io-client';

let socket;

export const getSocket = () => {
  if (!socket) {
    const socketUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api', '');
    socket = io(socketUrl, {
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
    });
  }
  return socket;
};