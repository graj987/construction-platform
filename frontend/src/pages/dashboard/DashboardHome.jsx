import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, FolderOpen, HardHat, FileText, TrendingUp,
  Receipt, IndianRupee, AlertCircle, Wallet, ArrowDownUp,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart, Line,
} from 'recharts';
import { dashboardAPI, expenseAPI, paymentAPI } from '../../api';
import StatCard from '../../components/shared/StatCard';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { formatDate, formatCurrency, CATEGORY_COLORS } from '../../utils/helpers';

const PIE_COLORS = ['#E85C2C','#F5A623','#3B82F6','#8B5CF6','#10B981','#EC4899','#6366F1','#F97316','#0EA5E9','#84CC16'];

export default function DashboardHome() {
  const [data,      setData]      = useState(null);
  const [expStats,  setExpStats]  = useState(null);
  const [payStats,  setPayStats]  = useState(null);
  const [cashFlow,  setCashFlow]  = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardAPI.getStats(),
      expenseAPI.getStats(),
      paymentAPI.getStats(),
      paymentAPI.getCashFlow(),
    ])
      .then(([dash, exp, pay, cf]) => {
        setData(dash.data);
        setExpStats(exp.data);
        setPayStats(pay.data);
        setCashFlow(cf.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  const { stats = {}, clientGrowth = [], projectStatus = [], recentClients = [], recentProjects = [] } = data || {};
  const categoryData = (expStats?.byCategory || []).map(c => ({
    name: c._id, value: c.total, color: CATEGORY_COLORS[c._id]?.hex || '#6b7280',
  }));

  // Merge cash-flow trend for composite chart
  const cfTrend = cashFlow?.trend || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's your complete business overview.</p>
      </div>

      {/* ── Row 1: Core ops ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Clients"       value={stats.totalClients ?? 0}      icon={Users}      color="blue" />
        <StatCard title="Active Projects"     value={stats.activeProjects ?? 0}    icon={FolderOpen} color="primary" />
        <StatCard title="Active Workers"      value={stats.totalWorkers ?? 0}      icon={HardHat}    color="green" />
        <StatCard title="Pending Quotations"  value={stats.pendingQuotations ?? 0} icon={FileText}   color="orange" />
      </div>

      {/* ── Row 2: Cash position ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Received"
          value={formatCurrency(stats.totalReceivedAll || 0)}
          icon={Wallet}
          color="green"
          subtitle="All payments"
        />
        <StatCard
          title="This Month Received"
          value={formatCurrency(stats.monthReceived || 0)}
          icon={IndianRupee}
          color="blue"
          subtitle="Current month"
        />
        <StatCard
          title="Pending Receivables"
          value={formatCurrency(stats.pendingReceivables || 0)}
          icon={ArrowDownUp}
          color="orange"
          subtitle="Yet to collect"
        />
        <div className={`stat-card ${stats.cashBalance >= 0 ? '' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Cash Balance</p>
              <p className={`text-2xl font-bold mt-1 ${stats.cashBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(stats.cashBalance || 0))}
              </p>
              <p className={`text-xs mt-0.5 font-medium ${stats.cashBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.cashBalance >= 0 ? '↑ Positive' : '↓ Deficit'}
              </p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${stats.cashBalance >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Overdue / pending alerts ── */}
      {(stats.overdueCount > 0 || stats.pendingSalary > 0) && (
        <div className="flex flex-wrap gap-3">
          {stats.overdueCount > 0 && (
            <Link to="/dashboard/receivables" className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
              <AlertTriangle className="w-4 h-4" />
              {stats.overdueCount} overdue milestone{stats.overdueCount > 1 ? 's' : ''} — collect now
            </Link>
          )}
          {stats.pendingSalary > 0 && (
            <Link to="/dashboard/salary" className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-yellow-100 transition-colors">
              <AlertCircle className="w-4 h-4" />
              {formatCurrency(stats.pendingSalary)} unpaid wages pending
            </Link>
          )}
        </div>
      )}

      {/* ── Row 4: Cash flow chart + project status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary flex items-center gap-2">
              <ArrowDownUp className="w-4 h-4 text-primary" /> Cash Flow (6 months)
            </h3>
            <Link to="/dashboard/receivables" className="text-xs text-primary hover:underline font-medium">Details →</Link>
          </div>
          {cfTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={cfTrend}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Bar dataKey="cashIn"  name="Cash In"  fill="#16a34a" radius={[3,3,0,0]} />
                <Bar dataKey="cashOut" name="Cash Out" fill="#dc2626" radius={[3,3,0,0]} />
                <Line dataKey="net" name="Net" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No cash flow data yet</div>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-secondary mb-4">Project Status</h3>
          {projectStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={projectStatus.map(s => ({ name: s._id, value: s.count }))} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
                  {projectStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No projects yet</div>
          )}
        </div>
      </div>

      {/* ── Row 5: Expense trend + category breakdown ── */}
      {expStats && (expStats.monthlyTrend?.length > 0 || categoryData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-secondary flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" /> Monthly Expense Trend
              </h3>
              <Link to="/dashboard/expenses" className="text-xs text-primary hover:underline font-medium">View All →</Link>
            </div>
            {expStats.monthlyTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={expStats.monthlyTrend}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => [formatCurrency(v), 'Expenses']} />
                  <Bar dataKey="total" fill="#E85C2C" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No expense data yet</div>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold text-secondary mb-4">Expenses by Category</h3>
            {categoryData.length > 0 ? (
              <div className="space-y-2">
                {categoryData.slice(0, 6).map(c => {
                  const tot = categoryData.reduce((s, x) => s + x.value, 0);
                  const pct = tot > 0 ? Math.round((c.value / tot) * 100) : 0;
                  return (
                    <div key={c.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{c.name}</span>
                        <span className="font-semibold text-secondary">{formatCurrency(c.value)} <span className="text-gray-400">({pct}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No expense data</div>
            )}
          </div>
        </div>
      )}

      {/* ── Row 6: Recent clients + recent payments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-secondary mb-4">Recent Clients</h3>
          {recentClients.length > 0 ? (
            <table className="w-full text-sm">
              <thead><tr className="text-gray-400 text-xs border-b border-gray-100"><th className="text-left pb-2">Name</th><th className="text-left pb-2">Location</th><th className="text-left pb-2">Status</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {recentClients.map(c => (
                  <tr key={c._id}><td className="py-2.5 font-medium text-secondary">{c.name}</td><td className="py-2.5 text-gray-500">{c.location || '—'}</td><td className="py-2.5"><Badge status={c.status} /></td></tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-gray-400 text-sm">No clients yet.</p>}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary">Recent Payments</h3>
            <Link to="/dashboard/payments" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {payStats?.recentPayments?.length > 0 ? (
            <div className="space-y-2">
              {payStats.recentPayments.map(p => (
                <div key={p._id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-secondary">{p.project?.projectName || '—'}</p>
                    <p className="text-xs text-gray-400">{p.client?.name || '—'} · {formatDate(p.paymentDate)}</p>
                  </div>
                  <span className="font-bold text-green-600 text-sm">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No payments recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
