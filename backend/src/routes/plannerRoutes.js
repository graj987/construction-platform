const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/plannerController');

router.post('/generate',    ctrl.generatePlan);
router.post('/ai-generate', ctrl.generateAIPlan);
router.post('/chat',        ctrl.chatWithPlanner);
router.post('/calculate-cost', ctrl.calculateCost);
router.get('/reports',      ctrl.getPlanningReports);

module.exports = router;
