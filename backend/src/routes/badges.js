const express = require('express');
const router = express.Router();
const { getAllBadges } = require('../controllers/badgeController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAllBadges);

module.exports = router;