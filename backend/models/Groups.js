const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  members: [
    {
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
      share: { type: Number, required: true, min: 0 }
    }
  ],

  expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expenses' }],
  incomes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Incomes' }],

  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Auto-update the "updated_at" field whenever the document changes
GroupSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Groups', GroupSchema, 'Groups');
