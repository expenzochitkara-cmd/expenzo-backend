import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import User from './models/User.js';
import OTP from './models/OTP.js';
import MarketplaceItem from './models/MarketplaceItem.js';
import Job from './models/Job.js';
import BillGroup from './models/BillGroup.js';
import BudgetTracker from './models/BudgetTracker.js';
import { marketplaceItems } from './data/items.js';
import { 
  registerValidation, 
  loginValidation, 
  otpValidation, 
  forgotPasswordValidation,
  resetPasswordValidation,
  marketplaceItemValidation,
  jobValidation,
  validate 
} from './middleware/validation.js';
import { apiLimiter, authLimiter, otpLimiter } from './middleware/rateLimiter.js';
import { authenticateToken, optionalAuth } from './middleware/auth.js';

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/', apiLimiter); 

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Helper function to generate JWT token
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Helper function to send email
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'ExPeNzO <noreply@expenzo.com>',
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

app.get('/', (req, res) => {
  res.json({ message: 'ExPeNzO Backend API is running!' });
});

// ========================================
// MARKETPLACE ROUTES
// ========================================

// GET /api/marketplace/items - Fetch all marketplace items
app.get('/api/marketplace/items', optionalAuth, async (req, res) => {
  try {
    // Fetch items from database
    const items = await MarketplaceItem.find()
      .sort({ createdAt: -1 }) // Most recent first
      .lean();

    // Add isOwner flag if user is authenticated
    const itemsWithOwnership = items.map(item => ({
      ...item,
      id: item._id.toString(),
      isOwner: req.user ? item.userId.toString() === req.user.userId.toString() : false
    }));

    res.json(itemsWithOwnership);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching marketplace items', error: error.message });
  }
});

// POST /api/marketplace/items - Create new marketplace item
app.post('/api/marketplace/items', authenticateToken, marketplaceItemValidation, validate, async (req, res) => {
  try {
    const { title, description, price, image, condition, category, sellerPhone } = req.body;

    // Create new item
    const newItem = await MarketplaceItem.create({
      title,
      description,
      price,
      image,
      condition: condition || 'Good',
      category: category || 'other',
      sellerPhone,
      userId: req.user.userId,
      sellerName: req.user.name,
      sellerEmail: req.user.email
    });

    res.status(201).json({
      message: 'Item listed successfully',
      item: {
        ...newItem.toObject(),
        id: newItem._id.toString(),
        isOwner: true
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating marketplace item', error: error.message });
  }
});


app.get('/api/marketplace/items/:id', optionalAuth, async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id).lean();

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({
      ...item,
      id: item._id.toString(),
      isOwner: req.user ? item.userId.toString() === req.user.userId.toString() : false
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item', error: error.message });
  }
});


app.put('/api/marketplace/items/:id', authenticateToken, marketplaceItemValidation, validate, async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

  
    if (item.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to update this item' });
    }

    const { title, description, price, image, condition, category, sellerPhone } = req.body;

  
    item.title = title;
    item.description = description;
    item.price = price;
    item.image = image;
    item.condition = condition || item.condition;
    item.category = category || item.category;
    item.sellerPhone = sellerPhone;

    await item.save();

    res.json({
      message: 'Item updated successfully',
      item: {
        ...item.toObject(),
        id: item._id.toString(),
        isOwner: true
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating item', error: error.message });
  }
});


app.delete('/api/marketplace/items/:id', authenticateToken, async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }


    if (item.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this item' });
    }

    await MarketplaceItem.findByIdAndDelete(req.params.id);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting item', error: error.message });
  }
});


app.get('/api/marketplace/my-items', authenticateToken, async (req, res) => {
  try {
    const items = await MarketplaceItem.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    const itemsWithId = items.map(item => ({
      ...item,
      id: item._id.toString(),
      isOwner: true
    }));

    res.json(itemsWithId);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your items', error: error.message });
  }
});

// ========================================
// JOB ROUTES
// ========================================

// GET /api/jobs - Fetch all jobs
app.get('/api/jobs', optionalAuth, async (req, res) => {
  try {
    const jobs = await Job.find()
      .sort({ createdAt: -1 })
      .lean();

    const jobsWithOwnership = jobs.map(job => ({
      ...job,
      id: job._id.toString(),
      isOwner: req.user ? job.userId.toString() === req.user.userId.toString() : false
    }));

    res.json(jobsWithOwnership);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
});

// POST /api/jobs - Create new job posting
app.post('/api/jobs', authenticateToken, jobValidation, validate, async (req, res) => {
  try {
    const { title, company, description, jobType, location, hourlyRate, requirements, contactEmail, contactPhone } = req.body;

    const newJob = await Job.create({
      title,
      company,
      description,
      jobType,
      location,
      hourlyRate,
      requirements: requirements || [],
      contactEmail,
      contactPhone,
      userId: req.user.userId,
      posterName: req.user.name,
      posterEmail: req.user.email
    });

    res.status(201).json({
      message: 'Job posted successfully',
      job: {
        ...newJob.toObject(),
        id: newJob._id.toString(),
        isOwner: true
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating job', error: error.message });
  }
});

// GET /api/jobs/:id - Get single job details
app.get('/api/jobs/:id', optionalAuth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({
      ...job,
      id: job._id.toString(),
      isOwner: req.user ? job.userId.toString() === req.user.userId.toString() : false
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job', error: error.message });
  }
});

// PUT /api/jobs/:id - Update job posting
app.put('/api/jobs/:id', authenticateToken, jobValidation, validate, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to update this job' });
    }

    const { title, company, description, jobType, location, hourlyRate, requirements, contactEmail, contactPhone } = req.body;

    job.title = title;
    job.company = company;
    job.description = description;
    job.jobType = jobType;
    job.location = location;
    job.hourlyRate = hourlyRate;
    job.requirements = requirements || job.requirements;
    job.contactEmail = contactEmail;
    job.contactPhone = contactPhone;

    await job.save();

    res.json({
      message: 'Job updated successfully',
      job: {
        ...job.toObject(),
        id: job._id.toString(),
        isOwner: true
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating job', error: error.message });
  }
});

// DELETE /api/jobs/:id - Delete job posting
app.delete('/api/jobs/:id', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting job', error: error.message });
  }
});

// GET /api/jobs/my-jobs - Get user's own job postings
app.get('/api/jobs/my-jobs', authenticateToken, async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    const jobsWithId = jobs.map(job => ({
      ...job,
      id: job._id.toString(),
      isOwner: true
    }));

    res.json(jobsWithId);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your jobs', error: error.message });
  }
});

// BILL SPLITTER ROUTES
// ========================================

// GET /api/billgroup - Get user's bill group
app.get('/api/billgroup', authenticateToken, async (req, res) => {
  try {
    let billGroup = await BillGroup.findOne({ userId: req.user.userId });
    
    if (!billGroup) {
      billGroup = await BillGroup.create({
        userId: req.user.userId,
        groupName: 'My Group',
        people: [],
        expenses: []
      });
    }

    res.json(billGroup);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bill group', error: error.message });
  }
});

// POST /api/billgroup/person - Add person to group
app.post('/api/billgroup/person', authenticateToken, async (req, res) => {
  try {
    const { name, note, initialBalance } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Person name is required' });
    }

    let billGroup = await BillGroup.findOne({ userId: req.user.userId });
    
    if (!billGroup) {
      billGroup = await BillGroup.create({
        userId: req.user.userId,
        groupName: 'My Group',
        people: [],
        expenses: []
      });
    }

    billGroup.people.push({
      name: name.trim(),
      note: note?.trim() || `Hello, My name is ${name.trim()}`,
      initialBalance: parseFloat(initialBalance) || 0
    });

    await billGroup.save();
    res.json(billGroup);
  } catch (error) {
    res.status(500).json({ message: 'Error adding person', error: error.message });
  }
});

// DELETE /api/billgroup/person/:personId - Remove person from group
app.delete('/api/billgroup/person/:personId', authenticateToken, async (req, res) => {
  try {
    const billGroup = await BillGroup.findOne({ userId: req.user.userId });
    
    if (!billGroup) {
      return res.status(404).json({ message: 'Bill group not found' });
    }

    billGroup.people = billGroup.people.filter(p => p._id.toString() !== req.params.personId);
    await billGroup.save();
    
    res.json(billGroup);
  } catch (error) {
    res.status(500).json({ message: 'Error removing person', error: error.message });
  }
});

// POST /api/billgroup/expense - Add expense
app.post('/api/billgroup/expense', authenticateToken, async (req, res) => {
  try {
    const { description, amount, payer, date, splitType, shares } = req.body;

    if (!description || !amount || !payer) {
      return res.status(400).json({ message: 'Description, amount, and payer are required' });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const billGroup = await BillGroup.findOne({ userId: req.user.userId });
    
    if (!billGroup) {
      return res.status(404).json({ message: 'Bill group not found' });
    }

    billGroup.expenses.push({
      description: description.trim(),
      amount: parseFloat(amount),
      payer: payer.trim(),
      date: date || new Date(),
      splitType: splitType || 'equal',
      shares: shares || {}
    });

    await billGroup.save();
    res.json(billGroup);
  } catch (error) {
    res.status(500).json({ message: 'Error adding expense', error: error.message });
  }
});

// DELETE /api/billgroup/expense/:expenseId - Remove expense
app.delete('/api/billgroup/expense/:expenseId', authenticateToken, async (req, res) => {
  try {
    const billGroup = await BillGroup.findOne({ userId: req.user.userId });
    
    if (!billGroup) {
      return res.status(404).json({ message: 'Bill group not found' });
    }

    billGroup.expenses = billGroup.expenses.filter(e => e._id.toString() !== req.params.expenseId);
    await billGroup.save();
    
    res.json(billGroup);
  } catch (error) {
    res.status(500).json({ message: 'Error removing expense', error: error.message });
  }
});

// DELETE /api/billgroup/reset - Reset entire bill group
app.delete('/api/billgroup/reset', authenticateToken, async (req, res) => {
  try {
    await BillGroup.findOneAndDelete({ userId: req.user.userId });
    res.json({ message: 'Bill group reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting bill group', error: error.message });
  }
});

// BUDGET TRACKER ROUTES
// ========================================

// GET /api/budget - Get user's budget tracker
app.get('/api/budget', authenticateToken, async (req, res) => {
  try {
    let budget = await BudgetTracker.findOne({ userId: req.user.userId });
    
    if (!budget) {
      budget = await BudgetTracker.create({
        userId: req.user.userId,
        totalBudget: 1000,
        categoryBudgets: {
          Food: 300,
          Transportation: 200,
          Entertainment: 100,
          Other: 100
        },
        expenses: []
      });
    }

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budget', error: error.message });
  }
});

// PUT /api/budget/settings - Update budget settings
app.put('/api/budget/settings', authenticateToken, async (req, res) => {
  try {
    const { totalBudget, categoryBudgets } = req.body;

    let budget = await BudgetTracker.findOne({ userId: req.user.userId });
    
    if (!budget) {
      budget = await BudgetTracker.create({
        userId: req.user.userId,
        totalBudget: parseFloat(totalBudget) || 1000,
        categoryBudgets: categoryBudgets || {},
        expenses: []
      });
    } else {
      if (totalBudget !== undefined) {
        budget.totalBudget = parseFloat(totalBudget);
      }
      if (categoryBudgets) {
        budget.categoryBudgets = categoryBudgets;
      }
      await budget.save();
    }

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Error updating budget settings', error: error.message });
  }
});

// POST /api/budget/expense - Add expense
app.post('/api/budget/expense', authenticateToken, async (req, res) => {
  try {
    const { category, amount, description } = req.body;

    if (!category || !amount) {
      return res.status(400).json({ message: 'Category and amount are required' });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    if (!['Food', 'Transportation', 'Entertainment', 'Other'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    let budget = await BudgetTracker.findOne({ userId: req.user.userId });
    
    if (!budget) {
      budget = await BudgetTracker.create({
        userId: req.user.userId,
        expenses: []
      });
    }

    budget.expenses.push({
      category,
      amount: parseFloat(amount),
      description: description || 'No description',
      date: new Date()
    });

    await budget.save();
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Error adding expense', error: error.message });
  }
});

// DELETE /api/budget/expense/:expenseId - Remove expense
app.delete('/api/budget/expense/:expenseId', authenticateToken, async (req, res) => {
  try {
    const budget = await BudgetTracker.findOne({ userId: req.user.userId });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    budget.expenses = budget.expenses.filter(e => e._id.toString() !== req.params.expenseId);
    await budget.save();
    
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Error removing expense', error: error.message });
  }
});

// Helper function to generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// POST /api/auth/send-otp - Send OTP to email for registration
app.post('/api/auth/send-otp', otpLimiter, registerValidation, validate, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Delete any existing OTP for this email
    await OTP.deleteMany({ email: email.toLowerCase() });
    
    // Store OTP in database
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      name,
      password // Store plain password temporarily, will be hashed when creating user
    });

    // Send OTP email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ExPeNzO!</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${name}! 👋</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for registering with ExPeNzO. To complete your registration, please use the OTP code below:
          </p>
          <div style="background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">Your OTP Code:</p>
            <h1 style="color: #1f2937; font-size: 48px; margin: 0; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
          </div>
          <p style="color: #ef4444; font-size: 14px; background: #fef2f2; padding: 12px; border-radius: 6px; border-left: 4px solid #ef4444;">
            ⏰ This OTP will expire in 10 minutes
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>ExPeNzO - Student Finance Management Platform</p>
        </div>
      </div>
    `;

    const emailSent = await sendEmail(
      email,
      'Your OTP Code - ExPeNzO Registration',
      emailHtml
    );

    if (!emailSent) {
      console.log('Email not sent - configure EMAIL_USER and EMAIL_PASSWORD in .env file');
      // For development, return OTP in response (remove in production!)
      return res.json({ 
        message: 'OTP sent to email', 
        devOTP: otp, // Only for development testing
        warning: 'Email not configured. Using dev mode.' 
      });
    }

    res.json({ message: 'OTP sent to your email. Please check your inbox.' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
});

// POST /api/auth/verify-otp - Verify OTP and complete registration
app.post('/api/auth/verify-otp', authLimiter, otpValidation, validate, async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Get stored OTP data
    const otpData = await OTP.findOne({ email: email.toLowerCase() });

    if (!otpData) {
      return res.status(400).json({ message: 'No OTP found for this email. Please request a new one.' });
    }

    // Check if OTP expired
    if (Date.now() > otpData.expiresAt) {
      await OTP.deleteOne({ _id: otpData._id });
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    // Verify OTP
    if (otpData.otp !== otp.toString()) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // OTP verified - create user
    const newUser = await User.create({
      name: otpData.name,
      email: email.toLowerCase(),
      password: otpData.password, // Will be hashed by pre-save hook
      verified: true
    });

    // Remove used OTP
    await OTP.deleteOne({ _id: otpData._id });

    // Generate JWT token
    const token = generateToken(newUser.id, newUser.email);

    // Send welcome email
    const welcomeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Welcome to ExPeNzO! 🎉</h2>
        <p>Hi ${newUser.name},</p>
        <p>Your account has been successfully created and verified!</p>
        <p>You can now start using ExPeNzO to manage your finances, explore the marketplace, and much more.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
             style="background-color: #1f2937; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Get Started
          </a>
        </div>
        <p style="color: #6b7280; font-size: 12px;">ExPeNzO - Student Finance Management</p>
      </div>
    `;

    await sendEmail(
      newUser.email,
      'Welcome to ExPeNzO!',
      welcomeHtml
    );

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
});

// POST /api/auth/resend-otp - Resend OTP
app.post('/api/auth/resend-otp', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Get existing OTP data
    const otpData = await OTP.findOne({ email: email.toLowerCase() });

    if (!otpData) {
      return res.status(400).json({ message: 'No pending registration found for this email' });
    }

    // Generate new OTP
    const newOTP = generateOTP();
    
    // Update OTP in database
    otpData.otp = newOTP;
    otpData.expiresAt = Date.now() + 600000; // New 10 minutes
    await otpData.save();

    // Send new OTP email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1f2937;">New OTP Code</h2>
        <p>Hello ${otpData.name},</p>
        <p>Here is your new OTP code:</p>
        <div style="background: #f9fafb; border: 2px dashed #d1d5db; padding: 20px; margin: 20px 0; text-align: center;">
          <h1 style="color: #1f2937; font-size: 48px; margin: 0; letter-spacing: 8px;">${newOTP}</h1>
        </div>
        <p style="color: #ef4444; font-size: 14px;">⏰ This OTP will expire in 10 minutes</p>
      </div>
    `;

    const emailSent = await sendEmail(
      email,
      'New OTP Code - ExPeNzO Registration',
      emailHtml
    );

    if (!emailSent) {
      return res.json({ 
        message: 'OTP resent', 
        devOTP: newOTP,
        warning: 'Email not configured. Using dev mode.' 
      });
    }

    res.json({ message: 'New OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Error resending OTP', error: error.message });
  }
});

// POST /api/auth/login - Sign in user
app.post('/api/auth/login', authLimiter, loginValidation, validate, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is verified
    if (!user.verified) {
      return res.status(401).json({ message: 'Please verify your email first' });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
});

// POST /api/auth/forgot-password - Request password reset
app.post('/api/auth/forgot-password', authLimiter, forgotPasswordValidation, validate, async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, email: user.email, type: 'reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store reset token in user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; 
    await user.save();

    // Send email with reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #1f2937; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="color: #6b7280; word-break: break-all;">${resetLink}</p>
        <p style="color: #ef4444; font-size: 14px;">This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">ExPeNzO - Student Finance Management</p>
      </div>
    `;

    const emailSent = await sendEmail(
      user.email,
      'Password Reset Request - ExPeNzO',
      emailHtml
    );

    if (!emailSent) {
      console.log('Email not sent - configure EMAIL_USER and EMAIL_PASSWORD in .env file');
    }

    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing request', error: error.message });
  }
});

// POST /api/auth/reset-password - Reset password with token
app.post('/api/auth/reset-password', authLimiter, resetPasswordValidation, validate, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      _id: decoded.userId,
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send confirmation email
    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Password Reset Successful</h2>
        <p>Hello ${user.name},</p>
        <p>Your password has been successfully reset.</p>
        <p>You can now log in with your new password.</p>
        <p style="color: #ef4444; font-size: 14px;">If you didn't make this change, please contact support immediately.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">ExPeNzO - Student Finance Management</p>
      </div>
    `;

    await sendEmail(
      user.email,
      'Password Reset Successful - ExPeNzO',
      confirmationHtml
    );

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 ExPeNzO Backend Server Running!`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`\n📋 Authentication Endpoints:`);
  console.log(`   POST /api/auth/send-otp - Send OTP for registration`);
  console.log(`   POST /api/auth/verify-otp - Verify OTP and complete signup`);
  console.log(`   POST /api/auth/resend-otp - Resend OTP`);
  console.log(`   POST /api/auth/login - Sign in user`);
  console.log(`   POST /api/auth/forgot-password - Request password reset`);
  console.log(`   POST /api/auth/reset-password - Reset password`);
  console.log(`\n🛍️  Marketplace Endpoints:`);
  console.log(`   GET    /api/marketplace/items - Fetch all items`);
  console.log(`   POST   /api/marketplace/items - Create new item (auth required)`);
  console.log(`   GET    /api/marketplace/items/:id - Get item details`);
  console.log(`   PUT    /api/marketplace/items/:id - Update item (auth required)`);
  console.log(`   DELETE /api/marketplace/items/:id - Delete item (auth required)`);
  console.log(`   GET    /api/marketplace/my-items - Get user's items (auth required)`);
  console.log(`\n💼  Job Endpoints:`);
  console.log(`   GET    /api/jobs - Fetch all jobs`);
  console.log(`   POST   /api/jobs - Create new job (auth required)`);
  console.log(`   GET    /api/jobs/:id - Get job details`);
  console.log(`   PUT    /api/jobs/:id - Update job (auth required)`);
  console.log(`   DELETE /api/jobs/:id - Delete job (auth required)`);
  console.log(`   GET    /api/jobs/my-jobs - Get user's jobs (auth required)`);
  console.log(`\n💰  Budget Tracker Endpoints:`);
  console.log(`   GET    /api/budget - Get user budget (auth required)`);
  console.log(`   PUT    /api/budget/settings - Update budget settings (auth required)`);
  console.log(`   POST   /api/budget/expense - Add expense (auth required)`);
  console.log(`   DELETE /api/budget/expense/:id - Remove expense (auth required)`);
  console.log(`\n🧾  Bill Splitter Endpoints:`);
  console.log(`   GET    /api/billgroup - Get bill group (auth required)`);
  console.log(`   POST   /api/billgroup/person - Add person (auth required)`);
  console.log(`   DELETE /api/billgroup/person/:id - Remove person (auth required)`);
  console.log(`   POST   /api/billgroup/expense - Add expense (auth required)`);
  console.log(`   DELETE /api/billgroup/expense/:id - Remove expense (auth required)`);
  console.log(`   DELETE /api/billgroup/reset - Reset group (auth required)`);
  console.log(`\n⚙️  Email: ${process.env.EMAIL_USER ? '✅ Configured' : '⚠️  Not configured (check .env)'}`);
  console.log(`\n`);
});
