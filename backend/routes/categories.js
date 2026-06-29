const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

// @route GET /api/categories
router.get('/', protect, async (req, res) => {
  try {
    const categories = await Category.find({
      $or: [{ user: req.user._id }, { user: null }],
    }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route POST /api/categories
router.post('/', protect, async (req, res) => {
  try {
    const { name, icon, color, type } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const category = await Category.create({
      user: req.user._id,
      name,
      icon: icon || '📦',
      color: color || '#6366f1',
      type: type || 'expense',
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route PUT /api/categories/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
    if (!category) return res.status(404).json({ message: 'Category not found or not editable' });

    const { name, icon, color, type } = req.body;
    if (name) category.name = name;
    if (icon) category.icon = icon;
    if (color) category.color = color;
    if (type) category.type = type;

    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route DELETE /api/categories/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!category) return res.status(404).json({ message: 'Category not found or not deletable' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
