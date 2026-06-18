const mongoose = require('mongoose');

const diaryEntrySchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    projectName: { type: String },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, required: true },
    workDone: { type: String },
    issues: { type: String },
    photos: [{ type: String }],
    weather: {
      type: String,
      enum: ['Sunny', 'Cloudy', 'Rainy', 'Hot', 'Other'],
      default: 'Sunny',
    },
    workersPresent: { type: Number, default: 0 },
    stage: {
      type: String,
      enum: ['Planning', 'Foundation', 'Structure', 'Brickwork', 'Plumbing', 'Electrical', 'Finishing', 'Other'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DiaryEntry', diaryEntrySchema);
