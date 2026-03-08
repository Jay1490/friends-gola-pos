const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const settingsSchema = new mongoose.Schema(
  {
    cafeName:   { type: String, default: 'Friend\'s Gola' },
    address:    { type: String, default: 'Opp. Amigo\'s 13 Food Court, Gota, Ahmedabad, Gujarat , 382481' },
    phone:      { type: String, default: '+91 97378 83377' },
    tagline:    { type: String, default: 'Sip. Smile. Repeat.' },
    gstEnabled: { type: Boolean, default: true },
    gstRate:    { type: Number, default: 5 },
    paperWidth: { type: String, enum: ['58mm', '80mm'], default: '58mm' },
    ownerPin:   { type: String, default: '0000' },  // stored as plain, hashed on verify
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
