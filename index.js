const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const socketio = require('socket.io');
const { server } = require('http'); // Update this lin
const { MONGODB_URI, PORT } = require('./config');

const app = express();
const server = http.createServer(app);
const io = socketio(server);


io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err))

  // Start the server
server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });