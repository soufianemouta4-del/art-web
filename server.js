const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

console.log("MONGO_URI:", process.env.MONGO_URI ? "موجود" : "غير موجود");

// Schema
const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  offer: { type: String, required: true },
  selectedBook: { type: String, default: '' },
  status: { type: String, default: 'new' },
  date: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI غير موجود في الـ Environment Variables');
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 45000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,        // مهم في Vercel
      minPoolSize: 1,
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

app.post('/submit-order', async (req, res) => {
  try {
    await connectDB();
    const newOrder = new Order(req.body);
    await newOrder.save();
    console.log('📦 New order saved');
    res.redirect('/thanks');
  } catch (error) {
    console.error('Error saving order:', error.message);
    res.status(500).send('حدث خطأ أثناء حفظ الطلب. حاول مرة أخرى.');
  }
});
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { status } = req.body;
    const updated = await Order.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ success: true, order: updated });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ' });
  }
});

app.use((req, res) => res.status(404).send('<h1>404</h1>'));

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (e) {
    console.error("Failed to start:", e.message);
  }
};

start();