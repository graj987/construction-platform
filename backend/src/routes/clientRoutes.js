const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/clientController');

router.get('/', ctrl.getAllClients);
router.get('/stats', ctrl.getClientStats);
router.get('/:id', ctrl.getClientById);
router.post('/', ctrl.createClient);
router.put('/:id', ctrl.updateClient);
router.delete('/:id', ctrl.deleteClient);

module.exports = router;
