const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// لخدمة الملفات الثابتة مثل الـ CSS والصور إذا كانت موجودة في مجلد اسمه public
app.use(express.static('public'));

// المسار الرئيسي (Main Route)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// مسار صفحة التلوين (Coloring Route)
app.get('/coloring', (req, res) => {
    res.sendFile(path.join(__dirname, 'coloring.html'));
});

// التعامل مع الروابط غير الموجودة (404)
app.use((req, res) => {
    res.status(404).send('الصفحة غير موجودة');
});

app.listen(PORT, () => {
    console.log(`Server is running: http://localhost:${PORT}`);
});