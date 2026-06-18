import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, IndianRupee, TrendingUp, TrendingDown, Package,
  HardHat, Receipt, Plus, AlertTriangle, CheckCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { expenseAPI } from '../../api';
import { useApp } from '../../context/AppContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Badge from '../../components/shared/Badge';
import { formatCurrency, formatDate, CATEGORY_COLORS } from '../../utils/helpers';

// ─── FINANCE TILE ─────────────────────────────────────────────────────────────
function FinanceTile({ label, value, sub, color = 'text-secondary', bg = 'bg-white' }) {
  return (
    <div className={`${bg} rounded-xl border border-gray-100 shadow-card p-4`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── BUDGET PROGRESS BAR ──────────────────────────────────────────────────────
function BudgetBar({ used, total, label }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold">{pct}% of budget</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const PIE_COLORS = ['#E85C2C','#F5A623','#3B82F6','#8B5CF6','#10B981','#EC4899','#6366F1','#F97316','#0EA5E9'];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { showToast } = useApp();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expenseAPI.getProjectCosts(id);
      setData(res.data);
    } catch (err) {
      showToast(err.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;
  if (!data)   return (
    <div className="text-center py-20">
      <p className="text-gray-400">Project not found.</p>
      <Link to="/dashboard/projects" className="text-primary text-sm mt-2 inline-block">← Back</Link>
    </div>
  );

  const { project, financials, expenseByCategory, materialCostByCategory, laborByWorker, recentExpenses } = data;
  const { budget, amountReceived, directExpenses, totalMaterialCost, totalLaborCost, totalCost,
          remainingBudget, profit, profitPercent, budgetUtilizationPercent } = financials;

  const isProfit  = profit >= 0;
  const isOverBudget = totalCost > (budget || 0);

  // Pie data — cost composition
  const compositionData = [
    { name: 'Direct Expenses', value: directExpenses },
    { name: 'Materials',       value: totalMaterialCost },
    { name: 'Labor',           value: totalLaborCost },
  ].filter(d => d.value > 0);

  // Bar data — expenses by category
  const categoryBar = expenseByCategory.map(c => ({
    name: c._id,
    amount: c.total,
    fill: CATEGORY_COLORS[c._id]?.hex || '#6b7280',
  }));

  // Material category breakdown
  const matCategories = Object.entries(materialCostByCategory).map(([cat, val]) => ({ cat, val }))
    .sort((a, b) => b.val - a.val);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link to="/dashboard/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary flex-shrink-0">
          <ArrowLeft className="w-4 h-4" /> Projects
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-secondary">{project.projectName}</h1>
            <Badge status={project.status} />
            <span className="text-xs text-gray-400">{project.projectCode}</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{project.location || ''}</p>
        </div>
        <Link
          to={`/dashboard/expenses?project=${id}`}
          className="btn-primary text-sm py-2"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </Link>
      </div>

      {/* ── Status alerts ── */}
      {isOverBudget && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span><strong>Over Budget!</strong> Total costs ({formatCurrency(totalCost)}) exceed the budget ({formatCurrency(budget)}) by {formatCurrency(totalCost - budget)}.</span>
        </div>
      )}
      {!isProfit && amountReceived > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl text-sm">
          <TrendingDown className="w-5 h-5 flex-shrink-0" />
          <span><strong>Running at a loss.</strong> Total costs exceed amount received by {formatCurrency(Math.abs(profit))}.</span>
        </div>
      )}

      {/* ── Finance tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <FinanceTile label="Budget"          value={formatCurrency(budget)}         sub="Contract value" />
        <FinanceTile label="Amount Received" value={formatCurrency(amountReceived)} sub="From client"      color="text-green-600" />
        <FinanceTile label="Total Cost So Far" value={formatCurrency(totalCost)}    sub="All expenses"    color={isOverBudget ? 'text-red-600' : 'text-secondary'} />
        <FinanceTile
          label="Profit / Loss"
          value={formatCurrency(Math.abs(profit))}
          sub={`${isProfit ? 'Profit' : 'Loss'} — ${Math.abs(profitPercent)}%`}
          color={isProfit ? 'text-green-600' : 'text-red-600'}
          bg={isProfit ? 'bg-green-50' : 'bg-red-50'}
        />
      </div>

      {/* ── Budget utilization ── */}
      <div className="card">
        <h2 className="font-semibold text-secondary mb-4">Budget Utilization</h2>
        <BudgetBar used={totalCost}          total={budget}          label={`Total Cost: ${formatCurrency(totalCost)}`} />
        <BudgetBar used={directExpenses}     total={budget}          label={`Direct Expenses: ${formatCurrency(directExpenses)}`} />
        <BudgetBar used={totalMaterialCost}  total={budget}          label={`Material Cost: ${formatCurrency(totalMaterialCost)}`} />
        <BudgetBar used={totalLaborCost}     total={budget}          label={`Labor Cost: ${formatCurrency(totalLaborCost)}`} />

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 text-center text-sm">
          <div className="bg-orange-50 rounded-xl p-3">
            <Receipt className="w-5 h-5 text-orange-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-orange-700">{formatCurrency(directExpenses)}</p>
            <p className="text-xs text-orange-600">Direct Expenses</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <Package className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-700">{formatCurrency(totalMaterialCost)}</p>
            <p className="text-xs text-blue-600">Materials ({data.materialCount})</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3">
            <HardHat className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-purple-700">{formatCurrency(totalLaborCost)}</p>
            <p className="text-xs text-purple-600">Labor ({data.workerCount} workers)</p>
          </div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost composition pie */}
        {compositionData.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-secondary mb-4">Cost Composition</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={compositionData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {compositionData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Expense by category bar */}
        {categoryBar.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-secondary mb-4">Direct Expenses by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryBar} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {categoryBar.map((c, i) => <Cell key={i} fill={c.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Material breakdown + Labor breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material by category */}
        <div className="card">
          <h3 className="font-semibold text-secondary mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" /> Material Cost Breakdown
          </h3>
          {matCategories.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No materials recorded for this project.</p>
          ) : (
            <div className="space-y-2">
              {matCategories.map(({ cat, val }) => {
                const pct = totalMaterialCost > 0 ? Math.round((val / totalMaterialCost) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{cat}</span>
                      <span className="font-semibold">{formatCurrency(val)} <span className="text-gray-400">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100 font-semibold">
                <span>Total Material Cost</span>
                <span className="text-secondary">{formatCurrency(totalMaterialCost)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Labor by worker */}
        <div className="card">
          <h3 className="font-semibold text-secondary mb-4 flex items-center gap-2">
            <HardHat className="w-4 h-4 text-purple-600" /> Labor Cost by Worker
          </h3>
          {laborByWorker.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No salary records found for workers on this project.</p>
          ) : (
            <div className="space-y-2">
              {laborByWorker.map(w => {
                const pct = totalLaborCost > 0 ? Math.round((w.totalGross / totalLaborCost) * 100) : 0;
                return (
                  <div key={w._id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <Link to={`/dashboard/workers/${w._id}`} className="text-sm font-medium text-secondary hover:text-primary">
                        {w.workerName}
                      </Link>
                      <p className="text-xs text-gray-400">{pct}% of labor cost</p>
                    </div>
                    <span className="text-sm font-semibold text-secondary">{formatCurrency(w.totalGross)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100 font-semibold">
                <span>Total Labor Cost</span>
                <span className="text-secondary">{formatCurrency(totalLaborCost)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent expenses ── */}
      {recentExpenses.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary">Recent Expenses</h3>
            <Link to={`/dashboard/expenses?project=${id}`} className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Date', 'Category', 'Description', 'Vendor', 'Amount'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentExpenses.map(e => (
                  <tr key={e._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{formatDate(e.date)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`badge text-xs ${CATEGORY_COLORS[e.category]?.bg || 'bg-gray-100'} ${CATEGORY_COLORS[e.category]?.text || 'text-gray-600'}`}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-secondary font-medium">{e.description}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{e.vendor || '—'}</td>
                    <td className="px-3 py-2.5 font-bold text-secondary">{formatCurrency(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
