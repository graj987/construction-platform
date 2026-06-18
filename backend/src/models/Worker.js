const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  phone: { type: String, trim: true },
  relation: { type: String, trim: true },
}, { _id: false });

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['Mason', 'Carpenter', 'Electrician', 'Plumber', 'Helper', 'Painter', 'Supervisor', 'Welder', 'Tile Fitter', 'Other'],
      default: 'Helper',
    },
    dailyRate: { type: Number, required: true, min: 0 },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    address: { type: String, trim: true },
    joiningDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },

    // Advance tracking — updated whenever an advance is recorded
    totalAdvance: { type: Number, default: 0 },

    // Extended fields
    emergencyContact: { type: emergencyContactSchema, default: () => ({}) },
    notes: { type: String, trim: true },
    aadharNumber: { type: String, trim: true },
    bankAccount: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    photo: { type: String }, // file path
  },
  { timestamps: true }
);

// Indexes for fast query
workerSchema.index({ isActive: 1 });
workerSchema.index({ project: 1 });
workerSchema.index({ role: 1 });
workerSchema.index({ name: 'text' }); // text search

module.exports = mongoose.model('Worker', workerSchema);
