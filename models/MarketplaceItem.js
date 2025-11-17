import mongoose from 'mongoose';

const marketplaceItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String,
    required: [true, 'Image URL is required']
  },
  condition: {
    type: String,
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  category: {
    type: String,
    enum: ['textbooks', 'electronics', 'clothing', 'furniture', 'other'],
    default: 'other'
  },
  sellerPhone: {
    type: String,
    required: [true, 'Seller phone number is required'],
    trim: true,
    minlength: [10, 'Phone number must be at least 10 digits'],
    maxlength: [15, 'Phone number cannot exceed 15 digits']
  },
  // Reference to the user who created this listing
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerName: {
    type: String,
    required: true
  },
  sellerEmail: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
marketplaceItemSchema.index({ userId: 1 });
marketplaceItemSchema.index({ category: 1 });
marketplaceItemSchema.index({ createdAt: -1 });

export default mongoose.model('MarketplaceItem', marketplaceItemSchema);
