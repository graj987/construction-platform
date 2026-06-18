const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/materialController');

router.get('/', ctrl.getMaterials);
router.get('/summary', ctrl.getMaterialSummary);
router.post('/', ctrl.createMaterial);
router.put('/:id', ctrl.updateMaterial);
router.delete('/:id', ctrl.deleteMaterial);

module.exports = router;
