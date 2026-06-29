import React, { useState, useEffect } from 'react';
import { categoryAPI } from '../utils/api';
import toast from 'react-hot-toast';
import './Categories.css';

const ICONS = ['🍔','🚗','🛍️','🎮','🏥','⚡','📚','✈️','💼','💻','📈','🏠','🐾','💪','🎵','🎨','☕','🍺','💅','📦'];

const CategoryModal = ({ cat, onClose, onSave }) => {
  const [form, setForm] = useState({ name: '', icon: '📦', color: '#6366f1', type: 'expense' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cat) setForm({ name: cat.name, icon: cat.icon, color: cat.color, type: cat.type });
  }, [cat]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Name is required'); return; }
    setLoading(true);
    try {
      if (cat) await categoryAPI.update(cat._id, form);
      else await categoryAPI.create(form);
      toast.success(cat ? 'Category updated!' : 'Category created!');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{cat ? 'Edit Category' : 'New Category'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Name *</label>
            <input className="input-field" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Category name" required />
          </div>
          <div className="form-group">
            <label className="label">Type</label>
            <select className="input-field" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                style={{ width: 44, height: 44, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none', padding: 0 }} />
              <input className="input-field" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} style={{ flex: 1 }} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Icon</label>
            <div className="icon-grid">
              {ICONS.map(icon => (
                <button key={icon} type="button" className={`icon-btn ${form.icon === icon ? 'selected' : ''}`}
                  onClick={() => setForm(p => ({ ...p, icon }))}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="label">Preview</label>
            <div className="cat-preview" style={{ background: `${form.color}22`, borderColor: form.color }}>
              <span style={{ fontSize: 22 }}>{form.icon}</span>
              <span style={{ color: form.color, fontWeight: 600 }}>{form.name || 'Category Name'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | category object
  const [deleteId, setDeleteId] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await categoryAPI.getAll();
      setCategories(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleDelete = async () => {
    try {
      await categoryAPI.delete(deleteId);
      toast.success('Category deleted');
      setDeleteId(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete this category');
      setDeleteId(null);
    }
  };

  const userCats = categories.filter(c => c.user);
  const defaultCats = categories.filter(c => !c.user);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <div className="page-subtitle">Organize your spending</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ New Category</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}><div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }} /></div>
      ) : (
        <>
          {userCats.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h3 className="section-label">Custom Categories</h3>
              <div className="categories-grid">
                {userCats.map(cat => (
                  <div key={cat._id} className="cat-card">
                    <div className="cat-icon" style={{ background: `${cat.color}22`, color: cat.color }}>{cat.icon}</div>
                    <div className="cat-info">
                      <div className="cat-name">{cat.name}</div>
                      <span className={`badge ${cat.type === 'income' ? 'badge-income' : cat.type === 'expense' ? 'badge-expense' : ''}`}>
                        {cat.type}
                      </span>
                    </div>
                    <div className="cat-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setModal(cat)}>✏️</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => setDeleteId(cat._id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="section-label">Default Categories</h3>
            <div className="categories-grid">
              {defaultCats.map(cat => (
                <div key={cat._id} className="cat-card">
                  <div className="cat-icon" style={{ background: `${cat.color}22`, color: cat.color }}>{cat.icon}</div>
                  <div className="cat-info">
                    <div className="cat-name">{cat.name}</div>
                    <span className={`badge ${cat.type === 'income' ? 'badge-income' : cat.type === 'expense' ? 'badge-expense' : ''}`}>
                      {cat.type}
                    </span>
                  </div>
                  <div className="cat-actions" style={{ color: 'var(--text-muted)', fontSize: 12 }}>default</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {(modal === 'new' || (modal && modal._id)) && (
        <CategoryModal cat={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={() => { setModal(null); fetch(); }} />
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Delete Category?</h2>
            <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px', fontSize: 14 }}>This will not delete existing transactions using this category.</p>
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

export default Categories;
