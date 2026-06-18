const mongoose = require('mongoose');

const contactRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    location: { type: String, trim: true },
    plotSize: { type: String },
    budget: { type: String },
    message: { type: String },
    isRead: { type: Boolean, default: false },
    isConverted: { type: Boolean, default: false },
    convertedClientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactRequest', contactRequestSchema);
