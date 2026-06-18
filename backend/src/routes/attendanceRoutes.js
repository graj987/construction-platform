const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attendanceController');

router.get('/', ctrl.getAttendance);
router.get('/monthly-report', ctrl.getMonthlyReport);
router.get('/project/:projectId/date/:date', ctrl.getProjectDayAttendance);
router.post('/', ctrl.markAttendance);
router.put('/:id', ctrl.updateAttendance);

module.exports = router;
