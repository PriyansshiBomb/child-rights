const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const { protect } = require('../middleware/auth');

// GET top 10 players by XP
router.get('/', protect, async (req, res) => {
  try {
    const leaderboard = await Progress.find({})
      .sort({ xp: -1 })           // Highest XP first
      .limit(10)
      .populate('userId', 'username avatar role')
      .select('xp level totalZonesCompleted userId');

    // Filter out non-child accounts from leaderboard
    const childLeaderboard = leaderboard
      .filter(entry => entry.userId && entry.userId.role === 'child')
      .map((entry, index) => ({
        rank: index + 1,
        username: entry.userId.username,
        avatar: entry.userId.avatar,
        xp: entry.xp,
        level: entry.level,
        zonesCompleted: entry.totalZonesCompleted,
        userId: entry.userId._id
      }));

    res.json({ success: true, leaderboard: childLeaderboard });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
  }
});

module.exports = router;