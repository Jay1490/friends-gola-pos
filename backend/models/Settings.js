const mongoose = require('mongoose');

const upiOwnerSchema = new mongoose.Schema({
  key:   { type: String, required: true }, // 'JP', 'Jenish', 'Urvish'
  name:  { type: String, required: true },
  upiId: { type: String, default: '' },
  emoji: { type: String, default: '👤' },
}, { _id: false });

const settingsSchema = new mongoose.Schema(
  {
    cafeName:   { type: String, default: "Friend's Gola" },
    address:    { type: String, default: "Opp. Pariwar Homes, Gota, Ahmedabad, Gujarat, 382481" },
    phone:      { type: String, default: '+91 97378 83377' },
    tagline:    { type: String, default: 'Sip. Smile. Repeat.' },
    gstEnabled: { type: Boolean, default: true },
    gstRate:    { type: Number, default: 5 },
    paperWidth: { type: String, enum: ['58mm', '80mm'], default: '58mm' },
    ownerPin:   { type: String, default: '0000' },
    upiId:      { type: String, default: 'pateljaya1607-2@oksbi' }, // legacy / fallback
    upiOwners:  {
      type: [upiOwnerSchema],
      default: [
        { key: 'JP',     name: 'JP',     upiId: 'pateljaya1607-2@oksbi', emoji: '👦🏻' },
        { key: 'Jenish', name: 'Jenish', upiId: 'jenishpanchal1407@okicici', emoji: '🧔🏻‍♂️' },
        { key: 'Urvish', name: 'Urvish', upiId: 'urvishpatel1520@oksbi', emoji: '👨🏻' },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);