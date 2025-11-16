const express = require("express");
const { ObjectId } = require("mongodb");
const auth = require("../middleware/auth");

function groupRoutes(Groups) {
  const router = express.Router();

  // Require auth for all routes below
  router.use(auth);

  // Get all groups (optionally filter: mine=true)
  router.get("/", async (req, res) => {
    try {
      const mine = String(req.query.mine || '').toLowerCase() === 'true';
      const query = mine
        ? { $or: [
            { created_by: new ObjectId(req.user.id) },
            { "members.user_id": new ObjectId(req.user.id) }
          ] }
        : {};
      const groups = await Groups.find(query);
      console.log("Groups fetched:", groups.length);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  // Create new group
  router.post("/", async (req, res) => {
    try {
      const { name, members } = req.body;
      const created_by = req.user.id;
      if (!name || !created_by || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ error: "Invalid group data" });
      }

      if (!ObjectId.isValid(created_by)) {
        return res.status(400).json({ error: "Invalid created_by id" });
      }

      // Validate member objects and IDs
      const formattedMembers = [];
      for (const m of members) {
        if (!m || !m.user_id || !ObjectId.isValid(m.user_id)) {
          return res.status(400).json({ error: "Invalid member user_id" });
        }
        const shareNumber = parseFloat(m.share);
        formattedMembers.push({
          user_id: new ObjectId(m.user_id),
          share: Number.isFinite(shareNumber) ? shareNumber : 0,
        });
      }

      const result = await Groups.create({
        name,
        created_by: new ObjectId(created_by),
        members: formattedMembers,
        created_at: new Date(),
      });

      res.status(201).json({ message: "Group created", groupId: result.insertedId });
    } catch (err) {
      console.error("Error creating group:", err);
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  // Update group
  router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, members } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid group id" });
      }

      // Ensure only creator can update name or members
      const existing = await Groups.findOne({ _id: new ObjectId(id) });
      if (!existing) return res.status(404).json({ error: "Group not found" });
      if (String(existing.created_by) !== String(req.user.id)) {
        return res.status(403).json({ error: "Only the creator can update the group" });
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (Array.isArray(members)) {
        const formattedMembers = [];
        for (const m of members) {
          if (!m || !m.user_id || !ObjectId.isValid(m.user_id)) {
            return res.status(400).json({ error: "Invalid member user_id" });
          }
          const shareNumber = parseFloat(m.share);
          formattedMembers.push({
            user_id: new ObjectId(m.user_id),
            share: Number.isFinite(shareNumber) ? shareNumber : 0,
          });
        }
        updateData.members = formattedMembers;
      }
      updateData.updated_at = new Date();

      const result = await Groups.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Group not found" });
      }

      res.json({ message: "Group updated successfully" });
    } catch (err) {
      console.error("Error updating group:", err);
      res.status(500).json({ error: "Failed to update group" });
    }
  });

  // Delete group
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid group id" });
      const existing = await Groups.findOne({ _id: new ObjectId(id) });
      if (!existing) return res.status(404).json({ error: "Group not found" });
      if (String(existing.created_by) !== String(req.user.id)) {
        return res.status(403).json({ error: "Only the creator can delete the group" });
      }
      const result = await Groups.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Group not found" });
      }

      res.json({ message: "Group deleted successfully" });
    } catch (err) {
      console.error("Error deleting group:", err);
      res.status(500).json({ error: "Failed to delete group" });
    }
  });

  // Add a member (creator only)
  router.post("/:id/members", async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id, share } = req.body;
      if (!ObjectId.isValid(id) || !ObjectId.isValid(user_id)) {
        return res.status(400).json({ error: "Invalid id" });
      }
      const group = await Groups.findOne({ _id: new ObjectId(id) });
      if (!group) return res.status(404).json({ error: "Group not found" });
      if (String(group.created_by) !== String(req.user.id)) {
        return res.status(403).json({ error: "Only the creator can add members" });
      }
      const existingMember = group.members.find(m => String(m.user_id) === String(user_id));
      if (existingMember) return res.status(400).json({ error: "User already a member" });
      const shareNum = Number.parseFloat(share) || 0;
      await Groups.updateOne(
        { _id: new ObjectId(id) },
        { $push: { members: { user_id: new ObjectId(user_id), share: shareNum } }, $set: { updated_at: new Date() } }
      );
      res.json({ message: "Member added" });
    } catch (err) {
      console.error("Error adding member:", err);
      res.status(500).json({ error: "Failed to add member" });
    }
  });

  // Remove a member (creator can kick; member can leave self)
  router.delete("/:id/members/:memberId", async (req, res) => {
    try {
      const { id, memberId } = req.params;
      if (!ObjectId.isValid(id) || !ObjectId.isValid(memberId)) {
        return res.status(400).json({ error: "Invalid id" });
      }
      const group = await Groups.findOne({ _id: new ObjectId(id) });
      if (!group) return res.status(404).json({ error: "Group not found" });
      const isCreator = String(group.created_by) === String(req.user.id);
      const isSelf = String(memberId) === String(req.user.id);
      if (!isCreator && !isSelf) {
        return res.status(403).json({ error: "Not authorized to remove this member" });
      }
      await Groups.updateOne(
        { _id: new ObjectId(id) },
        { $pull: { members: { user_id: new ObjectId(memberId) } }, $set: { updated_at: new Date() } }
      );
      res.json({ message: isSelf ? "Left group" : "Member removed" });
    } catch (err) {
      console.error("Error removing member:", err);
      res.status(500).json({ error: "Failed to remove member" });
    }
  });

  return router;
}

module.exports = groupRoutes;
