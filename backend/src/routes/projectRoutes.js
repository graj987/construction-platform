const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/projectController');

router.get('/', ctrl.getAllProjects);
router.get('/stats', ctrl.getProjectStats);
router.get('/:id', ctrl.getProjectById);
router.post('/', ctrl.createProject);
router.put('/:id', ctrl.updateProject);
router.delete('/:id', ctrl.deleteProject);

module.exports = router;
