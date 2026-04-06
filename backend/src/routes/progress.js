const express = require('express');
const router = express.Router();
const { getMyProgress, saveProgress, getChildProgress } = require('../controllers/progressController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roles');

router.get('/me', protect, getMyProgress);
router.post('/save', protect, saveProgress);
router.get('/child/:childId', protect, getChildProgress);

module.exports = router;