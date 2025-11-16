const express = require("express");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Expense = require("../models/Expense");
const Income = require("../models/Income");

const router = express.Router();

function toObjectIdOrNull(id) {
  if (!id) return null;
  try { return new mongoose.Types.ObjectId(id); } catch { return null; }
}

// Expenses
router.get("/expenses", auth, async (req, res) => {
  const items = await Expense.find({ user_id: req.user.id }).sort({ date: -1 }).limit(50);
  res.json(items);
});

// Search Expenses
router.get("/expenses/search", auth, async (req, res) => {
  try {
    const { q, category, payment_method, date_from, date_to, amount_min, amount_max, limit = 50 } = req.query;

    const filter = { user_id: req.user.id };
    if (category) filter.category = category;
    if (payment_method) filter.payment_method = payment_method;

    if (date_from || date_to) {
      filter.date = {};
      if (date_from) filter.date.$gte = new Date(date_from);
      if (date_to) filter.date.$lte = new Date(date_to);
    }

    if (amount_min != null || amount_max != null) {
      filter.amount = {};
      if (amount_min != null) filter.amount.$gte = Number(amount_min);
      if (amount_max != null) filter.amount.$lte = Number(amount_max);
    }

    if (q) {
      const regex = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { category: regex },
        { description: regex },
        { payment_method: regex },
      ];
    }

    const items = await Expense.find(filter).sort({ date: -1 }).limit(Math.min(Number(limit) || 50, 200));
    res.json(items);
  } catch (err) {
    res.status(400).json({ message: "Failed to search expenses", error: err.message });
  }
});

router.post("/expenses", auth, async (req, res) => {
  try {
    const {
      date, category, amount, payment_method, description,
      group_id, split_between = [], split_equal = false, split_share = null
    } = req.body;

    const doc = await Expense.create({
      user_id: req.user.id,
      group_id: toObjectIdOrNull(group_id),
      date: new Date(date),
      category,
      amount: Number(amount),
      payment_method,
      description: description || "",
      source: "manual",
      split_between: Array.isArray(split_between) ? split_between.map(toObjectIdOrNull).filter(Boolean) : [],
      split_equal: Boolean(split_equal),
      split_share: split_share != null ? Number(split_share) : null,
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: "Failed to create expense", error: err.message });
  }
});

// Update Expense
router.put("/expenses/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      category,
      amount,
      payment_method,
      description,
      group_id,
      split_between,
      split_equal,
      split_share,
    } = req.body;

    const update = {};
    if (date != null) update.date = new Date(date);
    if (category != null) update.category = category;
    if (amount != null) update.amount = Number(amount);
    if (payment_method != null) update.payment_method = payment_method;
    if (description != null) update.description = description;
    if (group_id !== undefined) update.group_id = toObjectIdOrNull(group_id);
    if (Array.isArray(split_between)) update.split_between = split_between.map(toObjectIdOrNull).filter(Boolean);
    if (split_equal != null) update.split_equal = Boolean(split_equal);
    if (split_share !== undefined) update.split_share = split_share != null ? Number(split_share) : null;

    const doc = await Expense.findOneAndUpdate(
      { _id: id, user_id: req.user.id },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).json({ message: "Expense not found" });
    return res.json(doc);
  } catch (err) {
    return res.status(400).json({ message: "Failed to update expense", error: err.message });
  }
});

router.delete("/expenses/:id", auth, async (req, res) => {
  const { id } = req.params;
  await Expense.deleteOne({ _id: id, user_id: req.user.id });
  res.json({ message: "Deleted" });
});

// Income
router.get("/income", auth, async (req, res) => {
  const items = await Income.find({ user_id: req.user.id }).sort({ date: -1 }).limit(50);
  res.json(items);
});

// Search Income
router.get("/income/search", auth, async (req, res) => {
  try {
    const { q, source, payment_method, date_from, date_to, amount_min, amount_max, limit = 50 } = req.query;

    const filter = { user_id: req.user.id };
    if (source) filter.source = source;
    if (payment_method) filter.payment_method = payment_method;

    if (date_from || date_to) {
      filter.date = {};
      if (date_from) filter.date.$gte = new Date(date_from);
      if (date_to) filter.date.$lte = new Date(date_to);
    }

    if (amount_min != null || amount_max != null) {
      filter.amount = {};
      if (amount_min != null) filter.amount.$gte = Number(amount_min);
      if (amount_max != null) filter.amount.$lte = Number(amount_max);
    }

    if (q) {
      const regex = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { source: regex },
        { payment_method: regex },
        { notes: regex },
      ];
    }

    const items = await Income.find(filter).sort({ date: -1 }).limit(Math.min(Number(limit) || 50, 200));
    res.json(items);
  } catch (err) {
    res.status(400).json({ message: "Failed to search income", error: err.message });
  }
});

router.post("/income", auth, async (req, res) => {
  try {
    const { date, amount, source, payment_method, notes, group_id } = req.body;
    const doc = await Income.create({
      user_id: req.user.id,
      group_id: toObjectIdOrNull(group_id),
      date: new Date(date),
      amount: Number(amount),
      source,
      payment_method,
      notes: notes || "",
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: "Failed to create income", error: err.message });
  }
});

// Update Income
router.put("/income/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, amount, source, payment_method, notes, group_id } = req.body;

    const update = {};
    if (date != null) update.date = new Date(date);
    if (amount != null) update.amount = Number(amount);
    if (source != null) update.source = source;
    if (payment_method != null) update.payment_method = payment_method;
    if (notes != null) update.notes = notes;
    if (group_id !== undefined) update.group_id = toObjectIdOrNull(group_id);

    const doc = await Income.findOneAndUpdate(
      { _id: id, user_id: req.user.id },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).json({ message: "Income not found" });
    return res.json(doc);
  } catch (err) {
    return res.status(400).json({ message: "Failed to update income", error: err.message });
  }
});

router.delete("/income/:id", auth, async (req, res) => {
  const { id } = req.params;
  await Income.deleteOne({ _id: id, user_id: req.user.id });
  res.json({ message: "Deleted" });
});

module.exports = router;
