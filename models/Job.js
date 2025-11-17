import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  company: {
    type: String,
    required: [true, 'Company/Department is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    minlength: [20, 'Description must be at least 20 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship', 'temporary']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  hourlyRate: {
    type: Number,
    min: [0, 'Hourly rate cannot be negative']
  },
  requirements: {
    type: [String],
    default: []
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  contactPhone: {
    type: String,
    trim: true,
    minlength: [10, 'Phone number must be at least 10 digits'],
    maxlength: [15, 'Phone number cannot exceed 15 digits']
  },
  // Reference to the user who posted this job
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  posterName: {
    type: String,
    required: true
  },
  posterEmail: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
jobSchema.index({ userId: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ createdAt: -1 });

export default mongoose.model('Job', jobSchema);
