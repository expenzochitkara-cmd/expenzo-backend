import { body, validationResult } from 'express-validator';

// Validation middleware wrapper
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Registration validation rules
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Login validation rules
export const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

// OTP validation rules
export const otpValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must be numeric')
];

// Forgot password validation
export const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
];

// Reset password validation
export const resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Marketplace item validation rules
export const marketplaceItemValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('image')
    .trim()
    .notEmpty().withMessage('Image URL is required')
    .isURL().withMessage('Please provide a valid image URL'),
  
  body('condition')
    .optional()
    .isIn(['New', 'Like New', 'Good', 'Fair', 'Poor']).withMessage('Invalid condition'),
  
  body('category')
    .optional()
    .isIn(['textbooks', 'electronics', 'clothing', 'furniture', 'other']).withMessage('Invalid category'),
  
  body('sellerPhone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .isLength({ min: 10, max: 15 }).withMessage('Phone number must be between 10 and 15 digits')
    .matches(/^[0-9+\-\s()]+$/).withMessage('Phone number can only contain numbers, +, -, spaces, and parentheses')
];

// Job validation rules
export const jobValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Job title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  
  body('company')
    .trim()
    .notEmpty().withMessage('Company/Department is required')
    .isLength({ max: 100 }).withMessage('Company name cannot exceed 100 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Job description is required')
    .isLength({ min: 20, max: 2000 }).withMessage('Description must be between 20 and 2000 characters'),
  
  body('jobType')
    .notEmpty().withMessage('Job type is required')
    .isIn(['full-time', 'part-time', 'contract', 'freelance', 'internship', 'temporary']).withMessage('Invalid job type'),
  
  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters'),
  
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number'),
  
  body('requirements')
    .optional()
    .isArray().withMessage('Requirements must be an array'),
  
  body('contactEmail')
    .trim()
    .notEmpty().withMessage('Contact email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('contactPhone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 }).withMessage('Phone number must be between 10 and 15 digits')
    .matches(/^[0-9+\-\s()]+$/).withMessage('Phone number can only contain numbers, +, -, spaces, and parentheses')
];
