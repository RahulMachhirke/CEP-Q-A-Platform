const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    default: 'General'
  },
  status: {
    type: String,
    required: true,
    default: '1st Year'
  },
  idCardUrl: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true // Automatically handles createdAt and updatedAt
});

module.exports = mongoose.model('User', userSchema);