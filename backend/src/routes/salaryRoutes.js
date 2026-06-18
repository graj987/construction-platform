const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/salaryController');

router.get('/', ctrl.getAllSalaries);
router.get('/preview', ctrl.previewSalary);
router.post('/', ctrl.calculateSalary);
router.put('/:id', ctrl.updateSalary);
router.put('/:id/pay', ctrl.markPaid);
router.delete('/:id', ctrl.deleteSalary);

module.exports = router;
