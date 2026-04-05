const express = require('express');
const router = express.Router();
const RightsZone = require('../models/RightsZone');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roles');

// GET all active zones (used by game engine)
router.get('/', protect, async (req, res) => {
  try {
    const zones = await RightsZone.find({ isActive: true });
    res.json({ success: true, zones });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching zones', error: error.message });
  }
});

// POST create zone (admin only)
router.post('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const zone = await RightsZone.create(req.body);
    res.status(201).json({ success: true, zone });
  } catch (error) {
    res.status(500).json({ message: 'Error creating zone', error: error.message });
  }
});

// PUT update zone (admin only)
router.put('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const zone = await RightsZone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!zone) return res.status(404).json({ message: 'Zone not found' });
    res.json({ success: true, zone });
  } catch (error) {
    res.status(500).json({ message: 'Error updating zone', error: error.message });
  }
});

module.exports = router;