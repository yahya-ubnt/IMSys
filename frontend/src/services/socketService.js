import { io } from 'socket.io-client';

let socket;

export const initializeSocket = () => {
  if (socket) return;

  const socketUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api', '');
  socket = io(socketUrl, {
    withCredentials: true,
    autoConnect: true, // Explicitly set to connect
  });

  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
  });

  socket.on('connect_error', (error) => {
    // We only want to log this error if it's not an auth issue on the login page
    if (error.message !== 'Authentication error: User not found') {
      console.error('WebSocket connection error:', error.message);
    }
  });
};

export const getSocket = () => {
  if (!socket) {
    initializeSocket();
  }
  return socket;
};