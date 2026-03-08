const router = require('express').Router();
const Expense = require('../models/Expense');
const Order   = require('../models/Order');
const auth    = require('../middleware/auth');

// GET /api/expenses — list expenses with optional date filter
router.get('/', auth, async (req, res) => {
  try {
    const { from, to, month } = req.query;
    const filter = {};

    if (month) {
      // month = "2026-03" → filter whole month
      filter.date = { $gte: `${month}-01`, $lte: `${month}-31` };
    } else if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to)   filter.date.$lte = to;
    }

    const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/expenses — add expense
router.post('/', auth, async (req, res) => {
  try {
    const { title, amount, category, note, date } = req.body;
    if (!title || !amount || !date || !category) {
      return res.status(400).json({ success: false, message: 'Title, amount, date and category are required' });
    }
    const expense = await Expense.create({ title, amount, category, note, date });
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/expenses/:id — edit expense
router.put('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/expenses/summary — income vs expense vs profit for a month
router.get('/summary', auth, async (req, res) => {
  try {
    const { month } = req.query;
    const from = month ? `${month}-01` : new Date().toISOString().slice(0, 7) + '-01';
    const to   = month ? `${month}-31` : new Date().toISOString().slice(0, 7) + '-31';

    const [expenses, orders] = await Promise.all([
      Expense.find({ date: { $gte: from, $lte: to } }),
      Order.find({ date: { $gte: from, $lte: to }, status: { $ne: 'cancelled' } }),
    ]);

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome   = orders.reduce((s, o) => s + o.total, 0);
    const totalProfit   = totalIncome - totalExpenses;

    // Group expenses by category
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    // Daily income for chart (last 30 days)
    const dailyIncome = orders.reduce((acc, o) => {
      acc[o.date] = (acc[o.date] || 0) + o.total;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        totalProfit,
        totalOrders: orders.length,
        byCategory,
        dailyIncome,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
