const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  role:    { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
}, { _id: false });

const planningReportSchema = new mongoose.Schema(
  {
    // Input
    plotLength:           { type: Number, required: true },
    plotWidth:            { type: Number, required: true },
    plotArea:             { type: Number },
    floors:               { type: Number, default: 1 },
    bedrooms:             { type: Number, required: true },
    bathrooms:            { type: Number, required: true },
    budget:               { type: Number },
    vastuPreference:      { type: Boolean, default: false },
    parkingRequired:      { type: Boolean, default: false },
    constructionType:     { type: String, default: 'Standard' },
    houseStyle:           { type: String, default: 'Modern' },
    city:                 { type: String },
    specialRequirements:  { type: String },
    contactName:          { type: String },
    contactPhone:         { type: String },

    // Rule-based output (legacy)
    feasibilityScore:  { type: Number, min: 0, max: 100 },
    feasibilityLabel:  { type: String, enum: ['Possible', 'Partially Possible', 'Not Recommended', 'Not Possible'] },
    recommendations:   [{ type: String }],
    warnings:          [{ type: String }],
    suggestedLayout:   { type: Object },
    estimatedCost:     { type: Number },
    reportData:        { type: Object },

    // AI output
    isAIGenerated:  { type: Boolean, default: false },
    aiResponse:     { type: String },
    chatHistory:    [chatMessageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlanningReport', planningReportSchema);
