const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    // ── Relationships ──────────────────────────────────────────────────────────
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },

    // ── Core fields ────────────────────────────────────────────────────────────
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other'],
      default: 'Cash',
    },
    transactionId: {
      type: String,
      trim: true,
      default: '',
    },

    // ── Classification ─────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['Received', 'Pending', 'Partial', 'Cancelled'],
      default: 'Received',
    },
    // Links to a milestone (optional)
    milestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone',
      default: null,
    },

    // ── Receipt upload ─────────────────────────────────────────────────────────
    receiptImage: { type: String, default: null },
    receiptOriginalName: { type: String, default: null },

    // ── Meta ───────────────────────────────────────────────────────────────────
    remarks: { type: String, trim: true, default: '' },
    receivedBy: { type: String, trim: true, default: '' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
paymentSchema.index({ project: 1, paymentDate: -1 });
paymentSchema.index({ client: 1, paymentDate: -1 });
paymentSchema.index({ status: 1, paymentDate: -1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ isDeleted: 1 });

// ── Auto-sync project.amountReceived after every save ─────────────────────────
paymentSchema.post('save', async function () {
  try {
    const Payment = mongoose.model('Payment');
    const Project = mongoose.model('Project');
    const agg = await Payment.aggregate([
      { $match: { project: this.project, status: 'Received', isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    await Project.findByIdAndUpdate(this.project, {
      amountReceived: agg[0]?.total || 0,
    });
  } catch {
    // Non-critical — don't fail the main operation
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
