const mongoose = require('mongoose');
const Material = require('../models/Material');

exports.getMaterials = async (req, res) => {
  try {
    const { project, category } = req.query;
    const query = {};
    if (project) {
      if (!mongoose.Types.ObjectId.isValid(project))
        return res.status(400).json({ success: false, message: 'Invalid project ID' });
      query.project = new mongoose.Types.ObjectId(project);
    }
    if (category) query.category = category;
    const materials = await Material.find(query)
      .populate('project', 'projectName')
      .sort({ category: 1 })
      .lean();
    res.json({ success: true, data: materials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createMaterial = async (req, res) => {
  try {
    // Coerce numeric fields sent as strings
    const body = { ...req.body };
    if (body.purchased !== undefined) body.purchased = Number(body.purchased) || 0;
    if (body.used !== undefined) body.used = Number(body.used) || 0;
    if (body.pricePerUnit !== undefined) body.pricePerUnit = Number(body.pricePerUnit) || 0;
    if (body.project === '' || body.project === 'null') delete body.project;

    const material = new Material(body);
    await material.save(); // triggers pre-save hook (remaining, totalCost)
    await material.populate('project', 'projectName');
    res.status(201).json({ success: true, data: material });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    const body = { ...req.body };
    if (body.purchased !== undefined) body.purchased = Number(body.purchased) || 0;
    if (body.used !== undefined) body.used = Number(body.used) || 0;
    if (body.pricePerUnit !== undefined) body.pricePerUnit = Number(body.pricePerUnit) || 0;
    if (body.project === '' || body.project === 'null') body.project = null;

    // Use fetch-modify-save so pre-save hook recalculates remaining & totalCost
    Object.assign(material, body);
    await material.save();
    await material.populate('project', 'projectName');
    res.json({ success: true, data: material });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
    res.json({ success: true, message: 'Material deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMaterialSummary = async (req, res) => {
  try {
    const { project } = req.query;
    const match = {};
    // FIX: cast string to ObjectId for aggregation
    if (project && mongoose.Types.ObjectId.isValid(project)) {
      match.project = new mongoose.Types.ObjectId(project);
    }
    const summary = await Material.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          totalCost: { $sum: '$totalCost' },
          totalItems: { $sum: 1 },
          totalPurchased: { $sum: '$purchased' },
          totalUsed: { $sum: '$used' },
        },
      },
      { $sort: { totalCost: -1 } },
    ]);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
