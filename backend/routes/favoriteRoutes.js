const express = require('express');
const router = express.Router();
const { getFavorites, toggleFavorite, checkFavorite, getDashboardStats } = require('../controllers/favoriteController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getFavorites);
router.post('/:propertyId', protect, toggleFavorite);
router.get('/check/:propertyId', protect, checkFavorite);
router.get('/dashboard/stats', protect, getDashboardStats);

module.exports = router;
