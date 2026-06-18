const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: String,
  quantity: Number,
  unit: String,
  rate: Number,
  amount: Number,
});

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: { type: String, unique: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String, required: true },
    clientPhone: { type: String },
    clientLocation: { type: String },
    area: { type: Number, required: true },
    floors: { type: Number, default: 1 },
    constructionType: {
      type: String,
      enum: ['Economy', 'Standard', 'Premium', 'Luxury'],
      default: 'Standard',
    },
    ratePerSqFt: { type: Number, required: true },
    lineItems: [lineItemSchema],
    subtotal: { type: Number },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number },
    validUntil: { type: Date },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'],
      default: 'Draft',
    },
    notes: { type: String },
    terms: { type: String, default: '50% advance, 30% on structure completion, 20% on final handover.' },
  },
  { timestamps: true }
);

quotationSchema.pre('save', async function (next) {
  if (!this.quotationNumber) {
    const count = await mongoose.model('Quotation').countDocuments();
    this.quotationNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  this.subtotal = this.area * this.floors * this.ratePerSqFt;
  this.totalAmount = this.subtotal + (this.tax || 0) - (this.discount || 0);
  next();
});

module.exports = mongoose.model('Quotation', quotationSchema);
