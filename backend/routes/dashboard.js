const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

// @route GET /api/dashboard/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // This month
    const thisMonthData = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    // Last month
    const lastMonthData = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    const parseData = (data) => {
      const result = { income: 0, expense: 0 };
      data.forEach(d => { result[d._id] = d.total; });
      return result;
    };

    const thisMonth = parseData(thisMonthData);
    const lastMonth = parseData(lastMonthData);

    const totalCount = thisMonthData.reduce((acc, d) => acc + (d.count || 0), 0);

    res.json({
      thisMonth: {
        income: thisMonth.income,
        expense: thisMonth.expense,
        balance: thisMonth.income - thisMonth.expense,
        transactionCount: totalCount,
      },
      lastMonth: {
        income: lastMonth.income,
        expense: lastMonth.expense,
        balance: lastMonth.income - lastMonth.expense,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route GET /api/dashboard/category-breakdown
router.get('/category-breakdown', protect, async (req, res) => {
  try {
    const { month, year, type = 'expense' } = req.query;
    const now = new Date();
    const m = month ? parseInt(month) - 1 : now.getMonth();
    const y = year ? parseInt(year) : now.getFullYear();

    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59);

    const breakdown = await Expense.aggregate([
      { $match: { user: req.user._id, type, date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { total: 1, count: 1, name: '$category.name', icon: '$category.icon', color: '$category.color' } },
      { $sort: { total: -1 } },
    ]);

    res.json(breakdown);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route GET /api/dashboard/monthly-trend
router.get('/monthly-trend', protect, async (req, res) => {
  try {
    const months = 6;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    const trend = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: start } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Build structured response
    const result = {};
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      result[key] = { month: key, income: 0, expense: 0, label: d.toLocaleString('default', { month: 'short', year: '2-digit' }) };
    }

    trend.forEach(t => {
      const key = `${t._id.year}-${t._id.month}`;
      if (result[key]) result[key][t._id.type] = t.total;
    });

    res.json(Object.values(result));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route GET /api/dashboard/recent
router.get('/recent', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id })
      .populate('category', 'name icon color')
      .sort({ date: -1 })
      .limit(5);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
