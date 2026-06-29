import React, { useState, useEffect, useCallback } from 'react';
import { expenseAPI, categoryAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/format';
import ExpenseModal from '../components/ExpenseModal';
import toast from 'react-hot-toast';
import './Expenses.css';

const Expenses = () => {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [editExpense, setEditExpense] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [filters, setFilters] = useState({
    type: '', category: '', startDate: '', endDate: '', search: '', sortBy: 'date', order: 'desc',
  });

  const fetch = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await expenseAPI.getAll(params);
      setExpenses(data.expenses);
      setTotal(data.total);
      setPages(data.pages);
      setPage(p);
    } catch (e) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(1); }, [fetch]);
  useEffect(() => { categoryAPI.getAll().then(r => setCategories(r.data)); }, []);

  const handleDelete = async () => {
    try {
      await expenseAPI.delete(deleteId);
      toast.success('Transaction deleted');
      setDeleteId(null);
      fetch(page);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(p => ({ ...p, [name]: value }));
  };

  const handleSave = () => {
    setShowModal(false);
    setEditExpense(null);
    fetch(page);
  };

  const fmt = (n) => formatCurrency(n, cur);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <div className="page-subtitle">{total} total records</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditExpense(null); setShowModal(true); }}>+ Add Transaction</button>
      </div>

      {/* Filters */}
      <div className="card filters-bar">
        <input className="input-field filter-search" name="search" value={filters.search} onChange={handleFilterChange} placeholder="🔍 Search transactions..." />
        <select className="input-field" name="type" value={filters.type} onChange={handleFilterChange}>
          <option value="">All Types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <select className="input-field" name="category" value={filters.category} onChange={handleFilterChange}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
        </select>
        <input className="input-field" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
        <input className="input-field" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
        <button className="btn btn-secondary" onClick={() => setFilters({ type: '', category: '', startDate: '', endDate: '', search: '', sortBy: 'date', order: 'desc' })}>
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }} /></div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            No transactions found. <button className="btn btn-ghost btn-sm" onClick={() => { setEditExpense(null); setShowModal(true); }}>Add one →</button>
          </div>
        ) : (
          <div className="expense-table">
            <div className="table-header">
              <span>Transaction</span>
              <span>Category</span>
              <span>Date</span>
              <span>Payment</span>
              <span style={{ textAlign: 'right' }}>Amount</span>
              <span></span>
            </div>
            {expenses.map(exp => (
              <div key={exp._id} className="table-row">
                <div className="tx-name">
                  <div className="tx-icon" style={{ background: `${exp.category?.color}22`, color: exp.category?.color }}>
                    {exp.category?.icon || '📦'}
                  </div>
                  <div>
                    <div className="tx-title">{exp.title}</div>
                    {exp.notes && <div className="tx-notes">{exp.notes}</div>}
                    {exp.tags?.length > 0 && (
                      <div className="tx-tags">{exp.tags.map(t => <span key={t} className="tag">#{t}</span>)}</div>
                    )}
                  </div>
                </div>
                <div><span className="badge" style={{ background: `${exp.category?.color}22`, color: exp.category?.color }}>{exp.category?.name}</span></div>
                <div className="text-sm text-secondary">{formatDate(exp.date)}</div>
                <div className="text-sm text-muted" style={{ textTransform: 'capitalize' }}>{exp.paymentMethod?.replace('_', ' ')}</div>
                <div className={`tx-amount ${exp.type === 'income' ? 'text-green' : 'text-red'}`}>
                  {exp.type === 'income' ? '+' : '-'}{fmt(exp.amount)}
                </div>
                <div className="row-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditExpense(exp); setShowModal(true); }}>✏️</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => setDeleteId(exp._id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="pagination">
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => fetch(page - 1)}>← Prev</button>
          <span className="text-muted text-sm">Page {page} of {pages}</span>
          <button className="btn btn-secondary btn-sm" disabled={page === pages} onClick={() => fetch(page + 1)}>Next →</button>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <ExpenseModal expense={editExpense} onClose={() => { setShowModal(false); setEditExpense(null); }} onSave={handleSave} />
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Delete Transaction?</h2>
            <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px', fontSize: 14 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
