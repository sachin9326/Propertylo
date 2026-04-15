const express = require('express');
const router = express.Router();
const { getReviews, createReview, flagReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getReviews);
router.post('/', protect, createReview);
router.put('/flag/:id', protect, flagReview);

module.exports = router;
