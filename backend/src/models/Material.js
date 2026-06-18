const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    projectName: { type: String },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Cement', 'Sand', 'Bricks', 'Steel', 'Tiles', 'Wood', 'Electrical', 'Plumbing', 'Paint', 'Other'],
      required: true,
    },
    unit: { type: String, default: 'Bags' },
    purchased: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 },
    pricePerUnit: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    supplier: { type: String },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

materialSchema.pre('save', function (next) {
  this.remaining = this.purchased - this.used;
  this.totalCost = this.purchased * this.pricePerUnit;
  next();
});

module.exports = mongoose.model('Material', materialSchema);
