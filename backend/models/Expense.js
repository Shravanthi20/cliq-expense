const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    group_id: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
    date: { type: Date, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    payment_method: {
      type: String,
      enum: [
        "UPI",
        "Cash",
        "Card",
        "Credit Card",
        "Debit Card",
        "NetBanking",
        "Bank Transfer",
      ],
      required: true,
    },
    description: { type: String, default: "" },
    source: { type: String, enum: ["manual", "csv", "pdf"], default: "manual" },
    // Optional split info
    split_between: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    split_equal: { type: Boolean, default: false },
    split_share: { type: Number, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Expense", expenseSchema, "Expenses");


