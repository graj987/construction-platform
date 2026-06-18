const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Expense = require('../models/Expense');
const Material = require('../models/Material');
const Salary = require('../models/Salary');
const Worker = require('../models/Worker');
const Project = require('../models/Project');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const toObjId = (id) => new mongoose.Types.ObjectId(id);

const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(id);

const monthRange = (year, month) => ({
  $gte: new Date(year, month - 1, 1),
  $lte: new Date(year, month, 0, 23, 59, 59),
});

const todayRange = () => {
  const now = new Date();
  return {
    $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    $lte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
  };
};

// ─── LIST / SEARCH / FILTER ───────────────────────────────────────────────────

exports.getExpenses = async (req, res) => {
  try {
    const {
      project,
      category,
      paymentMethod,
      from,
      to,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isDeleted: false };

    if (project) {
      if (!isValidId(project))
        return res.status(400).json({ success: false, message: 'Invalid project ID' });
      query.project = toObjId(project);
    }
    if (category) query.category = category;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(`${to}T23:59:59`);
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { description: { $regex: escaped, $options: 'i' } },
        { vendor: { $regex: escaped, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .populate('project', 'projectName projectCode')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Expense.countDocuments(query),
    ]);

    const totalAmount = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      data: expenses,
      total,
      totalAmount: totalAmount[0]?.sum || 0,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SINGLE EXPENSE ───────────────────────────────────────────────────────────

exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, isDeleted: false })
      .populate('project', 'projectName projectCode');
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CREATE ───────────────────────────────────────────────────────────────────

exports.createExpense = async (req, res) => {
  try {
    const body = { ...req.body };

    if (body.project === '' || body.project === 'null') delete body.project;
    if (body.amount) body.amount = Number(body.amount);

    // Attach uploaded bill if present
    if (req.file) {
      body.billImage = `/uploads/expenses/${req.file.filename}`;
      body.billOriginalName = req.file.originalname;
    }

    const expense = await Expense.create(body);
    await expense.populate('project', 'projectName projectCode');
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

exports.updateExpense = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.project === '' || body.project === 'null') body.project = null;
    if (body.amount) body.amount = Number(body.amount);

    if (req.file) {
      body.billImage = `/uploads/expenses/${req.file.filename}`;
      body.billOriginalName = req.file.originalname;
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      body,
      { new: true, runValidators: true }
    ).populate('project', 'projectName projectCode');

    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE BILL IMAGE ────────────────────────────────────────────────────────

exports.deleteBill = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, isDeleted: false });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    if (!expense.billImage) return res.status(400).json({ success: false, message: 'No bill attached' });

    // Remove file from disk
    const filePath = path.join(__dirname, '../../', expense.billImage);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    expense.billImage = null;
    expense.billOriginalName = null;
    await expense.save();

    res.json({ success: true, message: 'Bill removed', data: expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── EXPENSE DASHBOARD STATS ──────────────────────────────────────────────────

exports.getExpenseStats = async (req, res) => {
  try {
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();

    const baseMatch = { isDeleted: false };
    const todayMatch = { ...baseMatch, date: todayRange() };
    const monthMatch = { ...baseMatch, date: monthRange(thisYear, thisMonth) };

    // Last 6 months for trend
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalAll,
      todayTotal,
      monthTotal,
      byCategory,
      byProject,
      monthlyTrend,
      paymentMethodBreakdown,
    ] = await Promise.all([
      // All-time total
      Expense.aggregate([
        { $match: baseMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Today total
      Expense.aggregate([
        { $match: todayMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // This month total
      Expense.aggregate([
        { $match: monthMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // By category (this month)
      Expense.aggregate([
        { $match: monthMatch },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),

      // By project (this month, top 5)
      Expense.aggregate([
        { $match: { ...monthMatch, project: { $ne: null } } },
        { $group: { _id: '$project', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'projects',
            localField: '_id',
            foreignField: '_id',
            as: 'project',
          },
        },
        { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            total: 1,
            projectName: { $ifNull: ['$project.projectName', 'Unknown Project'] },
          },
        },
      ]),

      // Monthly trend (last 6 months)
      Expense.aggregate([
        {
          $match: {
            isDeleted: false,
            date: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // Payment method breakdown (this month)
      Expense.aggregate([
        { $match: monthMatch },
        { $group: { _id: '$paymentMethod', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedTrend = monthlyTrend.map(m => ({
      month: months[m._id.month - 1],
      year: m._id.year,
      total: m.total,
      count: m.count,
    }));

    res.json({
      success: true,
      data: {
        totalAll: totalAll[0]?.total || 0,
        todayTotal: todayTotal[0]?.total || 0,
        monthTotal: monthTotal[0]?.total || 0,
        byCategory,
        byProject,
        monthlyTrend: formattedTrend,
        paymentMethodBreakdown,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PROJECT COST BREAKDOWN ───────────────────────────────────────────────────
// Aggregates expenses + materials + labor for a single project

exports.getProjectCosts = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!isValidId(projectId))
      return res.status(400).json({ success: false, message: 'Invalid project ID' });

    const projObjId = toObjId(projectId);

    const project = await Project.findById(projObjId).lean();
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // 1. Direct expenses from Expense collection
    const [
      expenseAgg,
      expenseByCategory,
      materials,
      workers,
    ] = await Promise.all([
      // Total direct expenses
      Expense.aggregate([
        { $match: { project: projObjId, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Expenses by category for this project
      Expense.aggregate([
        { $match: { project: projObjId, isDeleted: false } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),

      // Materials for this project (purchase cost = purchased * pricePerUnit)
      Material.find({ project: projObjId }).lean(),

      // Workers assigned to this project
      Worker.find({ project: projObjId }).lean(),
    ]);

    const directExpenses = expenseAgg[0]?.total || 0;

    // 2. Material cost from Materials collection
    const materialCostByCategory = {};
    let totalMaterialCost = 0;
    materials.forEach(m => {
      const cost = m.totalCost || 0;
      materialCostByCategory[m.category] = (materialCostByCategory[m.category] || 0) + cost;
      totalMaterialCost += cost;
    });

    // 3. Labor cost from Salary records of workers on this project
    const workerIds = workers.map(w => w._id);
    let totalLaborCost = 0;
    let laborByWorker = [];

    if (workerIds.length > 0) {
      const salaryAgg = await Salary.aggregate([
        { $match: { worker: { $in: workerIds } } },
        {
          $group: {
            _id: '$worker',
            totalGross: { $sum: '$grossAmount' },
            totalPaid: { $sum: '$paidAmount' },
            workerName: { $first: '$workerName' },
          },
        },
        { $sort: { totalGross: -1 } },
      ]);

      totalLaborCost = salaryAgg.reduce((s, r) => s + (r.totalGross || 0), 0);
      laborByWorker = salaryAgg;
    }

    // 4. Totals
    const totalCost = directExpenses + totalMaterialCost + totalLaborCost;
    const remainingBudget = (project.budget || 0) - totalCost;
    const profit = (project.amountReceived || 0) - totalCost;
    const profitPercent = project.amountReceived
      ? parseFloat(((profit / project.amountReceived) * 100).toFixed(1))
      : 0;

    // Recent expenses for this project
    const recentExpenses = await Expense.find({ project: projObjId, isDeleted: false })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: {
        project,
        financials: {
          budget: project.budget || 0,
          amountReceived: project.amountReceived || 0,
          directExpenses,
          totalMaterialCost,
          totalLaborCost,
          totalCost,
          remainingBudget,
          profit,
          profitPercent,
          budgetUtilizationPercent: project.budget
            ? parseFloat(((totalCost / project.budget) * 100).toFixed(1))
            : 0,
        },
        expenseByCategory,
        materialCostByCategory,
        laborByWorker,
        recentExpenses,
        materialCount: materials.length,
        workerCount: workers.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PROFITABILITY — ALL PROJECTS ─────────────────────────────────────────────

exports.getProfitabilityReport = async (req, res) => {
  try {
    const projects = await Project.find().lean();

    // Aggregate expenses per project
    const expensesByProject = await Expense.aggregate([
      { $match: { isDeleted: false, project: { $ne: null } } },
      { $group: { _id: '$project', totalExpenses: { $sum: '$amount' } } },
    ]);

    // Aggregate material cost per project
    const materialByProject = await Material.aggregate([
      { $group: { _id: '$project', totalMaterial: { $sum: '$totalCost' } } },
    ]);

    // Workers per project and their salary sums
    const workersByProject = await Worker.find({ project: { $ne: null } })
      .select('_id project').lean();

    const salaryByWorker = await Salary.aggregate([
      { $group: { _id: '$worker', totalGross: { $sum: '$grossAmount' } } },
    ]);

    // Build lookup maps
    const expMap = {};
    expensesByProject.forEach(e => { expMap[e._id.toString()] = e.totalExpenses; });

    const matMap = {};
    materialByProject.forEach(m => { matMap[m._id?.toString()] = m.totalMaterial; });

    const salMap = {};
    salaryByWorker.forEach(s => { salMap[s._id.toString()] = s.totalGross; });

    // Map workers to projects
    const laborByProject = {};
    workersByProject.forEach(w => {
      const pid = w.project.toString();
      laborByProject[pid] = (laborByProject[pid] || 0) + (salMap[w._id.toString()] || 0);
    });

    const report = projects.map(p => {
      const pid = p._id.toString();
      const directExp = expMap[pid] || 0;
      const matCost = matMap[pid] || 0;
      const laborCost = laborByProject[pid] || 0;
      const totalCost = directExp + matCost + laborCost;
      const profit = (p.amountReceived || 0) - totalCost;
      const profitPercent = p.amountReceived
        ? parseFloat(((profit / p.amountReceived) * 100).toFixed(1))
        : 0;

      return {
        _id: p._id,
        projectName: p.projectName,
        projectCode: p.projectCode,
        status: p.status,
        budget: p.budget || 0,
        amountReceived: p.amountReceived || 0,
        directExpenses: directExp,
        materialCost: matCost,
        laborCost,
        totalCost,
        remainingBudget: (p.budget || 0) - totalCost,
        profit,
        profitPercent,
        isProfit: profit >= 0,
      };
    });

    // Sort by total cost descending
    report.sort((a, b) => b.totalCost - a.totalCost);

    const summary = {
      totalBudget: report.reduce((s, r) => s + r.budget, 0),
      totalReceived: report.reduce((s, r) => s + r.amountReceived, 0),
      totalCost: report.reduce((s, r) => s + r.totalCost, 0),
      totalProfit: report.reduce((s, r) => s + r.profit, 0),
      profitableProjects: report.filter(r => r.isProfit).length,
      lossProjects: report.filter(r => !r.isProfit).length,
    };

    res.json({ success: true, data: { projects: report, summary } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── REPORT — DAILY / MONTHLY ─────────────────────────────────────────────────

exports.getExpenseReport = async (req, res) => {
  try {
    const { type = 'monthly', year, month, week, project } = req.query;
    const now = new Date();

    let dateFilter = {};
    if (type === 'daily') {
      dateFilter = todayRange();
    } else if (type === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { $gte: startOfWeek, $lte: now };
    } else {
      // monthly
      const m = parseInt(month) || now.getMonth() + 1;
      const y = parseInt(year) || now.getFullYear();
      dateFilter = monthRange(y, m);
    }

    const match = { isDeleted: false, date: dateFilter };
    if (project && isValidId(project)) match.project = toObjId(project);

    const [expenses, byCategory, byPayment, dailyBreakdown] = await Promise.all([
      Expense.find(match)
        .populate('project', 'projectName')
        .sort({ date: -1 })
        .lean(),

      Expense.aggregate([
        { $match: match },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),

      Expense.aggregate([
        { $match: match },
        { $group: { _id: '$paymentMethod', total: { $sum: '$amount' } } },
      ]),

      Expense.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' },
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
    ]);

    const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);

    res.json({
      success: true,
      data: {
        expenses,
        totalAmount,
        count: expenses.length,
        byCategory,
        byPayment,
        dailyBreakdown,
        reportType: type,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
