const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true },
    amount:   { type: Number, required: true, min: 0 },
    category: { type: String, enum: ['Ingredients', 'Utilities', 'Rent', 'Salary', 'Equipment', 'Marketing', 'Other'], default: 'Other' },
    note:     { type: String, default: '' },
    date:     { type: String, required: true }, // YYYY-MM-DD
  },
  { timestamps: true }
);

expenseSchema.index({ date: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
