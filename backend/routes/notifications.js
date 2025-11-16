// backend/routes/notifications.js
const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

/**
 * Reminder-related functionality was removed per request.
 * Only notification preferences are supported now.
 */

// Get current user's notification preferences
router.get('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email notificationPreferences');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user.notificationPreferences || {});
  } catch (err) {
    console.error('Failed to load notification preferences:', err);
    return res.status(500).json({ message: 'Failed to load preferences', error: err.message });
  }
});

// Update current user's notification preferences (in-app only)
router.put('/preferences', auth, async (req, res) => {
  try {
    const { timezone, bills, budgets, groupAlerts, smartReminders } = req.body;

    const update = {};
    if (timezone !== undefined) update['notificationPreferences.timezone'] = timezone;
    if (bills !== undefined) update['notificationPreferences.bills'] = bills;
    if (budgets !== undefined) update['notificationPreferences.budgets'] = budgets;
    if (groupAlerts !== undefined) update['notificationPreferences.groupAlerts'] = groupAlerts;
    if (smartReminders !== undefined) update['notificationPreferences.smartReminders'] = smartReminders;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'No valid preference fields provided' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('notificationPreferences');

    return res.json(user.notificationPreferences);
  } catch (err) {
    console.error('Failed to update notification preferences:', err);
    return res.status(400).json({ message: 'Failed to update preferences', error: err.message });
  }
});

module.exports = router;
