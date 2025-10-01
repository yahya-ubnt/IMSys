const WebSocket = require('ws');
const url = require('url');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../models/User');
const MikrotikRouter = require('../models/MikrotikRouter');
const { decrypt } = require('../utils/crypto');
const { Client } = require('ssh2'); // Import SSH2 Client

function init(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    // console.log('WebSocket upgrade request received');
    const { pathname, query } = url.parse(request.url, true);
    // console.log(`Path: ${pathname}, Query: ${JSON.stringify(query)}`);

    if (pathname !== '/api/terminal') {
      // console.log('Invalid WebSocket path, destroying socket.');
      socket.destroy();
      return;
    }

    const token = query.token;
    if (!token) {
      // console.log('No token provided, destroying socket.');
      socket.destroy();
      return;
    }

    try {
      // console.log('Verifying token...');
      const decoded = jwt.verify(token, JWT_SECRET);
      // console.log('Token verified, decoded payload:', decoded);

      const user = await User.findById(decoded.id);
      if (!user) {
        // console.log('User not found, destroying socket.');
        socket.destroy();
        return;
      }
      // console.log('User authenticated:', user.fullName);

      const routerId = query.routerId;
      if (!routerId) {
        // console.log('No routerId provided, destroying socket.');
        socket.destroy();
        return;
      }
      // console.log(`Fetching router with ID: ${routerId}`);

      const router = await MikrotikRouter.findById(routerId);
      if (!router) {
        // console.log('Router not found, destroying socket.');
        socket.destroy();
        return;
      }
      // console.log('Router found:', router.name);

      const decryptedPassword = decrypt(router.apiPassword);

      const conn = new Client();
      let shellStream;

      conn.on('ready', () => {
        // console.log('SSH Client :: ready');
        conn.shell((err, stream) => {
          if (err) {
            console.error('SSH Shell Error:', err);
            socket.destroy();
            return;
          }
          shellStream = stream;
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, shellStream);
          });
        });
      }).on('error', (err) => {
        console.error('SSH Client Error:', err);
        socket.destroy();
      }).on('close', () => {
        // console.log('SSH Client :: closed');
      }).connect({
        host: router.ipAddress,
        port: 22, // Default SSH port
        username: router.apiUsername,
        password: decryptedPassword,
        readyTimeout: 15000, // 15 seconds
      });

    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      socket.destroy();
    }
  });

  wss.on('connection', (ws, shellStream) => {
    // console.log('Client connected to terminal WebSocket');

    shellStream.on('data', (data) => {
      ws.send(data.toString('utf8'));
    });

    ws.on('message', (message) => {
      shellStream.write(message.toString('utf8'));
    });

    ws.on('close', () => {
      // console.log('Client disconnected from terminal WebSocket');
      shellStream.end(); // End the SSH shell stream
    });

    shellStream.write('\n'); // Send initial newline to get a prompt
  });

  // console.log('Terminal WebSocket service initialized');
}

module.exports = { init };
