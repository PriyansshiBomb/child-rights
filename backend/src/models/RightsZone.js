const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number,  // Index of correct option (0, 1, 2, or 3)
    required: true
  },
  explanation: {
    type: String,  // Shown after answering — teaches the right
    default: ''
  }
});

const rightsZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  right: {
    type: String,
    enum: ['education', 'food', 'safety', 'health', 'play'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  // Position on the game canvas
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  radius: {
    type: Number,
    default: 60  // Glowing circle radius in pixels
  },
  color: {
    type: String,
    default: '#FFD700'  // Gold glow by default
  },
  questions: [questionSchema],
  xpReward: {
    type: Number,
    default: 50
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('RightsZone', rightsZoneSchema);