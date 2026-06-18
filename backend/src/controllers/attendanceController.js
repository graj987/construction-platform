const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Worker = require('../models/Worker');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const dayBounds = (dateStr) => {
  const d = new Date(dateStr);
  return {
    start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0),
    end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59),
  };
};

// ─── GET ATTENDANCE ───────────────────────────────────────────────────────────
// Query by date, project, worker, or date range (month+year)

exports.getAttendance = async (req, res) => {
  try {
    const { date, project, worker, month, year } = req.query;
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
    if (date) {
      const { start, end } = dayBounds(date);
      query.date = { $gte: start, $lte: end };
    } else if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      if (isNaN(m) || isNaN(y))
        return res.status(400).json({ success: false, message: 'Invalid month or year' });
      query.date = {
        $gte: new Date(y, m - 1, 1),
        $lte: new Date(y, m, 0, 23, 59, 59),
      };
    }

    const records = await Attendance.find(query)
      .populate('worker', 'name role dailyRate')
      .populate('project', 'projectName')
      .sort({ date: -1, 'worker.name': 1 })
      .lean();

    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET DATE ATTENDANCE FOR PROJECT ─────────────────────────────────────────
// Returns workers assigned to a project with their attendance status for that date

exports.getProjectDayAttendance = async (req, res) => {
  try {
    const { projectId, date } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId))
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    if (!date)
      return res.status(400).json({ success: false, message: 'Date is required' });

    const { start, end } = dayBounds(date);

    // All workers assigned to this project
    const workers = await Worker.find({
      project: new mongoose.Types.ObjectId(projectId),
      isActive: true,
    }).sort({ name: 1 }).lean();

    // Existing attendance records for this project+date
    const existingRecords = await Attendance.find({
      project: new mongoose.Types.ObjectId(projectId),
      date: { $gte: start, $lte: end },
    }).lean();

    const recordMap = {};
    existingRecords.forEach(r => { recordMap[r.worker.toString()] = r; });

    // Merge: each worker gets their current status or default 'Present'
    const merged = workers.map(w => ({
      worker: w,
      attendance: recordMap[w._id.toString()] || null,
      status: recordMap[w._id.toString()]?.status || 'Present',
      overtimeHours: recordMap[w._id.toString()]?.overtimeHours || 0,
      notes: recordMap[w._id.toString()]?.notes || '',
      attendanceId: recordMap[w._id.toString()]?._id || null,
    }));

    res.json({
      success: true,
      data: merged,
      date,
      projectId,
      totalWorkers: workers.length,
      alreadySaved: existingRecords.length > 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── BULK MARK ATTENDANCE (for a project on a date) ──────────────────────────
// Receives: { projectId, date, records: [{ workerId, status, overtimeHours, notes }] }
// Uses upsert to avoid duplicates and handle re-saves correctly

exports.markAttendance = async (req, res) => {
  try {
    const { projectId, date, records } = req.body;

    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });
    if (!Array.isArray(records) || records.length === 0)
      return res.status(400).json({ success: false, message: 'records array is required' });

    const { start } = dayBounds(date);
    const normalizedDate = start; // store as midnight

    if (projectId && !mongoose.Types.ObjectId.isValid(projectId))
      return res.status(400).json({ success: false, message: 'Invalid project ID' });

    const ops = records.map(r => {
      if (!mongoose.Types.ObjectId.isValid(r.workerId))
        throw new Error(`Invalid worker ID: ${r.workerId}`);
      return {
        updateOne: {
          filter: { worker: new mongoose.Types.ObjectId(r.workerId), date: normalizedDate },
          update: {
            $set: {
              project: projectId ? new mongoose.Types.ObjectId(projectId) : null,
              status: r.status || 'Present',
              overtimeHours: Number(r.overtimeHours) || 0,
              notes: r.notes || '',
              date: normalizedDate,
              worker: new mongoose.Types.ObjectId(r.workerId),
            },
          },
          upsert: true,
        },
      };
    });

    const result = await Attendance.bulkWrite(ops);

    res.json({
      success: true,
      message: `Attendance saved for ${records.length} workers`,
      data: {
        matched: result.matchedCount,
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── UPDATE SINGLE ATTENDANCE RECORD ─────────────────────────────────────────

exports.updateAttendance = async (req, res) => {
  try {
    const { status, overtimeHours, notes } = req.body;
    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, overtimeHours: Number(overtimeHours) || 0, notes },
      { new: true, runValidators: true }
    ).populate('worker', 'name role');

    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── MONTHLY REPORT ───────────────────────────────────────────────────────────
// Returns per-worker summary for a given month/year (and optional project)

exports.getMonthlyReport = async (req, res) => {
  try {
    const { month, year, project } = req.query;
    const m = parseInt(month);
    const y = parseInt(year);

    if (isNaN(m) || isNaN(y))
      return res.status(400).json({ success: false, message: 'month and year are required' });

    const dateFilter = {
      $gte: new Date(y, m - 1, 1),
      $lte: new Date(y, m, 0, 23, 59, 59),
    };

    const workerQuery = { isActive: true };
    if (project && mongoose.Types.ObjectId.isValid(project)) {
      workerQuery.project = new mongoose.Types.ObjectId(project);
    }

    const [workers, attendanceRecords] = await Promise.all([
      Worker.find(workerQuery).populate('project', 'projectName').lean(),
      Attendance.find({
        date: dateFilter,
        ...(project && mongoose.Types.ObjectId.isValid(project)
          ? { project: new mongoose.Types.ObjectId(project) }
          : {}),
      }).lean(),
    ]);

    // Build a map: workerId -> { present, halfDay, absent, leave, overtime }
    // Guard against legacy attendance documents that used the old array-records format
    const attMap = {};
    attendanceRecords.forEach(a => {
      if (!a.worker) return; // skip any old-format documents
      const wid = a.worker.toString();
      if (!attMap[wid]) attMap[wid] = { present: 0, halfDay: 0, absent: 0, leave: 0, overtime: 0 };
      if (a.status === 'Present') attMap[wid].present++;
      else if (a.status === 'Half Day') attMap[wid].halfDay++;
      else if (a.status === 'Absent') attMap[wid].absent++;
      else if (a.status === 'Leave') attMap[wid].leave++;
      attMap[wid].overtime += a.overtimeHours || 0;
    });

    const report = workers.map(w => {
      const att = attMap[w._id.toString()] || { present: 0, halfDay: 0, absent: 0, leave: 0, overtime: 0 };
      const effectiveDays = att.present + att.halfDay * 0.5;
      return {
        worker: { _id: w._id, name: w.name, role: w.role, dailyRate: w.dailyRate, project: w.project },
        present: att.present,
        halfDay: att.halfDay,
        absent: att.absent,
        leave: att.leave,
        overtimeHours: att.overtime,
        effectiveDays,
        grossAmount: parseFloat((effectiveDays * w.dailyRate).toFixed(2)),
      };
    });

    const totalCost = report.reduce((s, r) => s + r.grossAmount, 0);

    res.json({ success: true, data: report, totalCost, month: m, year: y });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
