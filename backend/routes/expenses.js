const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

// @route GET /api/expenses
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, startDate, endDate, search, sortBy = 'date', order = 'desc' } = req.query;

    const query = { user: req.user._id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (search) query.title = { $regex: search, $options: 'i' };

    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .populate('category', 'name icon color')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      expenses,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route POST /api/expenses
router.post('/', protect, async (req, res) => {
  try {
    const { title, amount, type, category, date, notes, paymentMethod, tags } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({ message: 'Title, amount, and category are required' });
    }

    const expense = await Expense.create({
      user: req.user._id,
      title,
      amount,
      type: type || 'expense',
      category,
      date: date || new Date(),
      notes,
      paymentMethod: paymentMethod || 'cash',
      tags,
    });

    const populated = await expense.populate('category', 'name icon color');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route GET /api/expenses/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id })
      .populate('category', 'name icon color');
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route PUT /api/expenses/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const { title, amount, type, category, date, notes, paymentMethod, tags } = req.body;
    if (title) expense.title = title;
    if (amount) expense.amount = amount;
    if (type) expense.type = type;
    if (category) expense.category = category;
    if (date) expense.date = date;
    if (notes !== undefined) expense.notes = notes;
    if (paymentMethod) expense.paymentMethod = paymentMethod;
    if (tags) expense.tags = tags;

    await expense.save();
    const populated = await expense.populate('category', 'name icon color');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route DELETE /api/expenses/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
