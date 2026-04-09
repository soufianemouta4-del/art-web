const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

// 404 Handler (اختياري)
app.use((req, res) => {
    res.status(404).send('<h1>الصفحة غير موجودة 404</h1>');
});

app.listen(PORT, () => {
    console.log(`Server is running: http://localhost:${PORT}`);
});