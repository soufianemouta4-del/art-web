const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// تعريف الـ Schema
const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  offer: { type: String, required: true },
  selectedBook: { type: String, default: '' },
  status: { type: String, default: 'new', enum: ['new', 'processing', 'delivered'] },
  date: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// دالة الاتصال بالداتابيز (مهمة جداً لـ Vercel)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    throw err;
  }
};

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/thanks', (req, res) => res.sendFile(path.join(__dirname, 'public', 'thanks.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// API - جلب الطلبات
app.get('/api/orders', async (req, res) => {
  try {
    await connectDB();
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الطلبات' });
  }
});

// حفظ طلب جديد
app.post('/submit-order', async (req, res) => {
  try {
    await connectDB();
    const newOrder = new Order(req.body);
    await newOrder.save();
    console.log('📦 New order saved');
    res.redirect('/thanks');
  } catch (error) {
    console.error('Error saving order:', error.message);
    res.status(500).send('حدث خطأ أثناء حفظ الطلب');
  }
});

// تحديث حالة الطلب
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { status } = req.body;

    if (!['processing', 'delivered'].includes(status)) {
      return res.status(400).json({ error: 'حالة غير صالحة' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!updatedOrder) return res.status(404).json({ error: 'الطلب غير موجود' });

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error updating status:', error.message);
    res.status(500).json({ error: 'حدث خطأ أثناء التحديث' });
  }
});

// 404
app.use((req, res) => {
  res.status(404).send('<h1>الصفحة غير موجودة 404</h1>');
});

// Export لـ Vercel (مهم جداً)
module.exports = app;