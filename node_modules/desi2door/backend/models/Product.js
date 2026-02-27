const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  category: {
    type: String,
    required: true,
    enum: ['meat-fish', 'vegetables', 'dairy-eggs', 'oils-ghee', 'millets-groceries', 'dry-fruits', 'chocolates', 'masalas']
  },
  image: { type: String, default: '' },
  stock: { type: Number, default: 100 },
  inStock: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  unit: { type: String, default: '' },
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
