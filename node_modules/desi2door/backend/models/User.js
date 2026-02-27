const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, default: '', lowercase: true },
  // Admin-only PIN (bcrypt hashed), regular users have no PIN
  pin: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  createdAt: { type: Date, default: Date.now }
});

userSchema.methods.matchPin = async function (enteredPin) {
  if (!this.pin) return false;
  return await bcrypt.compare(String(enteredPin), this.pin);
};

module.exports = mongoose.model('User', userSchema);
