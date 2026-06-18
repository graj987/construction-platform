const Client = require('../models/Client');
const Project = require('../models/Project');
const Worker = require('../models/Worker');
const Quotation = require('../models/Quotation');
const Expense = require('../models/Expense');
const Salary = require('../models/Salary');
const Payment = require('../models/Payment');
const Milestone = require('../models/Milestone');

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();
    const monthStart = new Date(thisYear, thisMonth - 1, 1);
    const monthEnd   = new Date(thisYear, thisMonth, 0, 23, 59, 59);

    const [
      totalClients,
      activeProjects,
      totalWorkers,
      pendingQuotations,
      clientGrowth,
      projectStatusStats,
      recentClients,
      recentProjects,
      totalExpensesMonth,
      totalExpensesAll,
      pendingSalary,
      // Payment stats
      totalReceivedAll,
      monthReceived,
      pendingReceivables,
      overdueCount,
    ] = await Promise.all([
      Client.countDocuments(),
      Project.countDocuments({ status: { $nin: ['Completed', 'On Hold'] } }),
      Worker.countDocuments({ isActive: true }),
      Quotation.countDocuments({ status: { $in: ['Draft', 'Sent'] } }),

      Client.aggregate([
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),
      Project.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Client.find().sort({ createdAt: -1 }).limit(5),
      Project.find().sort({ createdAt: -1 }).limit(5),

      Expense.aggregate([
        { $match: { isDeleted: false, date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Salary.aggregate([
        { $match: { isPaid: false } },
        { $group: { _id: null, total: { $sum: '$finalPayable' } } },
      ]),

      // Total payments received (all time)
      Payment.aggregate([
        { $match: { status: 'Received', isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // This month payments received
      Payment.aggregate([
        { $match: { status: 'Received', isDeleted: false, paymentDate: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Pending receivables (budget - received across active projects)
      Project.aggregate([
        { $match: { status: { $nin: ['Cancelled'] } } },
        { $group: { _id: null, totalBudget: { $sum: '$budget' }, totalReceived: { $sum: '$amountReceived' } } },
      ]),
      // Overdue milestones
      Milestone.countDocuments({ status: 'Overdue' }),
    ]);

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    res.json({
      success: true,
      data: {
        stats: {
          totalClients,
          activeProjects,
          totalWorkers,
          pendingQuotations,
          monthExpenses:   totalExpensesMonth[0]?.total || 0,
          totalExpenses:   totalExpensesAll[0]?.total   || 0,
          pendingSalary:   pendingSalary[0]?.total      || 0,
          totalReceivedAll: totalReceivedAll[0]?.total  || 0,
          monthReceived:   monthReceived[0]?.total      || 0,
          pendingReceivables: Math.max(0,
            (pendingReceivables[0]?.totalBudget || 0) - (pendingReceivables[0]?.totalReceived || 0)
          ),
          overdueCount,
          // Net cash balance
          cashBalance: (totalReceivedAll[0]?.total || 0) - (totalExpensesAll[0]?.total || 0),
        },
        clientGrowth: clientGrowth.map(g => ({ month: months[g._id.month - 1], clients: g.count })),
        projectStatus: projectStatusStats,
        recentClients,
        recentProjects,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
