const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Register (phone + name — no password for regular users)
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone number are required' });

    const cleaned = phone.replace(/\D/g, '').slice(-10);
    if (cleaned.length !== 10) return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number' });

    const existing = await User.findOne({ phone: cleaned });
    if (existing) return res.status(400).json({ success: false, message: 'This phone number is already registered. Please login.' });

    const user = await User.create({ name: name.trim(), phone: cleaned, email: email || '' });
    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login — phone number only for users, phone + PIN for admin
router.post('/login', async (req, res) => {
  try {
    const { phone, pin } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });

    const cleaned = phone.replace(/\D/g, '').slice(-10);
    const user = await User.findOne({ phone: cleaned });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this number. Please sign up first.' });

    // Admin needs PIN
    if (user.role === 'admin') {
      if (!pin) return res.status(401).json({ success: false, message: 'Admin PIN required', needsPin: true });
      const match = await user.matchPin(pin);
      if (!match) return res.status(401).json({ success: false, message: 'Incorrect PIN' });
    }

    const token = generateToken(user._id);
    res.json({ success: true, token, user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, address } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (email !== undefined) updates.email = email;
    if (address) updates.address = address;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-pin');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Wishlist toggle
router.post('/wishlist/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;
    const idx = user.wishlist.map(String).indexOf(String(productId));
    if (idx > -1) user.wishlist.splice(idx, 1);
    else user.wishlist.push(productId);
    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get wishlist
router.get('/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
