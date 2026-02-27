require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');

const app = express();

// 1. RENDER PROXY TRUST (Validation errors raakunda)
app.set('trust proxy', 1);

// 2. BODY PARSERS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. SECURITY MIDDLEWARES
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Images load avvadaniki idi avasaram
})); 
app.use(mongoSanitize()); 
app.use(compression()); 

// 4. CORS CONFIGURATION (Localhost 3001 fix ikkade undi)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', // Nee console lo unna error fix kosam idi add chesa
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl) or if in allowedOrigins or if it's a testing wildcard
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 5. RATE LIMITING
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', apiLimiter);

// 6. STATIC FILES & UPLOADS
const uploadsDir = path.join(__dirname, 'uploads/products');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 7. ROUTES
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Desi2Door API running!' }));

// 8. ERROR HANDLING
app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.message);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// 9. DATABASE & SERVER START
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
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
  console.log('MongoDB connection closed.');
  process.exit(0);
});

module.exports = app;
