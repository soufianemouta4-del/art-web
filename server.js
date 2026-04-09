const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// الاتصال بـ MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas Successfully'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    // process.exit(1);   // أزل هذا مؤقتاً حتى نرى الخطأ بوضوح
  });

// تعريف Schema للطلبات
const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  offer: { type: String, required: true },
  selectedBook: { type: String, default: '' },
  date: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/coloring', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'coloring.html'));
});

app.get('/thanks', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'thanks.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
// API لجلب جميع الطلبات (للداشبورد)
app.get('/api/orders', async (req, res) => {
    try {
      const orders = await Order.find().sort({ date: -1 }); // الأحدث أولاً
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'حدث خطأ أثناء جلب الطلبات' });
    }
  });
// الـ Route الجديد لحفظ الطلب
app.post('/submit-order', async (req, res) => {
  try {
    const { name, address, phone, offer, selectedBook } = req.body;

    const newOrder = new Order({
      name,
      address,
      phone,
      offer,
      selectedBook
    });

    await newOrder.save();
    console.log('📦 New order saved:', newOrder);

    // إعادة التوجيه إلى صفحة الشكر
    res.redirect('/thanks');
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).send('حدث خطأ أثناء حفظ الطلب. حاول مرة أخرى.');
  }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).send('<h1>الصفحة غير موجودة 404</h1>');
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running: http://localhost:${PORT}`);
});