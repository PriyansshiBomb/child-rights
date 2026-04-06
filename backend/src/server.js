require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./db');

const app = express();

connectDB();

app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Children Rights Platform API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/progress',    require('./routes/progress'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/badges',      require('./routes/badges'));
app.use('/api/zones',       require('./routes/zones'));
app.use('/api/ai',          require('./routes/ai'));

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error('💥 Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});
console.log('');