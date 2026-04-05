const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true  // One progress doc per user
  },
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  zonesCompleted: [{
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RightsZone'
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    score: {
      type: Number,  // Quiz score for this zone (0-100)
      default: 0
    }
  }],
  badgesEarned: [{
    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge'
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalZonesCompleted: {
    type: Number,
    default: 0
  },
  lastPlayed: {
    type: Date,
    default: Date.now
  },
  playerPosition: {
    x: { type: Number, default: 100 },
    y: { type: Number, default: 100 }
  }
}, { timestamps: true });

// Auto-calculate level from XP before saving
// Every 100 XP = 1 level


module.exports = mongoose.model('Progress', progressSchema);