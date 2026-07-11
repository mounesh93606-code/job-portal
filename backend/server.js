const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

global.recentErrors = [];
const originalConsoleError = console.error;
console.error = function (...args) {
  global.recentErrors.unshift({
    timestamp: new Date().toISOString(),
    message: args.map(arg => typeof arg === 'object' ? (arg.stack || JSON.stringify(arg)) : String(arg)).join(' ')
  });
  if (global.recentErrors.length > 50) global.recentErrors.pop();
  originalConsoleError.apply(console, args);
};

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev simplicity
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded resume files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB Connection Pool Test import to run test connection instantly
require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Base route / health check
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Job Portal API.' });
});

app.get('/api/debug-errors', (req, res) => {
  res.json({
    env: {
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PASS_SET: !!process.env.SMTP_PASS,
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT
    },
    errors: global.recentErrors
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
