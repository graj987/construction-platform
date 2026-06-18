const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/workerController');

router.get('/stats', ctrl.getWorkerStats);
router.get('/', ctrl.getAllWorkers);
router.get('/:id/profile', ctrl.getWorkerProfile);
router.get('/:id', ctrl.getWorkerById);
router.get('/project/:projectId', ctrl.getWorkersByProject);
router.post('/', ctrl.createWorker);
router.put('/:id', ctrl.updateWorker);
router.delete('/:id', ctrl.deleteWorker);

module.exports = router;
