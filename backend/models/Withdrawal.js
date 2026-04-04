const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
  {
    person:  { type: String, enum: ['JP', 'Jenish', 'Urvish'], required: true },
    amount:  { type: Number, required: true }, // can be negative (cash returned)
    note:    { type: String, default: '' },
    date:    { type: String, required: true }, // YYYY-MM-DD IST
  },
  { timestamps: true }
);

withdrawalSchema.index({ date: 1 });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);