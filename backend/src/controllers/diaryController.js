const DiaryEntry = require('../models/DiaryEntry');

exports.getDiaryEntries = async (req, res) => {
  try {
    const { project, month, year } = req.query;
    const query = {};
    if (project) query.project = project;
    if (month && year) {
      query.date = { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0, 23, 59, 59) };
    }
    const entries = await DiaryEntry.find(query).populate('project', 'projectName').sort({ date: -1 });
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createDiaryEntry = async (req, res) => {
  try {
    const photos = req.files ? req.files.map((f) => `/uploads/diary/${f.filename}`) : [];
    const entry = await DiaryEntry.create({ ...req.body, photos });
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateDiaryEntry = async (req, res) => {
  try {
    const entry = await DiaryEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteDiaryEntry = async (req, res) => {
  try {
    const entry = await DiaryEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
