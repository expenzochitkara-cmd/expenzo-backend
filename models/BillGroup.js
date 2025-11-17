import mongoose from 'mongoose';

const billGroupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  groupName: {
    type: String,
    default: 'My Group'
  },
  people: [{
    name: {
      type: String,
      required: true
    },
    note: {
      type: String,
      default: ''
    },
    initialBalance: {
      type: Number,
      default: 0
    }
  }],
  expenses: [{
    description: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    payer: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    splitType: {
      type: String,
      enum: ['equal', 'shares'],
      default: 'equal'
    },
    shares: {
      type: Map,
      of: Number,
      default: {}
    }
  }]
}, {
  timestamps: true
});

billGroupSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('BillGroup', billGroupSchema);
