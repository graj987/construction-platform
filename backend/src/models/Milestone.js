const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    // Pre-set stage names used in Bihar construction workflows
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: { type: String, trim: true, default: '' },
    expectedAmount: {
      type: Number,
      required: [true, 'Expected amount is required'],
      min: 0,
    },
    receivedAmount: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['Upcoming', 'Pending', 'Received', 'Overdue', 'Cancelled'],
      default: 'Upcoming',
    },
    sortOrder: { type: Number, default: 0 },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// ── Auto-compute status based on dates & amounts ───────────────────────────────
milestoneSchema.pre('save', function (next) {
  const now = new Date();
  if (this.status === 'Cancelled') return next();
  if (this.receivedAmount >= this.expectedAmount) {
    this.status = 'Received';
  } else if (this.dueDate && new Date(this.dueDate) < now) {
    this.status = 'Overdue';
  } else if (this.dueDate && new Date(this.dueDate) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
    this.status = 'Pending'; // due within 7 days
  } else {
    this.status = 'Upcoming';
  }
  next();
});

milestoneSchema.index({ project: 1, sortOrder: 1 });
milestoneSchema.index({ status: 1 });
milestoneSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Milestone', milestoneSchema);
