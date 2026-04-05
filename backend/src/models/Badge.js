const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,  // emoji or icon name
    default: '🏅'
  },
  category: {
    type: String,
    enum: ['zone', 'xp', 'level', 'special'],
    default: 'zone'
  },
  // For zone-based badges
  requiredZoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RightsZone',
    default: null
  },
  // For XP-based badges
  requiredXP: {
    type: Number,
    default: 0
  },
  // For level-based badges
  requiredLevel: {
    type: Number,
    default: 0
  },
  xpReward: {
    type: Number,
    default: 10
  }
}, { timestamps: true });

module.exports = mongoose.model('Badge', badgeSchema);