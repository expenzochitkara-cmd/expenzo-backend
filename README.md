# ExPeNzO Backend Server

Backend API for ExPeNzO marketplace and authentication.

## Features

- ✅ GET `/api/marketplace/items` - Fetch all marketplace items
- ✅ POST `/api/auth/signup` - User registration with password hashing
- ✅ POST `/api/auth/login` - User authentication with JWT tokens
- ✅ POST `/api/auth/forgot-password` - Request password reset via email
- ✅ POST `/api/auth/reset-password` - Reset password with token
- ✅ CORS enabled for frontend integration
- ✅ Nodemailer for email functionality
- ✅ Bcrypt password hashing
- ✅ In-memory data storage (demo)

## Setup

1. Install dependencies:
```bash
cd FEE-BACKEND
npm install
```

2. Start the server:
```bash
npm start
```

Or use nodemon for development:
```bash
npm run dev
```

The server will run on `http://localhost:4000`

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

#### POST /api/auth/login
User login endpoint.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

#### POST /api/auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

#### POST /api/auth/reset-password
Reset password using token from email.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successful. You can now log in with your new password."
}
```

### Marketplace Endpoints

#### GET /api/marketplace/items
Fetches all marketplace items.

**Response:**
```json
[
  {
    "id": "1",
    "title": "Textbook - Introduction to Psychology",
    "price": 45.99,
    "description": "Like new condition, 8th edition",
    "image": "...",
    "seller": "John D.",
    "condition": "Like New",
    "category": "textbooks"
  }
]
```

## Environment Variables

Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Then update with your values:
```
PORT=4000
JWT_SECRET=your-super-secret-jwt-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

### Setting up Gmail for Nodemailer

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Create a new app password for "Mail"
5. Copy the generated password to `EMAIL_PASSWORD` in `.env`

**Note:** Email functionality will work without configuration but won't send actual emails in development.

## Tech Stack

- Express.js
- CORS
- JWT (jsonwebtoken)
- bcryptjs
