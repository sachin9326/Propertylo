const express = require('express');
const router = express.Router();
const { savePreferences, getPreferences, getMatchScore, getMatchScoresBulk, getNegotiationAssist } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// Lifestyle quiz preferences
router.get('/preferences', protect, getPreferences);
router.post('/preferences', protect, savePreferences);

// Match scoring
router.post('/match-score', protect, getMatchScore);
router.post('/match-scores-bulk', protect, getMatchScoresBulk);

// Negotiation assistant
router.post('/negotiation', protect, getNegotiationAssist);

module.exports = router;
