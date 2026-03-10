const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', methods: ['GET','POST','PUT','DELETE','PATCH'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Auth middleware ──────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const a = req.headers.authorization;
  if (!a?.startsWith('Bearer ')) return res.status(401).json({ success:false, message:'Unauthorized' });
  try { req.user = jwt.verify(a.split(' ')[1], process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ success:false, message:'Invalid token' }); }
};

// ─── PUT /api/orders/:id — Edit Order (before other routes) ──────────────────
app.put('/api/orders/:id', auth, async (req, res) => {
  try {
    const Order = require('./models/Order');
    const { items, note, paymentMethod } = req.body;
    if (!items?.length) return res.status(400).json({ success:false, message:'Order must have at least one item' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success:false, message:'Order not found' });
    if (order.status === 'cancelled') return res.status(400).json({ success:false, message:'Cannot edit cancelled order' });
    const sub = items.reduce((s,i) => s + i.price * i.qty, 0);
    const gst = order.gstEnabled ? Math.round(sub * order.gstRate) / 100 : 0;
    order.items    = items.map(i => ({ productId:i.productId||i._id, name:i.name, emoji:i.emoji, price:i.price, qty:i.qty, total:i.price*i.qty }));
    order.subtotal = sub;
    order.gst      = gst;
    order.total    = sub + gst;
    order.note     = note || '';
    if (paymentMethod === 'cash' || paymentMethod === 'online') order.paymentMethod = paymentMethod;
    await order.save();
    // console.log('✅ Order edited:', order.billNo);
    res.json({ success:true, data:order });
  } catch(err) {
    console.error('Edit error:', err.message);
    res.status(500).json({ success:false, message:err.message });
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/auth',     require('./routes/auth'));

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}));

app.use((req, res) => res.status(404).json({ success:false, message:'Route not found' }));
app.use((err, req, res, next) => res.status(500).json({ success:false, message:err.message }));

// ─── MongoDB + Start ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS:10000 })
  .then(async () => {
    console.log('✅ MongoDB connected!');

    const Settings = require('./models/Settings');
    if (!(await Settings.findOne())) {
      await Settings.create({
        cafeName:'JAY CAFÉ', address:'Near Main Square, City',
        phone:'+91 98765 43210', tagline:'Sip. Smile. Repeat.',
        gstEnabled:false, gstRate:0, paperWidth:'58mm', ownerPin:'1234'
      });
      console.log('✅ Default settings seeded');
    }

    const Product = require('./models/Product');
    if ((await Product.countDocuments()) === 0) {
      await Product.insertMany([
        // 🌟 Premium Gola
        { name:'Spc Friends Gola',      price:150, category:'Premium Gola',     emoji:'⭐', active:true },
        { name:'Kit Kat Gola',          price:120, category:'Premium Gola',     emoji:'🍫', active:true },
        { name:'Oreo Gola',             price:120, category:'Premium Gola',     emoji:'🍪', active:true },
        { name:'Chocolate Dry Fruit Gola', price:90, category:'Premium Gola',   emoji:'🍫', active:true },
        { name:'Dry Fruit Gola',        price:70,  category:'Premium Gola',     emoji:'🥜', active:true },
        { name:'Choco Chips Gola',      price:70,  category:'Premium Gola',     emoji:'🍩', active:true },
        // 🧊 Classic Color Gola
        { name:'Rose Gola',             price:40,  category:'Classic Gola',     emoji:'🌹', active:true },
        { name:'Kala Khatta Gola',      price:40,  category:'Classic Gola',     emoji:'🫐', active:true },
        { name:'Mava Badam Gola',       price:40,  category:'Classic Gola',     emoji:'🌰', active:true },
        { name:'Chocolate Gola',        price:40,  category:'Classic Gola',     emoji:'🍫', active:true },
        { name:'Dry Fruit Gola (Cls)',  price:70,  category:'Classic Gola',     emoji:'🥜', active:true },
        { name:'Pineapple Gola',        price:40,  category:'Classic Gola',     emoji:'🍍', active:true },
        { name:'Kachha Mango Gola',     price:40,  category:'Classic Gola',     emoji:'🥭', active:true },
        { name:'Chiku Gola',            price:40,  category:'Classic Gola',     emoji:'🧊', active:true },
        { name:'Khush Gola',            price:40,  category:'Classic Gola',     emoji:'😊', active:true },
        { name:'Mango Gola',            price:40,  category:'Classic Gola',     emoji:'🥭', active:true },
      ]);
      console.log('✅ Default products seeded');
    }

    // ✅ THIS WAS THE BUG — app.listen was commented out!
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`✅ All routes active including PUT /api/orders/:id\n`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB FAILED:', err.message);
    process.exit(1);
  });