import React, { useEffect, useState, useCallback } from 'react';
import { dashboardAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/format';
import ExpenseModal from '../components/ExpenseModal';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import './Dashboard.css';

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
    <div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [trend, setTrend] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, b, t, r] = await Promise.all([
        dashboardAPI.getSummary(),
        dashboardAPI.getCategoryBreakdown(),
        dashboardAPI.getMonthlyTrend(),
        dashboardAPI.getRecent(),
      ]);
      setSummary(s.data);
      setBreakdown(b.data);
      setTrend(t.data);
      setRecent(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fmt = (n) => formatCurrency(n, cur);
  const tm = summary?.thisMonth;
  const lm = summary?.lastMonth;
  const expenseDiff = tm && lm ? ((tm.expense - lm.expense) / (lm.expense || 1) * 100).toFixed(1) : 0;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-subtitle">Hello, {user?.name?.split(' ')[0]} 👋 Here's your financial overview</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Transaction</button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Balance This Month" value={fmt(tm?.balance)} icon="⚖️" color="#6366f1"
          sub={`${summary?.thisMonth?.transactionCount || 0} transactions`} />
        <StatCard label="Total Income" value={fmt(tm?.income)} icon="📥" color="#22c55e"
          sub={`vs ${fmt(lm?.income)} last month`} />
        <StatCard label="Total Expenses" value={fmt(tm?.expense)} icon="📤" color="#ef4444"
          sub={`${expenseDiff > 0 ? '+' : ''}${expenseDiff}% vs last month`} />
        {user?.monthlyBudget > 0 && (
          <StatCard label="Budget Used" icon="🎯" color="#eab308"
            value={`${Math.min(((tm?.expense / user.monthlyBudget) * 100) || 0, 100).toFixed(0)}%`}
            sub={`of ${fmt(user.monthlyBudget)}`} />
        )}
      </div>

      <div className="charts-grid">
        {/* Trend chart */}
        <div className="card chart-card">
          <h3 className="chart-title">Monthly Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={60}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 13 }}
                formatter={(v) => fmt(v)} />
              <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#gIncome)" strokeWidth={2} name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#gExpense)" strokeWidth={2} name="Expense" />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="card chart-card">
          <h3 className="chart-title">Spending by Category</h3>
          {breakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={breakdown} dataKey="total" nameKey="name" cx="40%" cy="50%" outerRadius={75} innerRadius={45}>
                  {breakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 13 }}
                  formatter={(v) => fmt(v)} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
                  formatter={(val, entry) => `${entry.payload.icon} ${val}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">No expense data this month</div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="chart-title" style={{ marginBottom: 0 }}>Recent Transactions</h3>
          <a href="/expenses" className="btn btn-ghost btn-sm">View all →</a>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">No transactions yet. <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(true)}>Add one →</button></div>
        ) : (
          <div className="recent-list">
            {recent.map(exp => (
              <div key={exp._id} className="recent-item">
                <div className="recent-icon" style={{ background: `${exp.category?.color}22`, color: exp.category?.color }}>
                  {exp.category?.icon || '📦'}
                </div>
                <div className="recent-info">
                  <div className="recent-title">{exp.title}</div>
                  <div className="recent-meta">{exp.category?.name} · {formatDate(exp.date)}</div>
                </div>
                <div className={`recent-amount ${exp.type === 'income' ? 'text-green' : 'text-red'}`}>
                  {exp.type === 'income' ? '+' : '-'}{fmt(exp.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ExpenseModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchAll(); }} />
      )}
    </div>
  );
};

export default Dashboard;
