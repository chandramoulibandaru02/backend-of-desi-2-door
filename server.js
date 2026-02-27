require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet'); // New
const rateLimit = require('express-rate-limit'); // New
const mongoSanitize = require('express-mongo-sanitize'); // New
const compression = require('compression'); // New

const app = express();

// --- 1. Top Level Security & Performance ---
app.use(helmet()); 
app.use(mongoSanitize());
app.use(compression());

// Rate limiting: 15 mins lo max 100 requests per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// --- 2. Middleware & CORS ---
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- 3. Static Files ---
const uploadsDir = path.join(__dirname, 'uploads/products');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 4. Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Desi2Door API running!' }));

// --- 5. Database & Server ---
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000, tls: true })
  .then(() => {
    console.log('✅ MongoDB connected!');
    app.listen(PORT, () => console.log(`🚀 Desi2Door server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  });

// Graceful Shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
