import { Server } from 'socket.io';

let io;

/**
 * Initializes Socket.io server instance
 * @param {object} server HTTP Server instance
 * @returns {object} Socket.io Server instance
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Operator connected to telemetry stream: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Operator disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Retrieves the initialized Socket.io Server instance
 * @returns {object} Socket.io Server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet.');
  }
  return io;
};

/**
 * Broadcasts a security alert to all active analysts
 * @param {object} alert Alert Mongoose document
 */
export const broadcastAlert = (alert) => {
  try {
    const activeIo = getIO();
    activeIo.emit('new-alert', alert);
    console.log(`[Socket.io] Broadcasted alert: ${alert.title}`);
  } catch (err) {
    console.warn(`[Socket.io Warning] Broadcast failed: ${err.message}`);
  }
};
