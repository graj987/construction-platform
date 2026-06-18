const Project = require('../models/Project');

exports.getAllProjects = async (req, res) => {
  try {
    const { status, featured } = req.query;
    const query = {};
    if (status) query.status = status;
    if (featured === 'true') query.isFeatured = true;
    const projects = await Project.find(query).populate('client', 'name phone').sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('client');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    if (req.body.client === '') {
      delete req.body.client;
    }

    const project = await Project.create(req.body);

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
exports.updateProject = async (req, res) => {
  try {
    if (req.body.client === '') {
      delete req.body.client;
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProjectStats = async (req, res) => {
  try {
    const stats = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const total = await Project.countDocuments();
    const active = await Project.countDocuments({ status: { $nin: ['Completed', 'On Hold'] } });
    res.json({ success: true, data: { stats, total, active } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
