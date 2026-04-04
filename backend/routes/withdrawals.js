const router     = require('express').Router();
const Withdrawal = require('../models/Withdrawal');
const auth       = require('../middleware/auth');

function getISTDateString() {
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return istNow.toISOString().split('T')[0];
}

// GET /api/withdrawals?month=YYYY-MM  or  ?from=&to=
router.get('/', auth, async (req, res) => {
  try {
    const { month, from, to } = req.query;
    const filter = {};
    if (month)    filter.date = { $gte: `${month}-01`, $lte: `${month}-31` };
    else if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to)   filter.date.$lte = to;
    }
    const list = await Withdrawal.find(filter).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/withdrawals/summary?month=YYYY-MM
router.get('/summary', auth, async (req, res) => {
  try {
    const { month } = req.query;
    const from = month ? `${month}-01` : '2000-01-01';
    const to   = month ? `${month}-31` : '2099-12-31';
    const list = await Withdrawal.find({ date: { $gte: from, $lte: to } });

    const total = list.reduce((s, w) => s + w.amount, 0);
    const byPerson = list.reduce((acc, w) => {
      acc[w.person] = (acc[w.person] || 0) + w.amount;
      return acc;
    }, {});

    res.json({ success: true, data: { total, byPerson, list } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/withdrawals
router.post('/', auth, async (req, res) => {
  try {
    const { person, amount, note, date } = req.body;
    if (!person || amount === undefined || amount === null) return res.status(400).json({ success: false, message: "Person and amount required" });
    const w = await Withdrawal.create({
      person, amount: Number(amount),
      note: note || '',
      date: date || getISTDateString(),
    });
    res.status(201).json({ success: true, data: w });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// PUT /api/withdrawals/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const w = await Withdrawal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!w) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: w });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// DELETE /api/withdrawals/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const w = await Withdrawal.findByIdAndDelete(req.params.id);
    if (!w) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;