const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const Settings = require('../models/Settings');

// ── Auth middleware ───────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const a = req.headers.authorization;
  if (!a?.startsWith('Bearer ')) return res.status(401).json({ success:false, message:'Unauthorized' });
  try { req.user = jwt.verify(a.split(' ')[1], process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ success:false, message:'Invalid token' }); }
};

// GET /api/settings  — public (used by POS to fetch upiOwners for QR)
router.get('/', async (req, res) => {
  try {
    let s = await Settings.findOne();
    if (!s) s = await Settings.create({});
    res.json({ success:true, data: {
      cafeName:   s.cafeName,
      address:    s.address,
      phone:      s.phone,
      tagline:    s.tagline,
      gstEnabled: s.gstEnabled,
      gstRate:    s.gstRate,
      paperWidth: s.paperWidth,
      upiId:      s.upiId,
      upiOwners:  s.upiOwners || [],
    }});
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/settings/full  — auth required (includes ownerPin)
router.get('/full', auth, async (req, res) => {
  try {
    let s = await Settings.findOne();
    if (!s) s = await Settings.create({});
    res.json({ success:true, data: s });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// PUT /api/settings  — auth required
router.put('/', auth, async (req, res) => {
  try {
    const { cafeName, address, phone, tagline, gstEnabled, gstRate, paperWidth, ownerPin, upiId, upiOwners } = req.body;

    let s = await Settings.findOne();
    if (!s) s = new Settings();

    if (cafeName   !== undefined) s.cafeName   = cafeName;
    if (address    !== undefined) s.address    = address;
    if (phone      !== undefined) s.phone      = phone;
    if (tagline    !== undefined) s.tagline    = tagline;
    if (gstEnabled !== undefined) s.gstEnabled = gstEnabled;
    if (gstRate    !== undefined) s.gstRate    = gstRate;
    if (paperWidth !== undefined) s.paperWidth = paperWidth;
    if (ownerPin   !== undefined) s.ownerPin   = ownerPin;
    if (upiId      !== undefined) s.upiId      = upiId.trim();
    if (upiOwners  !== undefined) {
      // Validate and clean upiOwners array
      s.upiOwners = upiOwners.map(o => ({
        key:   o.key,
        name:  o.name,
        upiId: (o.upiId || '').trim(),
        emoji: o.emoji || '👤',
      }));
    }

    await s.save();
    res.json({ success:true, data: s });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;