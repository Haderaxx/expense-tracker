const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍔', color: '#f97316', type: 'expense' },
  { name: 'Transportation', icon: '🚗', color: '#3b82f6', type: 'expense' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'expense' },
  { name: 'Entertainment', icon: '🎮', color: '#8b5cf6', type: 'expense' },
  { name: 'Healthcare', icon: '🏥', color: '#ef4444', type: 'expense' },
  { name: 'Utilities', icon: '⚡', color: '#eab308', type: 'expense' },
  { name: 'Education', icon: '📚', color: '#06b6d4', type: 'expense' },
  { name: 'Travel', icon: '✈️', color: '#14b8a6', type: 'expense' },
  { name: 'Salary', icon: '💼', color: '#22c55e', type: 'income' },
  { name: 'Freelance', icon: '💻', color: '#10b981', type: 'income' },
  { name: 'Investment', icon: '📈', color: '#84cc16', type: 'income' },
  { name: 'Other', icon: '📦', color: '#6b7280', type: 'both' },
];

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, currency } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password, currency: currency || 'USD' });

    // Create default categories for this user
    const categories = DEFAULT_CATEGORIES.map(cat => ({ ...cat, user: user._id, isDefault: true }));
    await Category.insertMany(categories);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      monthlyBudget: user.monthlyBudget,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      monthlyBudget: user.monthlyBudget,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
  res.json(req.user);
});

// @route PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, currency, monthlyBudget } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (currency) user.currency = currency;
    if (monthlyBudget !== undefined) user.monthlyBudget = monthlyBudget;
    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, currency: user.currency, monthlyBudget: user.monthlyBudget });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
