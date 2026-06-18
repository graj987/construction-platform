const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/diaryController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/diary'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', ctrl.getDiaryEntries);
router.post('/', upload.array('photos', 5), ctrl.createDiaryEntry);
router.put('/:id', ctrl.updateDiaryEntry);
router.delete('/:id', ctrl.deleteDiaryEntry);

module.exports = router;
