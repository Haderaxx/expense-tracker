const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null = system/default category
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters'],
  },
  icon: {
    type: String,
    default: '📦',
  },
  color: {
    type: String,
    default: '#6366f1',
  },
  type: {
    type: String,
    enum: ['expense', 'income', 'both'],
    default: 'expense',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
