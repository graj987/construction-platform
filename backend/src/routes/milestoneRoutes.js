const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/milestoneController');

router.get('/',     ctrl.getMilestones);
router.post('/',    ctrl.createMilestone);
router.put('/:id',  ctrl.updateMilestone);
router.delete('/:id', ctrl.deleteMilestone);

module.exports = router;
