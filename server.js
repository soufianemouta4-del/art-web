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

// خدمة الملفات الثابتة (public folder)
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected on Vercel'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Order Schema
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

// Routes
app.post('/submit-order', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في حفظ الطلب' });
  }
});

app.get('/api/orders', async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  await Order.findByIdAndUpdate(req.params.id, { status });
  res.json({ success: true });
});

// Export for Vercel
module.exports = app;