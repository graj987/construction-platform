const mongoose = require('mongoose');

/**
 * REDESIGNED: One document per worker per day.
 * Unique index on { worker, date } prevents duplicates.
 * Project is optional — worker can be marked even if unassigned.
 */
const attendanceSchema = new mongoose.Schema(
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
    // Store date as midnight UTC for consistent day-level queries
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    status: {
      type: String,
      enum: ['Present', 'Half Day', 'Absent', 'Leave'],
      required: [true, 'Status is required'],
      default: 'Present',
    },
    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 12,
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// The core uniqueness constraint: one record per worker per day
attendanceSchema.index({ worker: 1, date: 1 }, { unique: true });

// For project-based queries (e.g. get all workers on a project for a date)
attendanceSchema.index({ project: 1, date: 1 });

// For monthly report aggregations
attendanceSchema.index({ worker: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
