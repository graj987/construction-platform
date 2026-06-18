const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    location: { type: String, trim: true },
    district: {
      type: String,
      enum: ['Bhojpur', 'Chhapra', 'Vaishali', 'Patna', 'Other'],
      default: 'Other',
    },
    budget: { type: Number },
    plotSize: { type: String },
    plotLength: { type: Number },
    plotWidth: { type: Number },
    floors: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['New Lead', 'Contacted', 'Site Visit', 'Quotation Sent', 'Construction Started', 'Completed', 'Lost'],
      default: 'New Lead',
    },
    notes: { type: String },
    source: {
      type: String,
      enum: ['Website', 'Referral', 'Walk-in', 'Social Media', 'Other'],
      default: 'Website',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
