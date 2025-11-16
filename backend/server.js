// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const cron = require('node-cron');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Debug log
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
} else {
  console.log('📦 MONGO_URI loaded from .env');
}

// ⚠️ Local-only TLS bypass
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ✅ Import all route files
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const transactionsRoutes = require('./routes/transactions');
const forecastRouter = require('./routes/forecast');
const createExpenseRoutes = require('./routes/expenseRoutes');
const createGroupRoutes = require('./routes/groupRoutes');
const createUserRoutes = require('./routes/userRoutes');

// ✅ Mongoose models
const Groups = require('./models/Groups');

// ✅ Native MongoDB
let db, Users, Expenses;

async function connectMongoClient() {
  try {
    const client = new MongoClient(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    db = client.db('FinanceTracker');
    Users = db.collection('Users');
    Expenses = db.collection('Expenses');
    console.log(`✅ MongoDB Connected (Native Driver) — DB: ${db.databaseName}`);
  } catch (err) {
    console.error('❌ MongoDB Native error:', err.message);
  }
}

async function connectMongoose() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected (Mongoose)');
  } catch (err) {
    console.error('❌ Mongoose connection error:', err.message);
    process.exit(1);
  }
}

// 🔌 Connect both
connectMongoClient();
connectMongoose();

// ✅ Express API routes
app.use('/api/auth', authRoutes);
app.use('/api', uploadRoutes);
app.use('/api', transactionsRoutes);
app.use('/api/forecast', forecastRouter);

let notificationsRouter;
try {
  notificationsRouter = require('./routes/notifications');
  app.use('/api/notifications', notificationsRouter);
} catch (e) {
  console.warn('⚠️ notifications route not loaded:', e.message);
}

// ✅ Native routes
app.use('/api/users', (req, res, next) => {
  if (!Users) return res.status(500).json({ error: 'Database not initialized' });
  createUserRoutes(Users)(req, res, next);
});

app.use('/api/expenses', (req, res, next) => {
  if (!Expenses) return res.status(500).json({ error: 'Database not initialized' });
  createExpenseRoutes(Expenses)(req, res, next);
});

// ✅ Use Mongoose-based model for groups
app.use('/api/groups', createGroupRoutes(Groups));

// 🩺 Health check (API, not root)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 🔕 Reminder cron disabled (as in your comment)
console.log('🔕 Reminder cron disabled (removed by user request)');

// 🌐 Serve React frontend build
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(frontendBuildPath));

// For any non-API route, send back index.html (for React Router support)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// 🚀 Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));