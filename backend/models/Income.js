const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    group_id: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    source: { type: String, enum: ["Salary", "Business", "Freelance"], required: true },
    payment_method: { type: String, enum: ["Bank Transfer", "UPI", "Cash"], required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Income", incomeSchema, "Income");
