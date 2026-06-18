const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: [true, 'Worker is required'],
    },
    workerName: { type: String },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },

    // Attendance breakdown (auto-filled from attendance records)
    daysPresent: { type: Number, default: 0 },
    daysHalfDay: { type: Number, default: 0 },
    daysAbsent: { type: Number, default: 0 },
    daysLeave: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    effectiveDays: { type: Number, default: 0 }, // present + halfDay*0.5

    // Wage
    dailyRate: { type: Number, required: true },
    grossAmount: { type: Number, default: 0 },  // effectiveDays * dailyRate

    // Deductions
    totalAdvance: { type: Number, default: 0 },  // sum of advances this month
    otherDeductions: { type: Number, default: 0 },
    deductionNotes: { type: String },

    // Final
    finalPayable: { type: Number, default: 0 },  // gross - advance - other

    // Payment tracking
    isPaid: { type: Boolean, default: false },
    paidDate: { type: Date },
    paidAmount: { type: Number, default: 0 },
    paymentMode: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other'],
      default: 'Cash',
    },

    notes: { type: String },

    // Track which advances were deducted in this salary
    advancesDeducted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Advance' }],
  },
  { timestamps: true }
);

// Pre-save auto-calculation
salarySchema.pre('save', function (next) {
  this.effectiveDays = this.daysPresent + this.daysHalfDay * 0.5;
  this.grossAmount = parseFloat((this.effectiveDays * this.dailyRate).toFixed(2));
  this.finalPayable = parseFloat(
    (this.grossAmount - (this.totalAdvance || 0) - (this.otherDeductions || 0)).toFixed(2)
  );
  if (this.finalPayable < 0) this.finalPayable = 0;
  next();
});

// One salary record per worker per month/year
salarySchema.index({ worker: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Salary', salarySchema);
