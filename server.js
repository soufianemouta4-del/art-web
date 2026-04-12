const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// مهم: للسماح بالطلبات من Live Server (port 5500)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// الاتصال بقاعدة البيانات
const dbURI = process.env.MONGO_URI;
mongoose.connect(dbURI)
  .then(() => console.log('✅ Connected to MongoDB successfully!'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// Schema للطلبات (نفس السابق مع تعديل بسيط)
const orderSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  offer: { type: String, required: true },
  selectedBook: { type: String, default: '' },
  status: {
    type: String,
    enum: ['new', 'processing', 'delivered'],
    default: 'new'
  },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('OrdersBook', orderSchema);

// ==================== API Routes ====================

// 1. إرسال الطلب الجديد (من صفحة البيع)
app.post('/submit-order', async (req, res) => {
  try {
    const { name, address, phone, offer, selectedBook } = req.body;

    if (!name || !address || !phone || !offer) {
      return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
    }

    const newOrder = new Order({ name, address, phone, offer, selectedBook });
    await newOrder.save();

    console.log('📦 طلب جديد محفوظ:', newOrder._id);

    res.json({ 
      success: true, 
      message: 'تم حفظ الطلب بنجاح',
      redirect: '/thank-you.html' 
    });

  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء حفظ الطلب' });
  }
});

// 2. جلب جميع الطلبات (للداشبورد)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }); // الأحدث أولاً
    res.json(orders);
    console.log('📦 جلب جميع الطلبات');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ في جلب الطلبات' });
  }
});

// 3. تحديث حالة الطلب
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    if (!['new', 'processing', 'delivered'].includes(status)) {
      return res.status(400).json({ message: 'حالة غير صالحة' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ في تحديث الحالة' });
  }
});

// صفحة الشكر
app.get('/thank-you.html', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head><meta charset="UTF-8"><title>شكراً لك</title>
    <style>body{font-family:Cairo,sans-serif;text-align:center;padding:100px;background:#faf7f2;} h1{color:#2d6a4f;}</style>
    </head>
    <body>
      <h1>✅ تم تأكيد طلبك بنجاح!</h1>
      <p>سنتواصل معك قريباً عبر الواتساب أو الهاتف.</p>
      <a href="/" style="color:#c9a84c;font-size:18px;">العودة للصفحة الرئيسية</a>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل على: http://localhost:${PORT}`);
  console.log(`   داشبورد الطلبات: http://localhost:${PORT}/dashboard.html`);
});