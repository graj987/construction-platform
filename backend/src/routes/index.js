const express = require('express');
const router = express.Router();

router.use('/clients',    require('./clientRoutes'));
router.use('/projects',   require('./projectRoutes'));
router.use('/workers',    require('./workerRoutes'));
router.use('/advances',   require('./advanceRoutes'));
router.use('/attendance', require('./attendanceRoutes'));
router.use('/salary',     require('./salaryRoutes'));
router.use('/materials',  require('./materialRoutes'));
router.use('/expenses',   require('./expenseRoutes'));
router.use('/payments',   require('./paymentRoutes'));
router.use('/milestones', require('./milestoneRoutes'));
router.use('/quotations', require('./quotationRoutes'));
router.use('/diary',      require('./diaryRoutes'));
router.use('/contact',    require('./contactRoutes'));
router.use('/planner',    require('./plannerRoutes'));
router.use('/dashboard',  require('./dashboardRoutes'));

module.exports = router;
