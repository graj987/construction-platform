const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Payment = require('../models/Payment');
const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const Client = require('../models/Client');
const Expense = require('../models/Expense');
const Material = require('../models/Material');
const Salary = require('../models/Salary');
const Worker = require('../models/Worker');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const toObjId = (id) => new mongoose.Types.ObjectId(id);
const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(id);

const monthRange = (year, month) => ({
  $gte: new Date(year, month - 1, 1),
  $lte: new Date(year, month, 0, 23, 59, 59),
});

const todayStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// ─── LIST / SEARCH / FILTER ───────────────────────────────────────────────────

exports.getPayments = async (req, res) => {
  try {
    const {
      project, client, status, paymentMethod,
      from, to, search, page = 1, limit = 20,
    } = req.query;

    const query = { isDeleted: false };

    if (project) {
      if (!isValidId(project)) return res.status(400).json({ success: false, message: 'Invalid project ID' });
      query.project = toObjId(project);
    }
    if (client) {
      if (!isValidId(client)) return res.status(400).json({ success: false, message: 'Invalid client ID' });
      query.client = toObjId(client);
    }
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (from || to) {
      query.paymentDate = {};
      if (from) query.paymentDate.$gte = new Date(from);
      if (to)   query.paymentDate.$lte = new Date(`${to}T23:59:59`);
    }
    if (search) {
      const esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { transactionId: { $regex: esc, $options: 'i' } },
        { remarks: { $regex: esc, $options: 'i' } },
        { receivedBy: { $regex: esc, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total, amountAgg] = await Promise.all([
      Payment.find(query)
        .populate('project', 'projectName projectCode')
        .populate('client', 'name phone')
        .populate('milestone', 'title')
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Payment.countDocuments(query),
      Payment.aggregate([
        { $match: { ...query, status: 'Received' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: payments,
      total,
      totalReceived: amountAgg[0]?.total || 0,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SINGLE PAYMENT ───────────────────────────────────────────────────────────

exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, isDeleted: false })
      .populate('project', 'projectName projectCode budget')
      .populate('client', 'name phone')
      .populate('milestone', 'title expectedAmount');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CREATE ───────────────────────────────────────────────────────────────────

exports.createPayment = async (req, res) => {
  try {
    const body = { ...req.body };
    if (!isValidId(body.project))
      return res.status(400).json({ success: false, message: 'Valid project ID is required' });
    if (!body.amount || Number(body.amount) <= 0)
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });

    body.amount = Number(body.amount);
    if (body.client === '' || body.client === 'null') delete body.client;
    if (body.milestone === '' || body.milestone === 'null') delete body.milestone;

    if (req.file) {
      body.receiptImage = `/uploads/receipts/${req.file.filename}`;
      body.receiptOriginalName = req.file.originalname;
    }

    const payment = await Payment.create(body);

    // If linked to a milestone, update its receivedAmount
    if (payment.milestone && payment.status === 'Received') {
      const allPaymentsForMilestone = await Payment.aggregate([
        { $match: { milestone: payment.milestone, status: 'Received', isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      await Milestone.findByIdAndUpdate(payment.milestone, {
        receivedAmount: allPaymentsForMilestone[0]?.total || 0,
      });
    }

    await payment.populate([
      { path: 'project', select: 'projectName projectCode' },
      { path: 'client', select: 'name phone' },
    ]);

    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

exports.updatePayment = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.amount) body.amount = Number(body.amount);
    if (body.client === '' || body.client === 'null') body.client = null;
    if (body.milestone === '' || body.milestone === 'null') body.milestone = null;

    if (req.file) {
      body.receiptImage = `/uploads/receipts/${req.file.filename}`;
      body.receiptOriginalName = req.file.originalname;
    }

    const payment = await Payment.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      body,
      { new: true, runValidators: true }
    ).populate('project', 'projectName projectCode')
      .populate('client', 'name phone')
      .populate('milestone', 'title');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    // Re-sync milestone
    if (payment.milestone) {
      const milestonePayments = await Payment.aggregate([
        { $match: { milestone: payment.milestone, status: 'Received', isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      await Milestone.findByIdAndUpdate(payment.milestone, {
        receivedAmount: milestonePayments[0]?.total || 0,
      });
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── SOFT DELETE ─────────────────────────────────────────────────────────────

exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    // Re-sync project amountReceived
    const agg = await Payment.aggregate([
      { $match: { project: payment.project, status: 'Received', isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    await Project.findByIdAndUpdate(payment.project, { amountReceived: agg[0]?.total || 0 });

    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE RECEIPT IMAGE ─────────────────────────────────────────────────────

exports.deleteReceipt = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, isDeleted: false });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (!payment.receiptImage) return res.status(400).json({ success: false, message: 'No receipt attached' });

    const filePath = path.join(__dirname, '../../', payment.receiptImage);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    payment.receiptImage = null;
    payment.receiptOriginalName = null;
    await payment.save();
    res.json({ success: true, message: 'Receipt removed', data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PAYMENT STATS (dashboard cards) ─────────────────────────────────────────

exports.getPaymentStats = async (req, res) => {
  try {
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();
    const monthFilter = monthRange(thisYear, thisMonth);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalReceivedAll,
      monthReceived,
      todayReceived,
      totalPending,
      overdueCount,
      recentPayments,
      byMethod,
      monthlyTrend,
    ] = await Promise.all([
      // All-time received
      Payment.aggregate([
        { $match: { status: 'Received', isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // This month received
      Payment.aggregate([
        { $match: { status: 'Received', isDeleted: false, paymentDate: monthFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Today received
      Payment.aggregate([
        {
          $match: {
            status: 'Received', isDeleted: false,
            paymentDate: {
              $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              $lte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Total pending from projects (budget - received)
      Project.aggregate([
        { $match: { status: { $nin: ['Completed'] } } },
        {
          $group: {
            _id: null,
            totalBudget: { $sum: '$budget' },
            totalReceived: { $sum: '$amountReceived' },
          },
        },
      ]),

      // Overdue milestones count
      Milestone.countDocuments({ status: 'Overdue' }),

      // Recent 5 payments
      Payment.find({ isDeleted: false, status: 'Received' })
        .populate('project', 'projectName')
        .populate('client', 'name')
        .sort({ paymentDate: -1 })
        .limit(5)
        .lean(),

      // By payment method (this month)
      Payment.aggregate([
        { $match: { status: 'Received', isDeleted: false, paymentDate: monthFilter } },
        { $group: { _id: '$paymentMethod', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),

      // Monthly received trend (last 6 months)
      Payment.aggregate([
        {
          $match: {
            status: 'Received', isDeleted: false,
            paymentDate: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const pendingAmount = Math.max(0,
      (totalPending[0]?.totalBudget || 0) - (totalPending[0]?.totalReceived || 0)
    );

    res.json({
      success: true,
      data: {
        totalReceivedAll: totalReceivedAll[0]?.total || 0,
        monthReceived: monthReceived[0]?.total || 0,
        todayReceived: todayReceived[0]?.total || 0,
        pendingAmount,
        overdueCount,
        recentPayments,
        byMethod,
        monthlyTrend: monthlyTrend.map(m => ({
          month: monthNames[m._id.month - 1],
          year: m._id.year,
          received: m.total,
          count: m.count,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CASH FLOW (payments in vs expenses out) ──────────────────────────────────

exports.getCashFlow = async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [incomeByMonth, expenseByMonth] = await Promise.all([
      Payment.aggregate([
        {
          $match: {
            status: 'Received', isDeleted: false,
            paymentDate: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } },
            cashIn: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Expense.aggregate([
        {
          $match: {
            isDeleted: false,
            date: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' } },
            cashOut: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    // Merge into month-keyed map
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const map = {};

    incomeByMonth.forEach(m => {
      const key = `${m._id.year}-${m._id.month}`;
      if (!map[key]) map[key] = { month: monthNames[m._id.month - 1], year: m._id.year, cashIn: 0, cashOut: 0 };
      map[key].cashIn = m.cashIn;
    });
    expenseByMonth.forEach(m => {
      const key = `${m._id.year}-${m._id.month}`;
      if (!map[key]) map[key] = { month: monthNames[m._id.month - 1], year: m._id.year, cashIn: 0, cashOut: 0 };
      map[key].cashOut = m.cashOut;
    });

    const trend = Object.values(map)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
      })
      .map(m => ({ ...m, net: m.cashIn - m.cashOut }));

    // All-time totals
    const [totalCashIn, totalCashOut] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'Received', isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const cashIn  = totalCashIn[0]?.total  || 0;
    const cashOut = totalCashOut[0]?.total || 0;

    res.json({
      success: true,
      data: {
        cashIn,
        cashOut,
        netCashFlow: cashIn - cashOut,
        trend,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CLIENT RECEIVABLES ───────────────────────────────────────────────────────

exports.getReceivables = async (req, res) => {
  try {
    // Aggregate payment received per client
    const receivedByClient = await Payment.aggregate([
      { $match: { status: 'Received', isDeleted: false, client: { $ne: null } } },
      { $group: { _id: '$client', totalReceived: { $sum: '$amount' }, lastPayment: { $max: '$paymentDate' } } },
    ]);

    // All projects with their budget and client
    const projects = await Project.find({ budget: { $gt: 0 } })
      .populate('client', 'name phone location')
      .lean();

    // Build per-client summary from projects
    const clientMap = {};
    projects.forEach(p => {
      const cid = p.client?._id?.toString() || 'no-client';
      if (cid === 'no-client') return;
      if (!clientMap[cid]) {
        clientMap[cid] = {
          client: p.client,
          totalBudget: 0,
          totalReceived: 0,
          lastPayment: null,
          projectCount: 0,
          projects: [],
        };
      }
      clientMap[cid].totalBudget   += p.budget || 0;
      clientMap[cid].totalReceived += p.amountReceived || 0;
      clientMap[cid].projectCount  += 1;
      clientMap[cid].projects.push({ _id: p._id, projectName: p.projectName, budget: p.budget, amountReceived: p.amountReceived });
    });

    // Override received from Payment records (more accurate)
    receivedByClient.forEach(r => {
      const cid = r._id.toString();
      if (clientMap[cid]) {
        clientMap[cid].totalReceived = r.totalReceived;
        clientMap[cid].lastPayment   = r.lastPayment;
      }
    });

    const receivables = Object.values(clientMap).map(c => ({
      ...c,
      pendingAmount: Math.max(0, c.totalBudget - c.totalReceived),
      collectionPercent: c.totalBudget > 0
        ? parseFloat(((c.totalReceived / c.totalBudget) * 100).toFixed(1))
        : 0,
    })).sort((a, b) => b.pendingAmount - a.pendingAmount);

    const summary = {
      totalBudget:   receivables.reduce((s, r) => s + r.totalBudget, 0),
      totalReceived: receivables.reduce((s, r) => s + r.totalReceived, 0),
      totalPending:  receivables.reduce((s, r) => s + r.pendingAmount, 0),
      clientsWithBalance: receivables.filter(r => r.pendingAmount > 0).length,
    };

    // Overdue milestones with client context
    const overdueMilestones = await Milestone.find({ status: 'Overdue' })
      .populate({ path: 'project', select: 'projectName client', populate: { path: 'client', select: 'name phone' } })
      .sort({ dueDate: 1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      data: { receivables, summary, overdueMilestones },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PROJECT PAYMENT SUMMARY ──────────────────────────────────────────────────

exports.getProjectPayments = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!isValidId(projectId))
      return res.status(400).json({ success: false, message: 'Invalid project ID' });

    const projObjId = toObjId(projectId);

    const [project, payments, milestones, receivedAgg] = await Promise.all([
      Project.findById(projObjId).populate('client', 'name phone').lean(),
      Payment.find({ project: projObjId, isDeleted: false })
        .populate('client', 'name')
        .populate('milestone', 'title')
        .sort({ paymentDate: -1 })
        .lean(),
      Milestone.find({ project: projObjId }).sort({ sortOrder: 1 }).lean(),
      Payment.aggregate([
        { $match: { project: projObjId, status: 'Received', isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const totalReceived = receivedAgg[0]?.total || 0;
    const pendingAmount = Math.max(0, (project.budget || 0) - totalReceived);
    const lastPayment   = payments[0]?.paymentDate || null;

    res.json({
      success: true,
      data: {
        project,
        payments,
        milestones,
        summary: {
          budget: project.budget || 0,
          totalReceived,
          pendingAmount,
          lastPayment,
          collectionPercent: project.budget
            ? parseFloat(((totalReceived / project.budget) * 100).toFixed(1))
            : 0,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
