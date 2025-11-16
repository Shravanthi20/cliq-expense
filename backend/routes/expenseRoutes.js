const express = require("express");
const { ObjectId } = require("mongodb");
const User = require("../models/User"); // ✅ import to reflect in user accounts
const Groups = require("../models/Groups"); // ✅ to include creator in members

function expenseRoutes(Expenses) {
  const router = express.Router();

  // ✅ Get all expenses
  router.get("/", async (req, res) => {
    try {
      const expenses = await Expenses.find().toArray();
      res.json(expenses);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ✅ Create new expense (and reflect in user accounts)
  router.post("/", async (req, res) => {
    try {
      const { description, amount, group_id, members } = req.body;

      if (
        !description ||
        !amount ||
        !group_id ||
        !Array.isArray(members) ||
        members.length === 0
      ) {
        return res.status(400).json({ error: "Invalid expense data" });
      }

      // ✅ Fetch group info (for creator inclusion)
      const group = await Groups.findById(group_id);
      if (!group) return res.status(404).json({ error: "Group not found" });

      // ✅ Prepare members list, including creator if not already there
      const formattedMembers = members.map((m) => ({
        user_id: new ObjectId(m.user_id),
        share: parseFloat(m.share) || 0,
      }));

      const creatorAlreadyIncluded = formattedMembers.some(
        (m) => String(m.user_id) === String(group.created_by)
      );

      if (!creatorAlreadyIncluded && group.created_by) {
        formattedMembers.push({
          user_id: new ObjectId(group.created_by),
          share: 0, // creator’s share can be adjusted manually later
        });
      }

      // ✅ Create expense document
      const expense = {
        description,
        amount: parseFloat(amount),
        group_id: new ObjectId(group_id),
        members: formattedMembers,
        created_by: new ObjectId(group.created_by),
        created_at: new Date(),
      };

      const result = await Expenses.insertOne(expense);
      const expenseId = result.insertedId;

      // ✅ Reflect in each user’s record
      const userIds = formattedMembers.map((m) => m.user_id);
      await User.updateMany(
        { _id: { $in: userIds } },
        { $addToSet: { expenses: expenseId } } // avoids duplicates
      );

      res.status(201).json({
        message: "✅ Expense created and reflected in user accounts",
        expenseId,
      });
    } catch (err) {
      console.error("Error creating expense:", err);
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  // ✅ Update expense
  router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { description, amount, members } = req.body;

      const updateData = {};
      if (description) updateData.description = description;
      if (amount) updateData.amount = parseFloat(amount);
      if (Array.isArray(members)) {
        updateData.members = members.map((m) => ({
          user_id: new ObjectId(m.user_id),
          share: parseFloat(m.share) || 0,
        }));
      }
      updateData.updated_at = new Date();

      const result = await Expenses.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Expense not found" });
      }

      res.json({ message: "Expense updated successfully" });
    } catch (err) {
      console.error("Error updating expense:", err);
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  // ✅ Delete expense (and reflect removal from users)
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const expense = await Expenses.findOne({ _id: new ObjectId(id) });
      if (!expense) return res.status(404).json({ error: "Expense not found" });

      const result = await Expenses.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Expense not found" });
      }

      // ✅ Remove expense from all users who had it
      const userIds = expense.members.map((m) => m.user_id);
      await User.updateMany(
        { _id: { $in: userIds } },
        { $pull: { expenses: new ObjectId(id) } }
      );

      res.json({ message: "🗑️ Expense deleted and removed from user accounts" });
    } catch (err) {
      console.error("Error deleting expense:", err);
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  return router;
}

module.exports = expenseRoutes;
