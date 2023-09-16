// backend/config/index.js
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret';

module.exports = { PORT, MONGODB_URI, JWT_SECRET };