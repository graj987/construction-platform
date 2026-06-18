import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, IndianRupee, FolderOpen,
  AlertTriangle, CheckCircle, ChevronRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine,
} from 'recharts';
import { expenseAPI } from '../../api';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/shared/PageHeader';
import StatCard from '../../components/shared/StatCard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import Badge from '../../components/shared/Badge';
import { formatCurrency } from '../../utils/helpers';

// ─── PROFIT BADGE ─────────────────────────────────────────────────────────────
function ProfitBadge({ profit, pct }) {
  const isProfit = profit >= 0;
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      isProfit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {isProfit
        ? <TrendingUp className="w-3.5 h-3.5" />
        : <TrendingDown className="w-3.5 h-3.5" />
      }
      {isProfit ? '+' : ''}{formatCurrency(profit)}
      {pct !== 0 && <span className="opacity-75">({Math.abs(pct)}%)</span>}
    </div>
  );
}

// ─── BUDGET BAR ───────────────────────────────────────────────────────────────
function MiniBar({ used, total }) {
  if (!total) return <span className="text-gray-300 text-xs">—</span>;
  const pct = Math.min(100, Math.round((used / total) * 100));
  const color = pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="text-xs text-gray-500 flex-shrink-0">{pct}%</span>
    </div>
  );
}

export default function ProfitabilityPage() {
  const { showToast } = useApp();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    expenseAPI.getProfitability()
      .then(r => setData(r.data))
      .catch(err => showToast(err.message || 'Failed', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;
  if (!data)   return <EmptyState icon={TrendingUp} title="Could not load data" />;

  const { projects = [], summary = {} } = data;

  // Chart: profit per project (top 10)
  const chartData = projects.slice(0, 10).map(p => ({
    name: p.projectName.length > 14 ? p.projectName.slice(0, 12) + '…' : p.projectName,
    profit: p.profit,
    fill: p.isProfit ? '#16a34a' : '#dc2626',
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Profitability"
        subtitle="Budget vs actual cost analysis across all projects"
      />

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Budget"
          value={formatCurrency(summary.totalBudget)}
          icon={FolderOpen}
          color="blue"
        />
        <StatCard
          title="Total Received"
          value={formatCurrency(summary.totalReceived)}
          icon={IndianRupee}
          color="green"
          subtitle="From clients"
        />
        <StatCard
          title="Total Cost"
          value={formatCurrency(summary.totalCost)}
          icon={IndianRupee}
          color="orange"
          subtitle="All expenses + labor + material"
        />
        <div className="stat-card">
          <p className="text-sm text-gray-500 font-medium">Net Profit / Loss</p>
          <p className={`text-2xl font-bold mt-1 ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(summary.totalProfit))}
          </p>
          <p className={`text-xs mt-0.5 font-medium ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary.totalProfit >= 0 ? '↑ Overall Profit' : '↓ Overall Loss'}
          </p>
        </div>
      </div>

      {/* ── Profitable vs Loss count ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Profitable Projects</p>
            <p className="text-3xl font-bold text-green-600">{summary.profitableProjects}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Loss / At Risk</p>
            <p className="text-3xl font-bold text-red-600">{summary.lossProjects}</p>
          </div>
        </div>
      </div>

      {/* ── Profit chart ── */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-secondary mb-4">Profit / Loss by Project</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={v => [formatCurrency(v), v >= 0 ? 'Profit' : 'Loss']}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              />
              <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={2} />
              <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                {chartData.map((c, i) => <Cell key={i} fill={c.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Project table ── */}
      {projects.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No projects found" description="Add projects and record expenses to see profitability data." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Project', 'Status', 'Budget', 'Received', 'Total Cost', 'Budget Used', 'Profit / Loss', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projects.map(p => (
                  <tr
                    key={p._id}
                    className={`hover:bg-gray-50 transition-colors ${!p.isProfit && p.amountReceived > 0 ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-secondary">{p.projectName}</p>
                        <p className="text-xs text-gray-400">{p.projectCode}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge status={p.status} /></td>
                    <td className="px-4 py-3 text-gray-600">{formatCurrency(p.budget)}</td>
                    <td className="px-4 py-3 font-medium text-green-600">{formatCurrency(p.amountReceived)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-secondary">{formatCurrency(p.totalCost)}</p>
                        <p className="text-xs text-gray-400">
                          Exp: {formatCurrency(p.directExpenses)} · Mat: {formatCurrency(p.materialCost)} · Labor: {formatCurrency(p.laborCost)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <MiniBar used={p.totalCost} total={p.budget} />
                    </td>
                    <td className="px-4 py-3">
                      <ProfitBadge profit={p.profit} pct={p.profitPercent} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/dashboard/projects/${p._id}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                      >
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
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
