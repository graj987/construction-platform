const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/quotationController');

router.get('/', ctrl.getQuotations);
router.get('/rates', ctrl.getRates);
router.get('/:id', ctrl.getQuotationById);
router.post('/generate', ctrl.generateQuotation);
router.put('/:id', ctrl.updateQuotation);

module.exports = router;
