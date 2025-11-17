import mongoose from 'mongoose';

const budgetTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  totalBudget: {
    type: Number,
    default: 1000,
    min: 0
  },
  categoryBudgets: {
    Food: { type: Number, default: 300, min: 0 },
    Transportation: { type: Number, default: 200, min: 0 },
    Entertainment: { type: Number, default: 100, min: 0 },
    Other: { type: Number, default: 100, min: 0 }
  },
  expenses: [{
    category: {
      type: String,
      required: true,
      enum: ['Food', 'Transportation', 'Entertainment', 'Other']
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      default: 'No description'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

budgetTrackerSchema.index({ userId: 1 });

export default mongoose.model('BudgetTracker', budgetTrackerSchema);
