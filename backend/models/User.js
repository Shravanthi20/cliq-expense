const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ["personal", "business", "group_member"],
      default: "personal",
    },

    currency: { type: String, default: "INR" },

    // ✅ Groups the user is part of
    groups: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Groups", default: [] }
    ],

    // ✅ Contributions made by the user
    contributions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Contributions", default: [] }
    ],

    // ✅ Expenses shared with or created by this user
    expenses: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Expenses", default: [] }
    ],

    // ✅ Notification preferences
    notificationPreferences: {
      channel: { type: String, enum: ["email", "sms", "none"], default: "email" },
      emailEnabled: { type: Boolean, default: true },
      smsEnabled: { type: Boolean, default: false },
      phone: { type: String, default: null },
      timezone: { type: String, default: "UTC" },
      // Master settings below
      bills: {
        electricity: {
          enabled: { type: Boolean, default: false },
          dayOfMonth: { type: Number, min: 1, max: 31, default: 1 },
        },
        rent: {
          enabled: { type: Boolean, default: false },
          dayOfMonth: { type: Number, min: 1, max: 31, default: 1 },
        },
        subscriptions: {
          enabled: { type: Boolean, default: false },
          dayOfMonth: { type: Number, min: 1, max: 31, default: 1 },
        },
      },
      budgets: {
        monthlyBudget: { type: Number, default: 0 },
        lowBalanceThresholdPct: { type: Number, min: 0, max: 100, default: 20 },
      },
      groupAlerts: {
        notifyMembershipChanges: { type: Boolean, default: true },
        notifyGroupTransactions: { type: Boolean, default: false },
      },
      smartReminders: {
        enabled: { type: Boolean, default: false },
        groceryHintAmount: { type: Number, default: 2000 },
      },
    },
  },
  { timestamps: true }
);

// ✅ Export using the existing collection name
module.exports = mongoose.model("User", userSchema, "Users");
