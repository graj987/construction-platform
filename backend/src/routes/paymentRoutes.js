const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ctrl = require('../controllers/paymentController');

// ── Multer: receipt upload ──────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/receipts'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `receipt-${Date.now()}${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  const ok = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (ok.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, WebP and PDF allowed'), false);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Aggregation routes (before /:id) ────────────────────────────────────────
router.get('/stats',                       ctrl.getPaymentStats);
router.get('/cash-flow',                   ctrl.getCashFlow);
router.get('/receivables',                 ctrl.getReceivables);
router.get('/project/:projectId',          ctrl.getProjectPayments);

// ── CRUD ────────────────────────────────────────────────────────────────────
router.get('/',        ctrl.getPayments);
router.get('/:id',     ctrl.getPaymentById);
router.post('/',       upload.single('receipt'), ctrl.createPayment);
router.put('/:id',     upload.single('receipt'), ctrl.updatePayment);
router.delete('/:id',          ctrl.deletePayment);
router.delete('/:id/receipt',  ctrl.deleteReceipt);

module.exports = router;
