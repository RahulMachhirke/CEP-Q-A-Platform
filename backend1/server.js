require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


// 1. INITIALIZE EXPRESS FIRST
const app = express();

// 2. MOUNT MIDDLEWARE AFTER APP IS CREATED
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const path = require('path');

// 1. Serve static assets (CSS, client JS, images) directly from the current folder
app.use(express.static(__dirname));

// 2. Serve index.html when visiting the root URL '/'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// Serves files inside /uploads publicly at the route http://localhost:5000/uploads/
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. MOUNT ROUTES
const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/question');

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);

// 4. DATABASE CONNECTION & SERVER STARTUP
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://rahulmach2007_db_user:PTSBM6jHgDJbdw1a@cluster0.rg4afy2.mongodb.net/eduq_db?retryWrites=true&w=majority&appName=Cluster0';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas Cloud!');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

  