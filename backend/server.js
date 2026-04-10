const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://friends-gola-pos.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.options('*', cors()); // handle preflight for all routesapp.use(express.json());
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
    const { items, note, paymentMethod, upiOwner } = req.body;
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
    if (paymentMethod === 'cash' || paymentMethod === 'online') {
      order.paymentMethod = paymentMethod;
      order.upiOwner = paymentMethod === 'online' ? (upiOwner || order.upiOwner || '') : '';
    }
    await order.save();
    res.json({ success:true, data:order });
  } catch(err) {
    console.error('Edit error:', err.message);
    res.status(500).json({ success:false, message:err.message });
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/expenses',     require('./routes/expenses'));
app.use('/api/withdrawals',  require('./routes/withdrawals'));
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
        cafeName:"Friend's Gola", address:"Near Main Square, City",
        phone:'+91 98765 43210', tagline:'Sip. Smile. Repeat.',
        gstEnabled:false, gstRate:0, paperWidth:'58mm', ownerPin:'1234',
        upiOwners: [
          { key:'JP',     name:'JP',     upiId:'pateljaya1607-2@oksbi', emoji:'👦🏻' },
          { key:'Jenish', name:'Jenish', upiId:'',                       emoji:'🧔🏻‍♂️' },
          { key:'Urvish', name:'Urvish', upiId:'',                       emoji:'👨🏻' },
        ],
      });
      console.log('✅ Default settings seeded');
    } else {
      // Migrate existing settings — add upiOwners if missing
      const s = await Settings.findOne();
      if (!s.upiOwners || s.upiOwners.length === 0) {
        s.upiOwners = [
          { key:'JP',     name:'JP',     upiId: s.upiId || '', emoji:'👦🏻' },
          { key:'Jenish', name:'Jenish', upiId:'',              emoji:'🧔🏻‍♂️' },
          { key:'Urvish', name:'Urvish', upiId:'',              emoji:'👨🏻' },
        ];
        await s.save();
        console.log('✅ Migrated upiOwners into settings');
      }
    }

      const Product = require('./models/Product');
    if ((await Product.countDocuments()) === 0) {
      await Product.insertMany([
        { name:'Spc Friends Dish',      price:130, category:'Premium Gola',  emoji:'🌈', active:true },
        { name:'Oreo/KitKat Dish',      price:110, category:'Premium Gola',  emoji:'🍪', active:true },
        { name:'Choco Chips Dish',      price:80,  category:'Premium Gola',  emoji:'🍫', active:true },
        { name:'Dry Fruit Dish',        price:80,  category:'Premium Gola',  emoji:'🥜', active:true },
        { name:'Big Regular Dish',      price:60,  category:'Classic Gola',  emoji:'🧊', active:true },
        { name:'Small Regular Dish',    price:40,  category:'Classic Gola',  emoji:'🧊', active:true },
        { name:'Water Bottle',          price:10,  category:'Other',         emoji:'💧', active:true },
      ]);
      console.log('✅ Default products seeded');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB FAILED:', err.message);
    process.exit(1);
  });