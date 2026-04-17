const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true },
    amount:   { type: Number, required: true, min: 0 },
    category: { type: String, enum: ['Colours', 'Toppings', 'Baraf', 'Other'], default: 'Other' },
    note:     { type: String, default: '' },
    date:     { type: String, required: true }, // YYYY-MM-DD
    paidBy:   { type: String, enum: ['JP', 'Jenish', 'Urvish', 'CashBox'], default: 'JP' }, 
  },
  { timestamps: true }
);

expenseSchema.index({ date: 1 });

module.exports = mongoose.model('Expense', expenseSchema);