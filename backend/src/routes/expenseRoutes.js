const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ctrl = require('../controllers/expenseController');

// ─── Multer — bill / receipt upload ──────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/expenses'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `bill-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, WebP and PDF files are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// Stats & aggregations (must be before /:id routes)
router.get('/stats', ctrl.getExpenseStats);
router.get('/report', ctrl.getExpenseReport);
router.get('/profitability', ctrl.getProfitabilityReport);
router.get('/project/:projectId/costs', ctrl.getProjectCosts);

// CRUD
router.get('/', ctrl.getExpenses);
router.get('/:id', ctrl.getExpenseById);
router.post('/', upload.single('bill'), ctrl.createExpense);
router.put('/:id', upload.single('bill'), ctrl.updateExpense);
router.delete('/:id', ctrl.deleteExpense);
router.delete('/:id/bill', ctrl.deleteBill);

module.exports = router;
