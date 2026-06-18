const mongoose = require('mongoose');
const Advance = require('../models/Advance');
const Worker = require('../models/Worker');

// ─── GET ADVANCES ─────────────────────────────────────────────────────────────

exports.getAdvances = async (req, res) => {
  try {
    const { worker, project, from, to } = req.query;
    const query = {};

    if (worker) {
      if (!mongoose.Types.ObjectId.isValid(worker))
        return res.status(400).json({ success: false, message: 'Invalid worker ID' });
      query.worker = new mongoose.Types.ObjectId(worker);
    }
    if (project) {
      if (!mongoose.Types.ObjectId.isValid(project))
        return res.status(400).json({ success: false, message: 'Invalid project ID' });
      query.project = new mongoose.Types.ObjectId(project);
    }
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to + 'T23:59:59');
    }

    const advances = await Advance.find(query)
      .populate('worker', 'name role dailyRate')
      .populate('project', 'projectName')
      .sort({ date: -1 })
      .lean();

    const total = advances.reduce((sum, a) => sum + a.amount, 0);

    res.json({ success: true, data: advances, totalAmount: total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET WORKER ADVANCE SUMMARY ───────────────────────────────────────────────

exports.getWorkerAdvanceSummary = async (req, res) => {
  try {
    const { workerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(workerId))
      return res.status(400).json({ success: false, message: 'Invalid worker ID' });

    const [worker, advances] = await Promise.all([
      Worker.findById(workerId).select('name totalAdvance').lean(),
      Advance.find({ worker: workerId }).sort({ date: -1 }).lean(),
    ]);

    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

    const totalGiven = advances.reduce((s, a) => s + a.amount, 0);
    const totalDeducted = advances
      .filter(a => a.deductedInSalary)
      .reduce((s, a) => s + a.amount, 0);
    const outstanding = totalGiven - totalDeducted;

    res.json({
      success: true,
      data: {
        worker,
        advances,
        totalGiven,
        totalDeducted,
        outstanding: Math.max(0, outstanding),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CREATE ADVANCE ───────────────────────────────────────────────────────────

exports.createAdvance = async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.worker || !mongoose.Types.ObjectId.isValid(body.worker))
      return res.status(400).json({ success: false, message: 'Valid worker ID is required' });
    if (!body.amount || Number(body.amount) <= 0)
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });

    if (body.project === '' || body.project === 'null') delete body.project;
    body.amount = Number(body.amount);

    const advance = await Advance.create(body);

    // Update worker's totalAdvance counter
    await Worker.findByIdAndUpdate(body.worker, {
      $inc: { totalAdvance: body.amount },
    });

    const populated = await advance.populate([
      { path: 'worker', select: 'name role' },
      { path: 'project', select: 'projectName' },
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── UPDATE ADVANCE ───────────────────────────────────────────────────────────

exports.updateAdvance = async (req, res) => {
  try {
    const existing = await Advance.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Advance not found' });

    const body = { ...req.body };
    if (body.project === '' || body.project === 'null') body.project = null;
    const newAmount = body.amount ? Number(body.amount) : existing.amount;
    const diff = newAmount - existing.amount;

    body.amount = newAmount;
    Object.assign(existing, body);
    await existing.save();

    // Adjust worker's totalAdvance by the difference
    if (diff !== 0) {
      await Worker.findByIdAndUpdate(existing.worker, {
        $inc: { totalAdvance: diff },
      });
    }

    res.json({ success: true, data: existing });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── DELETE ADVANCE ───────────────────────────────────────────────────────────

exports.deleteAdvance = async (req, res) => {
  try {
    const advance = await Advance.findById(req.params.id);
    if (!advance) return res.status(404).json({ success: false, message: 'Advance not found' });

    // Reverse the totalAdvance counter
    await Worker.findByIdAndUpdate(advance.worker, {
      $inc: { totalAdvance: -advance.amount },
    });

    await Advance.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Advance deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
