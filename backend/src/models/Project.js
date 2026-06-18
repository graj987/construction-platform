const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true, trim: true },
    projectCode: { type: String, unique: true, trim: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String },
    location: { type: String, trim: true },
    startDate: { type: Date },
    expectedCompletion: { type: Date },
    actualCompletion: { type: Date },
    status: {
      type: String,
      enum: ['Planning', 'Foundation', 'Structure', 'Brickwork', 'Plumbing', 'Electrical', 'Finishing', 'Completed', 'On Hold'],
      default: 'Planning',
    },
    constructionType: {
      type: String,
      enum: ['House', 'Duplex', 'Apartment', 'Commercial', 'Renovation', 'Other'],
      default: 'House',
    },
    totalArea: { type: Number },
    floors: { type: Number, default: 1 },
    budget: { type: Number },
    amountReceived: { type: Number, default: 0 },
    description: { type: String },
    images: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

projectSchema.pre('save', async function (next) {
  if (!this.projectCode) {
    const count = await mongoose.model('Project').countDocuments();
    this.projectCode = `CONST-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
