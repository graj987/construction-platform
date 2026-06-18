const mongoose = require('mongoose');
const Salary = require('../models/Salary');
const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');
const Advance = require('../models/Advance');

// ─── LIST SALARIES ────────────────────────────────────────────────────────────

exports.getAllSalaries = async (req, res) => {
  try {
    const { month, year, worker, isPaid } = req.query;
    const query = {};
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (worker) query.worker = worker;
    if (isPaid !== undefined) query.isPaid = isPaid === 'true';

    const salaries = await Salary.find(query)
      .populate('worker', 'name role dailyRate')
      .sort({ year: -1, month: -1, workerName: 1 })
      .lean();

    const totalPayable = salaries.reduce((s, r) => s + (r.finalPayable || 0), 0);
    const totalPaid = salaries.filter(s => s.isPaid).reduce((s, r) => s + (r.paidAmount || 0), 0);

    res.json({ success: true, data: salaries, totalPayable, totalPaid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── AUTO-CALCULATE SALARY FROM ATTENDANCE ────────────────────────────────────
// Pulls attendance records + pending advances for worker/month/year
// Creates or overwrites the salary record

exports.calculateSalary = async (req, res) => {
  try {
    const { worker: workerId, month, year, otherDeductions, deductionNotes, notes } = req.body;

    if (!workerId || !mongoose.Types.ObjectId.isValid(workerId))
      return res.status(400).json({ success: false, message: 'Valid worker ID is required' });
    const m = parseInt(month);
    const y = parseInt(year);
    if (isNaN(m) || m < 1 || m > 12)
      return res.status(400).json({ success: false, message: 'Valid month (1-12) is required' });
    if (isNaN(y))
      return res.status(400).json({ success: false, message: 'Valid year is required' });

    const workerDoc = await Worker.findById(workerId);
    if (!workerDoc) return res.status(404).json({ success: false, message: 'Worker not found' });

    const dateFilter = {
      $gte: new Date(y, m - 1, 1),
      $lte: new Date(y, m, 0, 23, 59, 59),
    };

    // Pull attendance for this worker this month
    const attendanceRecords = await Attendance.find({
      worker: new mongoose.Types.ObjectId(workerId),
      date: dateFilter,
    }).lean();

    // Count statuses
    const daysPresent = attendanceRecords.filter(a => a.status === 'Present').length;
    const daysHalfDay = attendanceRecords.filter(a => a.status === 'Half Day').length;
    const daysAbsent = attendanceRecords.filter(a => a.status === 'Absent').length;
    const daysLeave = attendanceRecords.filter(a => a.status === 'Leave').length;
    const overtimeHours = attendanceRecords.reduce((s, a) => s + (a.overtimeHours || 0), 0);

    // Pull advances for this month that haven't been deducted yet
    const pendingAdvances = await Advance.find({
      worker: new mongoose.Types.ObjectId(workerId),
      date: dateFilter,
      deductedInSalary: null,
    }).lean();

    const totalAdvance = pendingAdvances.reduce((s, a) => s + a.amount, 0);
    const advanceIds = pendingAdvances.map(a => a._id);

    const payload = {
      worker: workerId,
      workerName: workerDoc.name,
      month: m,
      year: y,
      daysPresent,
      daysHalfDay,
      daysAbsent,
      daysLeave,
      overtimeHours,
      dailyRate: workerDoc.dailyRate,
      totalAdvance,
      otherDeductions: Number(otherDeductions) || 0,
      deductionNotes: deductionNotes || '',
      notes: notes || '',
      advancesDeducted: advanceIds,
    };

    // Upsert: update existing record or create new
    const existing = await Salary.findOne({ worker: workerId, month: m, year: y });
    let salary;
    if (existing) {
      Object.assign(existing, payload);
      salary = await existing.save(); // triggers pre-save hook for calculations
    } else {
      salary = new Salary(payload);
      await salary.save();
    }

    // Mark those advances as deducted
    if (advanceIds.length > 0) {
      await Advance.updateMany(
        { _id: { $in: advanceIds } },
        { $set: { deductedInSalary: salary._id } }
      );
    }

    await salary.populate('worker', 'name role');
    res.status(201).json({ success: true, data: salary });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Salary record for this month already exists. Use update instead.' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── MARK PAID ────────────────────────────────────────────────────────────────

exports.markPaid = async (req, res) => {
  try {
    const { paymentMode, paidAmount } = req.body;
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found' });

    salary.isPaid = true;
    salary.paidDate = new Date();
    salary.paymentMode = paymentMode || 'Cash';
    salary.paidAmount = Number(paidAmount) || salary.finalPayable;
    await salary.save();

    await salary.populate('worker', 'name role');
    res.json({ success: true, data: salary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UPDATE SALARY (for manual adjustments) ──────────────────────────────────

exports.updateSalary = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found' });

    const allowed = ['otherDeductions', 'deductionNotes', 'notes', 'totalAdvance'];
    allowed.forEach(k => {
      if (req.body[k] !== undefined) salary[k] = req.body[k];
    });
    if (req.body.otherDeductions !== undefined)
      salary.otherDeductions = Number(req.body.otherDeductions);

    await salary.save(); // triggers pre-save recalculation
    await salary.populate('worker', 'name role');
    res.json({ success: true, data: salary });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── DELETE SALARY ────────────────────────────────────────────────────────────

exports.deleteSalary = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found' });

    // Unmark any advances that were deducted in this salary
    if (salary.advancesDeducted?.length) {
      await Advance.updateMany(
        { _id: { $in: salary.advancesDeducted } },
        { $set: { deductedInSalary: null } }
      );
    }

    await Salary.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Salary record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SALARY PREVIEW (no DB write) ────────────────────────────────────────────

exports.previewSalary = async (req, res) => {
  try {
    const { worker: workerId, month, year } = req.query;
    if (!workerId || !mongoose.Types.ObjectId.isValid(workerId))
      return res.status(400).json({ success: false, message: 'Valid worker ID is required' });

    const m = parseInt(month);
    const y = parseInt(year);
    if (isNaN(m) || isNaN(y))
      return res.status(400).json({ success: false, message: 'month and year are required' });

    const workerDoc = await Worker.findById(workerId).lean();
    if (!workerDoc) return res.status(404).json({ success: false, message: 'Worker not found' });

    const dateFilter = {
      $gte: new Date(y, m - 1, 1),
      $lte: new Date(y, m, 0, 23, 59, 59),
    };

    const [attendanceRecords, pendingAdvances] = await Promise.all([
      Attendance.find({ worker: new mongoose.Types.ObjectId(workerId), date: dateFilter }).lean(),
      Advance.find({ worker: new mongoose.Types.ObjectId(workerId), date: dateFilter, deductedInSalary: null }).lean(),
    ]);

    const daysPresent = attendanceRecords.filter(a => a.status === 'Present').length;
    const daysHalfDay = attendanceRecords.filter(a => a.status === 'Half Day').length;
    const daysAbsent = attendanceRecords.filter(a => a.status === 'Absent').length;
    const daysLeave = attendanceRecords.filter(a => a.status === 'Leave').length;
    const effectiveDays = daysPresent + daysHalfDay * 0.5;
    const grossAmount = parseFloat((effectiveDays * workerDoc.dailyRate).toFixed(2));
    const totalAdvance = pendingAdvances.reduce((s, a) => s + a.amount, 0);
    const finalPayable = Math.max(0, parseFloat((grossAmount - totalAdvance).toFixed(2)));

    res.json({
      success: true,
      data: {
        worker: { name: workerDoc.name, role: workerDoc.role, dailyRate: workerDoc.dailyRate },
        month: m, year: y,
        daysPresent, daysHalfDay, daysAbsent, daysLeave,
        effectiveDays, grossAmount, totalAdvance, finalPayable,
        attendanceCount: attendanceRecords.length,
        pendingAdvanceCount: pendingAdvances.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
