const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// خدمة الملفات الثابتة
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Connection مع معالجة خطأ أفضل
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    throw err; // سيظهر الخطأ بوضوح في Vercel Logs
  }
};

connectDB();

// Schema
const orderSchema = new mongoose.Schema({
  name: String,
  address: String,
  phone: String,
  offer: String,
  selectedBook: String,
  status: { type: String, default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Routes مع try/catch
app.post('/submit-order', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Submit Order Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Get Orders Error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
  } catch (err) {
    console.error('Update Status Error:', err);
    res.status(500).json({ success: false });
  }
});

module.exports = app;