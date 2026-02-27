require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',               // Local development kosam
  process.env.FRONTEND_URL,              // Netlify URL (Render env lo set cheyali)
].filter(Boolean);                       // Undefined values ni remove chestundi

app.use(cors({ 
  origin: allowedOrigins, 
  credentials: true 
}));

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, 'uploads/products');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Desi2Door API running!' }));

// 404 handler
app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Connect DB & Start Server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  tls: true
})
  .then(() => {
    console.log('✅ MongoDB connected!');
    app.listen(PORT, () => console.log(`🚀 Desi2Door server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  });
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Middlewares
app.use(helmet()); // Secure headers
app.use(mongoSanitize()); // Prevent NoSQL injection

// Rate limiting: 15 mins lo max 100 requests per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);
const compression = require('compression');
app.use(compression());

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
  process.exit(0);
});


module.exports = app;

