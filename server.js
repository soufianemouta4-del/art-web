// server.js - نسخة مبسطة وآمنة لـ Vercel
require('dotenv').config({ path: './.env' });

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log("✅ MONGO_URI exists:", !!process.env.MONGO_URI);

// Schema
const orderSchema = new mongoose.Schema({
  name: String,
  address: String,
  phone: String,
  offer: String,
  selectedBook: String,
  status: { type: String, default: 'new' },
  date: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

let cached = null;

const connectDB = async () => {
  if (cached) {
    console.log('✅ Using cached MongoDB connection');
    return cached;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in Vercel Environment Variables');
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,   // Lower this
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 5,
      retryWrites: true,
      // family: 4, // uncomment if you get DNS issues
    });
    cached = conn;
    console.log('✅ MongoDB Connected Successfully');
    return conn;
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.name, err.message);
    // Do NOT let it hang — re-throw so Vercel shows clear error
    throw err;
  }
};
// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/thanks', (req, res) => res.sendFile(path.join(__dirname, 'public/thanks.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/admin.html')));

app.post('/submit-order', async (req, res) => {
  try {
    await connectDB();
    const order = new Order(req.body);
    await order.save();
    console.log('📦 Order saved successfully');
    res.redirect('/thanks');
  } catch (err) {
    console.error('Submit error:', err.name, err.message);
    res.status(500).send('حدث خطأ أثناء حفظ الطلب. يرجى المحاولة مرة أخرى لاحقاً.');
  }
});
app.get('/api/orders', async (req, res) => {
  try {
    await connectDB();
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Get orders error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    await connectDB();
    await Order.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

app.use((req, res) => res.status(404).send('<h1>404</h1>'));

module.exports = app;