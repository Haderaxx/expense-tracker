import React, { useState, useEffect } from 'react';
import { expenseAPI, categoryAPI } from '../utils/api';
import { formatDateInput, PAYMENT_METHODS } from '../utils/format';
import toast from 'react-hot-toast';

const ExpenseModal = ({ expense, onClose, onSave }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: '',
    date: formatDateInput(new Date()),
    notes: '',
    paymentMethod: 'cash',
    tags: '',
  });

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data));
  }, []);

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title,
        amount: expense.amount,
        type: expense.type,
        category: expense.category?._id || expense.category,
        date: formatDateInput(expense.date),
        notes: expense.notes || '',
        paymentMethod: expense.paymentMethod,
        tags: expense.tags?.join(', ') || '',
      });
    }
  }, [expense]);

  const filtered = categories.filter(c => c.type === form.type || c.type === 'both');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (name === 'type') setForm(p => ({ ...p, type: value, category: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.category) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      let result;
      if (expense) {
        result = await expenseAPI.update(expense._id, payload);
      } else {
        result = await expenseAPI.create(payload);
      }
      toast.success(expense ? 'Transaction updated!' : 'Transaction added!');
      onSave(result.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{expense ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Type toggle */}
          <div className="form-group">
            <div className="type-toggle">
              <button type="button" className={`toggle-btn ${form.type === 'expense' ? 'active expense' : ''}`}
                onClick={() => setForm(p => ({ ...p, type: 'expense', category: '' }))}>
                📤 Expense
              </button>
              <button type="button" className={`toggle-btn ${form.type === 'income' ? 'active income' : ''}`}
                onClick={() => setForm(p => ({ ...p, type: 'income', category: '' }))}>
                📥 Income
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Title *</label>
            <input className="input-field" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Netflix subscription" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="label">Amount *</label>
              <input className="input-field" type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0.00" min="0.01" step="0.01" required />
            </div>
            <div className="form-group">
              <label className="label">Date *</label>
              <input className="input-field" type="date" name="date" value={form.date} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Category *</label>
            <select className="input-field" name="category" value={form.category} onChange={handleChange} required>
              <option value="">Select category</option>
              {filtered.map(c => (
                <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Payment Method</label>
            <select className="input-field" name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
              {PAYMENT_METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.icon} {m.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Notes</label>
            <textarea className="input-field" name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Optional notes..." style={{ resize: 'vertical' }} />
          </div>

          <div className="form-group">
            <label className="label">Tags (comma-separated)</label>
            <input className="input-field" name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. recurring, essential" />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? <span className="spinner" /> : (expense ? 'Update' : 'Add Transaction')}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .type-toggle { display: flex; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 3px; gap: 3px; }
        .toggle-btn { flex: 1; padding: 8px; border: none; background: transparent; color: var(--text-muted); border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .toggle-btn.active.expense { background: var(--red-light); color: var(--red); }
        .toggle-btn.active.income { background: var(--green-light); color: var(--green); }
      `}</style>
    </div>
  );
};

export default ExpenseModal;
