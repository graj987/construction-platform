const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    category: {
      type: String,
      enum: [
        'Material',
        'Labor',
        'Transport',
        'Equipment',
        'Machinery',
        'Food',
        'Accommodation',
        'Site Maintenance',
        'Government Fees',
        'Miscellaneous',
      ],
      required: [true, 'Category is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    vendor: {
      type: String,
      trim: true,
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'],
      default: 'Cash',
    },
    // Bill / receipt — stored as relative path from server root
    billImage: {
      type: String,
      default: null,
    },
    billOriginalName: { type: String, default: null },
    notes: { type: String, trim: true, default: '' },

    // Soft-delete flag (never actually delete receipts)
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
expenseSchema.index({ project: 1, date: -1 });
expenseSchema.index({ category: 1, date: -1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ isDeleted: 1 });
// Text search on description + vendor
expenseSchema.index({ description: 'text', vendor: 'text' });

module.exports = mongoose.model('Expense', expenseSchema);
