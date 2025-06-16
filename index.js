require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('./src/model/User');
const authRoutes = require('./src/routes/auth');
const chatRoutes = require('./src/routes/chat');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Store connected clients
const clients = new Map();

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  // Extract token from query string
  const token = new URL(req.url, 'ws://localhost').searchParams.get('token');
  
  if (!token) {
    ws.close(1008, 'Authentication required');
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    ws.userId = decoded.userId;

    // Handle messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        // Handle different message types
        switch (data.type) {
          case 'chat':
            // Handle chat message
            break;
          case 'typing':
            // Handle typing indicator
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  } catch (error) {
    console.error('WebSocket authentication error:', error);
    ws.close(1008, 'Invalid token');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});