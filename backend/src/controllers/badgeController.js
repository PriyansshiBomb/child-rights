const Badge = require('../models/Badge');
const Progress = require('../models/Progress');

// GET all badges (with earned status for current user)
const getAllBadges = async (req, res) => {
  try {
    const allBadges = await Badge.find({});

    const progress = await Progress.findOne({ userId: req.user._id });
    const earnedBadgeIds = progress
      ? progress.badgesEarned.map(b => b.badgeId.toString())
      : [];

    const badgesWithStatus = allBadges.map(badge => ({
      id: badge._id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      xpReward: badge.xpReward,
      earned: earnedBadgeIds.includes(badge._id.toString())
    }));

    res.json({ success: true, badges: badgesWithStatus });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching badges', error: error.message });
  }
};

module.exports = { getAllBadges };