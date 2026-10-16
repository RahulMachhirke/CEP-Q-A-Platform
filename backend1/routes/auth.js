const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// Ensure destination directory exists on disk
const uploadDir = path.join(__dirname, '..', 'uploads', 'id_cards');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb){
    cb(null, 'uploads/id_cards');
  },
filename: function (req, file, cb) {
const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);  
cb(null, Date.now() + '-' + file.originalname);
  }});

// 2. Define the 'upload' instance that was missing
const upload = multer({ storage: storage });  

const idCardUrl = 'uploads/id_cards/${req.file.filename}'; 
// ==========================================
// 1. REGISTER USER
// ==========================================
router.post('/register', upload.any(), async (req, res) => {
  try {
    const body = req.body || {};
    const fullName = (body.fullName || body.name || '').trim();
    const email = body.email ? body.email.trim().toLowerCase() : '';
    const password = body.password;
    const branch = body.branch || 'General';
    const status = (body.status && body.status.trim() !== '') ? body.status.trim() : '1st Year';
const idCardUrl = req.files && req.files.length > 0 ? `/uploads/id_cards/${req.files[0].filename}` : '';
    // Validation checks
    if (!fullName) {
      return res.status(400).json({ message: 'Full Name is required.' });
    }
    if (!email) {
      return res.status(400).json({ message: 'College Email is required.' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required.' });
    }

    // Check duplicate
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'College Email is already registered.' });
    }

    // Hash Password
    console.log('🔒 Encrypting password with bcrypt...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Handle File Upload
    const file = req.files && req.files.length > 0 ? req.files[0] : null;
   

    // Create User Document
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      branch,
      status,
      idCardUrl
    });

    await newUser.save();

    console.log('✅ Registered new user:', newUser.email);

    res.status(201).json({
      message: 'User registered successfully!',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        branch: newUser.branch,
        status: newUser.status,
        idCardUrl: newUser.idCardUrl
      }
    });
  } catch (error) {
    console.error('❌ Registration Error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration.' });
  }
});

// ==========================================
// 2. LOGIN USER
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔑 Login attempt for email:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      console.log('❌ LOGIN FAILED: No user found in MongoDB with email:', cleanEmail);
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    console.log('✅ User found in DB. Comparing password hash...');
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('❌ LOGIN FAILED: Password comparison failed.');
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    console.log('🔓 LOGIN SUCCESSFUL for:', user.email);

    res.status(200).json({
      message: 'Login successful!',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        branch: user.branch,
        status: user.status,
        idCardUrl: user.idCardUrl
      }
    });
  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;