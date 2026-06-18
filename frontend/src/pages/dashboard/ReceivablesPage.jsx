import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownUp, AlertTriangle, CheckCircle, IndianRupee,
  Users, CalendarX, ChevronRight, TrendingUp,
} from 'lucide-react';
import { paymentAPI } from '../../api';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/shared/PageHeader';
import StatCard from '../../components/shared/StatCard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import Badge from '../../components/shared/Badge';
import { formatCurrency, formatDate } from '../../utils/helpers';

// ─── COLLECTION PROGRESS BAR ──────────────────────────────────────────────────

function CollectionBar({ received, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0;
  const color = pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-blue-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="text-xs text-gray-500 flex-shrink-0 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function ReceivablesPage() {
  const { showToast } = useApp();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentAPI.getReceivables()
      .then(r => setData(r.data))
      .catch(err => showToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;
  if (!data)   return <EmptyState icon={ArrowDownUp} title="Could not load receivables" />;

  const { receivables = [], summary = {}, overdueMilestones = [] } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receivables"
        subtitle="Client-wise pending amounts and overdue milestones"
        action={
          <Link to="/dashboard/payments" className="btn-primary text-sm py-2">
            <IndianRupee className="w-4 h-4" /> Record Payment
          </Link>
        }
      />

      {/* ── Summary tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Contracted"
          value={formatCurrency(summary.totalBudget)}
          icon={IndianRupee}
          color="blue"
          subtitle="Sum of all project budgets"
        />
        <StatCard
          title="Total Collected"
          value={formatCurrency(summary.totalReceived)}
          icon={CheckCircle}
          color="green"
          subtitle="Payments received"
        />
        <StatCard
          title="Pending Collection"
          value={formatCurrency(summary.totalPending)}
          icon={ArrowDownUp}
          color="orange"
          subtitle={`${summary.clientsWithBalance} client${summary.clientsWithBalance !== 1 ? 's' : ''} outstanding`}
        />
        <div className={`stat-card ${overdueMilestones.length > 0 ? 'bg-red-50 border-red-200' : ''}`}>
          <p className="text-sm text-gray-500 font-medium">Overdue Milestones</p>
          <p className={`text-2xl font-bold mt-1 ${overdueMilestones.length > 0 ? 'text-red-600' : 'text-secondary'}`}>
            {overdueMilestones.length}
          </p>
          <p className={`text-xs mt-0.5 ${overdueMilestones.length > 0 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            {overdueMilestones.length > 0 ? 'Needs immediate follow-up' : 'All milestones on track'}
          </p>
        </div>
      </div>

      {/* ── Overdue Milestones ── */}
      {overdueMilestones.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-secondary mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Overdue Milestones ({overdueMilestones.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Project', 'Client', 'Milestone', 'Due Date', 'Expected', 'Received', 'Pending', ''].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {overdueMilestones.map(m => {
                  const pending = Math.max(0, m.expectedAmount - (m.receivedAmount || 0));
                  return (
                    <tr key={m._id} className="hover:bg-red-50/30 bg-red-50/20 transition-colors">
                      <td className="px-3 py-2.5">
                        <Link
                          to={`/dashboard/projects/${m.project?._id}`}
                          className="font-medium text-secondary hover:text-primary"
                        >
                          {m.project?.projectName || '—'}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs">
                        {m.project?.client?.name || '—'}
                        {m.project?.client?.phone && (
                          <a
                            href={`tel:${m.project.client.phone}`}
                            className="block text-primary hover:underline"
                          >
                            {m.project.client.phone}
                          </a>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-secondary">{m.title}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-red-600 text-xs font-semibold">{formatDate(m.dueDate)}</span>
                      </td>
                      <td className="px-3 py-2.5 text-secondary">{formatCurrency(m.expectedAmount)}</td>
                      <td className="px-3 py-2.5 text-green-600">{formatCurrency(m.receivedAmount || 0)}</td>
                      <td className="px-3 py-2.5 font-bold text-red-600">{formatCurrency(pending)}</td>
                      <td className="px-3 py-2.5">
                        <Link
                          to={`/dashboard/payments?project=${m.project?._id}`}
                          className="text-xs text-primary hover:underline font-medium whitespace-nowrap"
                        >
                          Record →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Client receivables table ── */}
      {receivables.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No receivables data"
          description="Add projects with budgets and record payments to see receivables by client."
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-secondary flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Client-wise Receivables ({receivables.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Client', 'Projects', 'Total Contracted', 'Collected', 'Collection %', 'Pending', 'Last Payment', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {receivables.map((r, idx) => {
                  const hasBalance = r.pendingAmount > 0;
                  return (
                    <tr key={idx} className={`hover:bg-gray-50 transition-colors ${hasBalance ? '' : 'opacity-60'}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-secondary">{r.client?.name || 'Unknown'}</p>
                          {r.client?.phone && (
                            <a href={`tel:${r.client.phone}`} className="text-xs text-primary hover:underline">
                              {r.client.phone}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {r.projects.slice(0, 2).map(p => (
                            <Link
                              key={p._id}
                              to={`/dashboard/projects/${p._id}`}
                              className="block text-xs text-gray-500 hover:text-primary truncate max-w-[140px]"
                            >
                              {p.projectName}
                            </Link>
                          ))}
                          {r.projects.length > 2 && (
                            <p className="text-xs text-gray-400">+{r.projects.length - 2} more</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-secondary">{formatCurrency(r.totalBudget)}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{formatCurrency(r.totalReceived)}</td>
                      <td className="px-4 py-3">
                        <CollectionBar received={r.totalReceived} total={r.totalBudget} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${hasBalance ? 'text-red-600' : 'text-green-600'}`}>
                          {hasBalance ? formatCurrency(r.pendingAmount) : '✓ Cleared'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {r.lastPayment ? formatDate(r.lastPayment) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/dashboard/payments?project=${r.projects[0]?._id}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                        >
                          Payments <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-500">{receivables.length} clients</td>
                  <td />
                  <td className="px-4 py-3 font-bold text-secondary">{formatCurrency(summary.totalBudget)}</td>
                  <td className="px-4 py-3 font-bold text-green-600">{formatCurrency(summary.totalReceived)}</td>
                  <td />
                  <td className="px-4 py-3 font-bold text-red-600">{formatCurrency(summary.totalPending)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Project-level pending summary ── */}
      {receivables.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {receivables
            .filter(r => r.pendingAmount > 0)
            .slice(0, 3)
            .map((r, i) => (
              <div key={i} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-secondary text-sm">{r.client?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{r.projectCount} project{r.projectCount > 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-lg font-bold text-red-600">{formatCurrency(r.pendingAmount)}</span>
                </div>
                <CollectionBar received={r.totalReceived} total={r.totalBudget} />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Collected {formatCurrency(r.totalReceived)}</span>
                  <span>of {formatCurrency(r.totalBudget)}</span>
                </div>
                <Link
                  to={`/dashboard/payments?project=${r.projects[0]?._id}`}
                  className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  View payments <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
