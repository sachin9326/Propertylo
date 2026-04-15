const express = require('express');
const router = express.Router();
const { getAvailableSlots, bookVisit, getMyVisits, cancelVisit } = require('../controllers/visitController');
const { protect } = require('../middleware/authMiddleware');

router.get('/slots/:propertyId', getAvailableSlots);
router.post('/book', protect, bookVisit);
router.get('/my', protect, getMyVisits);
router.put('/cancel/:id', protect, cancelVisit);

module.exports = router;
