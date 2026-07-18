const express = require('express');
const router = express.Router();
const certController = require('../controllers/certController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Config for Certificate file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'cert-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

router.post('/', auth, upload.single('file'), certController.createCertificate);
router.get('/', auth, certController.getCertificates);
router.put('/:id', auth, upload.single('file'), certController.updateCertificate);
router.delete('/:id', auth, certController.deleteCertificate);

module.exports = router;
