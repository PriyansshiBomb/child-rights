const Progress = require('../models/Progress');
const Badge = require('../models/Badge');
const RightsZone = require('../models/RightsZone');

// GET my progress
const getMyProgress = async (req, res) => {
  try {
    let progress = await Progress.findOne({ userId: req.user._id })
      .populate('zonesCompleted.zoneId', 'name right color')
      .populate('badgesEarned.badgeId', 'name icon description');

    if (!progress) {
      // First time playing — create fresh progress
      progress = await Progress.create({ userId: req.user._id });
    }

    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
};

// POST save progress after zone completion
const saveProgress = async (req, res) => {
  try {
    const { xpEarned, zoneId, quizScore, playerPosition } = req.body;

    let progress = await Progress.findOne({ userId: req.user._id });
    if (!progress) {
      progress = new Progress({ userId: req.user._id });
    }

    // Add XP
    if (xpEarned) {
      progress.xp += xpEarned;
      progress.level = Math.floor(progress.xp / 100) + 1;
    }

    // Add zone if not already completed
    if (zoneId) {
      const alreadyCompleted = progress.zonesCompleted.some(
        z => z.zoneId && z.zoneId.toString() === zoneId
      );

      if (!alreadyCompleted) {
        progress.zonesCompleted.push({
          zoneId,
          score: quizScore || 0,
          completedAt: new Date()
        });
        progress.totalZonesCompleted = progress.zonesCompleted.length;
      }
    }

    // Update position
    if (playerPosition) {
      progress.playerPosition = playerPosition;
    }

    progress.lastPlayed = new Date();
    await progress.save();

    // Check for newly unlocked badges
    const unlockedBadges = await checkAndUnlockBadges(progress);

    res.json({
      success: true,
      progress: {
        xp: progress.xp,
        level: progress.level,
        totalZonesCompleted: progress.totalZonesCompleted,
        playerPosition: progress.playerPosition
      },
      unlockedBadges
    });
  } catch (error) {
    res.status(500).json({ message: 'Error saving progress', error: error.message });
  }
};

// Helper: check which badges to unlock
const checkAndUnlockBadges = async (progress) => {
  const unlockedBadges = [];

  // Get all badges
  const allBadges = await Badge.find({});

  for (const badge of allBadges) {
    // Skip if already earned
    const alreadyEarned = progress.badgesEarned.some(
      b => b.badgeId && b.badgeId.toString() === badge._id.toString()
    );
    if (alreadyEarned) continue;

    let shouldUnlock = false;

    // Zone-based badge
    if (badge.category === 'zone' && badge.requiredZoneId) {
      shouldUnlock = progress.zonesCompleted.some(
        z => z.zoneId && z.zoneId.toString() === badge.requiredZoneId.toString()
      );
    }

    // XP-based badge
    if (badge.category === 'xp' && badge.requiredXP) {
      shouldUnlock = progress.xp >= badge.requiredXP;
    }

    // Level-based badge
    if (badge.category === 'level' && badge.requiredLevel) {
      shouldUnlock = progress.level >= badge.requiredLevel;
    }

    // Special: all zones completed
    if (badge.category === 'special' && badge.name === 'Rights Champion') {
      shouldUnlock = progress.totalZonesCompleted >= 5;
    }

    if (shouldUnlock) {
      progress.badgesEarned.push({ badgeId: badge._id, earnedAt: new Date() });
      progress.xp += badge.xpReward; // Bonus XP for badge
      unlockedBadges.push({
        name: badge.name,
        icon: badge.icon,
        description: badge.description,
        xpReward: badge.xpReward
      });
    }
  }

  if (unlockedBadges.length > 0) {
    await progress.save();
  }

  return unlockedBadges;
};

// GET progress for a specific child (parent/admin use)
const getChildProgress = async (req, res) => {
  try {
    const { childId } = req.params;

    if (req.user.role !== 'parent' && req.user.role !== 'admin' && req.user._id.toString() !== childId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const progress = await Progress.findOne({ userId: childId })
      .populate('zonesCompleted.zoneId', 'name right color')
      .populate('badgesEarned.badgeId', 'name icon description')
      .populate('userId', 'username avatar');

    if (!progress) {
      return res.status(404).json({ message: 'No progress found for this child' });
    }

    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching child progress', error: error.message });
  }
};

module.exports = { getMyProgress, saveProgress, getChildProgress };