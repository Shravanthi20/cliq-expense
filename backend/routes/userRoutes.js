const express = require("express");
const { ObjectId } = require("mongodb");

function userRoutes(Users) {
  const router = express.Router();

  // Get all users
  router.get("/", async (req, res) => {
    try {
      const users = await Users.find().toArray();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = userRoutes;
