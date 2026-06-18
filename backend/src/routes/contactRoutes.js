const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/contactController');

router.post('/', ctrl.submitContact);
router.get('/', ctrl.getAllContacts);
router.put('/:id/read', ctrl.markRead);
router.post('/:id/convert', ctrl.convertToClient);

module.exports = router;
