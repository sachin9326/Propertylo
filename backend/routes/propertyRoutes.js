const express = require('express');
const router = express.Router();
const { getProperties, getPropertyById, createProperty } = require('../controllers/propertyController');
const { protect, uploaderOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getProperties)
  .post(protect, upload.array('media', 10), createProperty);

router.route('/:id').get(getPropertyById);

module.exports = router;
