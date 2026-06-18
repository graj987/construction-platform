const mongoose = require('mongoose');
const Milestone = require('../models/Milestone');

const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(id);

exports.getMilestones = async (req, res) => {
  try {
    const { project, status } = req.query;
    const query = {};
    if (project) {
      if (!isValidId(project)) return res.status(400).json({ success: false, message: 'Invalid project ID' });
      query.project = new mongoose.Types.ObjectId(project);
    }
    if (status) query.status = status;

    const milestones = await Milestone.find(query)
      .populate('project', 'projectName projectCode')
      .sort({ project: 1, sortOrder: 1 })
      .lean();
    res.json({ success: true, data: milestones });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createMilestone = async (req, res) => {
  try {
    const body = { ...req.body };
    if (!isValidId(body.project))
      return res.status(400).json({ success: false, message: 'Valid project ID required' });
    body.expectedAmount = Number(body.expectedAmount) || 0;
    body.receivedAmount = Number(body.receivedAmount) || 0;

    const milestone = await Milestone.create(body);
    res.status(201).json({ success: true, data: milestone });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateMilestone = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.expectedAmount !== undefined) body.expectedAmount = Number(body.expectedAmount);
    if (body.receivedAmount !== undefined) body.receivedAmount = Number(body.receivedAmount);

    // Fetch and save so pre-save hook recalculates status
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });
    Object.assign(milestone, body);
    await milestone.save();

    res.json({ success: true, data: milestone });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteMilestone = async (req, res) => {
  try {
    const m = await Milestone.findByIdAndDelete(req.params.id);
    if (!m) return res.status(404).json({ success: false, message: 'Milestone not found' });
    res.json({ success: true, message: 'Milestone deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
