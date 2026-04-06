const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Helper to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      parentId: user.parentId,
      childLoginCode: user.childLoginCode
    }
  });
};

// ─── REGISTER ────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { username, email, password, role, parentId } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    if (role === 'admin') {
      return res.status(403).json({ message: 'Cannot register as admin' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Hash password manually here — no pre-save hook
    const hashedPassword = await bcrypt.hash(password, 12);

    const isChild = (!role || role === 'child');
    const childLoginCode = isChild 
      ? Math.random().toString(36).substring(2, 8).toUpperCase() 
      : undefined;

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'child',
      parentId: parentId || null,
      childLoginCode
    });

    await user.save();
    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user and include password (it's excluded by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Backwards compatibility for early child accounts without a code
    if (user.role === 'child' && !user.childLoginCode) {
      user.childLoginCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await user.save();
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  let user = req.user;
  // Backwards compatibility for early child accounts without a code
  if (user.role === 'child' && !user.childLoginCode) {
    user.childLoginCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    await user.save();
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      parentId: user.parentId,
      childLoginCode: user.childLoginCode
    }
  });
};

// ─── PARENT LOGIN BY CODE ───────────────────────────────────────────────────────
const parentLoginByCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Child display code is required' });
    }

    const childUser = await User.findOne({ childLoginCode: code });
    if (!childUser) {
      return res.status(401).json({ message: 'Invalid Child ID code' });
    }

    // Generate normal child token but we flag it so frontend knows to navigate properly
    const token = generateToken(childUser._id);
    res.status(200).json({
      success: true,
      token,
      isParentSession: true, // Special flag for frontend routing explicitly
      user: {
        id: childUser._id,
        username: childUser.username,
        role: childUser.role, // still effectively role: 'child' in the DB sense
      }
    });

  } catch (error) {
    console.error('Parent Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

module.exports = { register, login, getMe, parentLoginByCode };