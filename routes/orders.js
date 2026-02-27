const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const { sendWhatsAppNotification } = require('../utils/whatsapp');

// Place order
router.post("/", protect, async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail, address, items, deliverySlot, notes } = req.body;
    if (!customerName || !customerPhone || !address || !items || items.length === 0)
      return res.status(400).json({ success: false, message: 'Missing required fields' });

    // Validate & calculate total
    let totalAmount = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
      orderItems.push({ product: product._id, name: product.name, price: product.price, quantity: item.quantity, image: product.image });
      totalAmount += product.price * item.quantity;
    }

    const orderData = { customerName, customerPhone, customerEmail, address, items: orderItems, totalAmount, deliverySlot, notes };
    if (req.user) orderData.user = req.user._id;

    const order = await Order.create(orderData);

    // Send WhatsApp notification
    const notified = await sendWhatsAppNotification(order);
    if (notified) { order.whatsappNotified = true; await order.save(); }

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User: get own orders
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: get all orders
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 50, dateFrom, dateTo } = req.query;
    let query = {};
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const total = await Order.countDocuments(query);
    res.json({ success: true, orders, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: update order status
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: delete order
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: analytics
router.get('/analytics/summary', protect, adminOnly, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, todayOrders, allOrders] = await Promise.all([
      Order.countDocuments(),
      Order.find({ createdAt: { $gte: today } }),
      Order.find()
    ]);

    const todaySales = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalSales = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingOrders = allOrders.filter(o => o.status === 'Pending').length;
    const deliveredOrders = allOrders.filter(o => o.status === 'Delivered').length;

    // Last 7 days sales
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);
      const dayOrders = allOrders.filter(o => o.createdAt >= d && o.createdAt < nextD);
      last7Days.push({ date: d.toLocaleDateString('en-IN', { weekday: 'short' }), sales: dayOrders.reduce((s, o) => s + o.totalAmount, 0), count: dayOrders.length });
    }

    // Category breakdown
    const categoryBreakdown = {};
    allOrders.forEach(o => o.items.forEach(item => {
      if (!categoryBreakdown[item.name]) categoryBreakdown[item.name] = 0;
      categoryBreakdown[item.name] += item.price * item.quantity;
    }));

    res.json({ success: true, analytics: { totalOrders, todaySales, totalSales, pendingOrders, deliveredOrders, last7Days, recentOrders: allOrders.slice(-5).reverse() } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: export CSV
router.get('/export/csv', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    const csvRows = ['Invoice,Customer,Phone,Email,Address,Items,Total,Status,Date'];
    orders.forEach(o => {
      const itemsStr = o.items.map(i => `${i.name}x${i.quantity}`).join('; ');
      const addr = `${o.address.street} ${o.address.city} ${o.address.pincode}`;
      csvRows.push(`"${o.invoiceNumber}","${o.customerName}","${o.customerPhone}","${o.customerEmail || ''}","${addr}","${itemsStr}",${o.totalAmount},"${o.status}","${o.createdAt.toLocaleDateString('en-IN')}"`);
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send(csvRows.join('\n'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
