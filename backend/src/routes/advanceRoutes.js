const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/advanceController');

router.get('/', ctrl.getAdvances);
router.get('/worker/:workerId/summary', ctrl.getWorkerAdvanceSummary);
router.post('/', ctrl.createAdvance);
router.put('/:id', ctrl.updateAdvance);
router.delete('/:id', ctrl.deleteAdvance);

module.exports = router;
