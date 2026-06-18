const mongoose = require('mongoose');

const advanceSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: [true, 'Worker is required'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than 0'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    notes: { type: String, trim: true },
    // Soft deduction tracking — which salary record deducted this
    deductedInSalary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salary',
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for fast lookup by worker and date
advanceSchema.index({ worker: 1, date: -1 });
advanceSchema.index({ worker: 1, deductedInSalary: 1 });

module.exports = mongoose.model('Advance', advanceSchema);
