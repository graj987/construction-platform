const mongoose = require('mongoose');
const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');
const Advance = require('../models/Advance');
const Salary = require('../models/Salary');

// ─── LIST & SEARCH ────────────────────────────────────────────────────────────

exports.getAllWorkers = async (req, res) => {
  try {
    const { isActive, project, role, search } = req.query;
    const query = {};

    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (project === 'none') query.project = null;
    else if (project) query.project = new mongoose.Types.ObjectId(project);
    if (role) query.role = role;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { phone: { $regex: escaped, $options: 'i' } },
      ];
    }

    const workers = await Worker.find(query)
      .populate('project', 'projectName projectCode')
      .sort({ name: 1 })
      .lean();

    res.json({ success: true, data: workers, total: workers.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SINGLE WORKER ───────────────────────────────────────────────────────────

exports.getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate('project', 'projectName projectCode location status')
      .lean();

    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
    res.json({ success: true, data: worker });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── WORKER FULL PROFILE ──────────────────────────────────────────────────────
// Returns worker + last 6 months salary summary + recent advances + current month attendance

exports.getWorkerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid worker ID' });
    }

    const worker = await Worker.findById(id)
      .populate('project', 'projectName projectCode location status')
      .lean();
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();

    // Current month attendance summary
    const monthStart = new Date(thisYear, thisMonth - 1, 1);
    const monthEnd = new Date(thisYear, thisMonth, 0, 23, 59, 59);

    const [attendanceThisMonth, advances, recentSalaries] = await Promise.all([
      Attendance.find({ worker: id, date: { $gte: monthStart, $lte: monthEnd } }).lean(),
      Advance.find({ worker: id }).sort({ date: -1 }).limit(10)
        .populate('project', 'projectName').lean(),
      Salary.find({ worker: id }).sort({ year: -1, month: -1 }).limit(6).lean(),
    ]);

    const present = attendanceThisMonth.filter(a => a.status === 'Present').length;
    const halfDay = attendanceThisMonth.filter(a => a.status === 'Half Day').length;
    const absent = attendanceThisMonth.filter(a => a.status === 'Absent').length;
    const leave = attendanceThisMonth.filter(a => a.status === 'Leave').length;
    const effectiveDays = present + halfDay * 0.5;
    const earnedThisMonth = effectiveDays * worker.dailyRate;

    // Total advance outstanding (not yet deducted)
    const totalAdvancePaid = advances.reduce((sum, a) => sum + a.amount, 0);
    const totalDeducted = recentSalaries.reduce((sum, s) => sum + (s.totalAdvance || 0), 0);
    const outstandingAdvance = Math.max(0, worker.totalAdvance - totalDeducted);

    const profile = {
      worker,
      currentMonth: {
        month: thisMonth,
        year: thisYear,
        present,
        halfDay,
        absent,
        leave,
        effectiveDays,
        earnedThisMonth,
      },
      advances: advances.slice(0, 5),
      recentSalaries,
      stats: {
        totalEarned: recentSalaries.reduce((s, r) => s + (r.grossAmount || 0), 0),
        totalPaid: recentSalaries.reduce((s, r) => s + (r.paidAmount || 0), 0),
        outstandingAdvance,
        totalAdvanceGiven: worker.totalAdvance,
      },
    };

    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

exports.getWorkerStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalWorkers,
      activeWorkers,
      todayAttendance,
      roleBreakdown,
      monthlyLaborCost,
      pendingSalary,
    ] = await Promise.all([
      Worker.countDocuments(),
      Worker.countDocuments({ isActive: true }),
      Attendance.find({ date: { $gte: todayStart, $lte: todayEnd } })
        .select('status worker').lean(),
      Worker.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Salary.aggregate([
        {
          $match: {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        },
        { $group: { _id: null, total: { $sum: '$grossAmount' } } },
      ]),
      Salary.aggregate([
        { $match: { isPaid: false } },
        { $group: { _id: null, total: { $sum: '$finalPayable' } } },
      ]),
    ]);

    const onSiteToday = todayAttendance.filter(a => a.status === 'Present').length;
    const onLeaveToday = todayAttendance.filter(a => a.status === 'Leave').length;

    res.json({
      success: true,
      data: {
        totalWorkers,
        activeWorkers,
        onSiteToday,
        onLeaveToday,
        roleBreakdown,
        monthlyLaborCost: monthlyLaborCost[0]?.total || 0,
        pendingSalaryAmount: pendingSalary[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── WORKERS BY PROJECT ───────────────────────────────────────────────────────

exports.getWorkersByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }
    const workers = await Worker.find({
      project: new mongoose.Types.ObjectId(projectId),
      isActive: true,
    }).sort({ name: 1 }).lean();

    res.json({ success: true, data: workers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CREATE ───────────────────────────────────────────────────────────────────

exports.createWorker = async (req, res) => {
  try {
    const body = { ...req.body };
    // Coerce types safely
    if (body.project === '' || body.project === 'null') delete body.project;
    if (body.dailyRate !== undefined) body.dailyRate = Number(body.dailyRate);
    if (body.isActive !== undefined) body.isActive = body.isActive === 'true' || body.isActive === true;

    const worker = await Worker.create(body);
    const populated = await worker.populate('project', 'projectName projectCode');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate entry detected' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

exports.updateWorker = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.project === '' || body.project === 'null' || body.project === null) {
      body.project = null; // explicit unassign
    }
    if (body.dailyRate !== undefined) body.dailyRate = Number(body.dailyRate);
    // Fix audit bug: coerce isActive string to boolean
    if (body.isActive !== undefined) {
      body.isActive = body.isActive === 'true' || body.isActive === true;
    }

    const worker = await Worker.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    }).populate('project', 'projectName projectCode');

    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
    res.json({ success: true, data: worker });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

exports.deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
    res.json({ success: true, message: 'Worker deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
