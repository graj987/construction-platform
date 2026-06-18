import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, HardHat, Phone, MapPin, Calendar, IndianRupee,
  Plus, Trash2, Edit, CheckCircle, Clock, XCircle, Minus,
  AlertTriangle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { workerAPI, advanceAPI, projectAPI } from '../../api';
import { useApp } from '../../context/AppContext';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { formatCurrency, formatDate, getMonthName } from '../../utils/helpers';

// ─── STAT TILE ────────────────────────────────────────────────────────────────
function Tile({ label, value, sub, color = 'text-secondary' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── ADVANCE FORM ─────────────────────────────────────────────────────────────
function AdvanceForm({ onSubmit, projects, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Amount (₹) *</label>
          <input className="form-input" type="number" min="1" {...register('amount', { required: 'Amount required' })} placeholder="e.g. 2000" />
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="form-label">Date *</label>
          <input className="form-input" type="date" {...register('date', { required: 'Date required' })} />
        </div>
      </div>
      <div>
        <label className="form-label">Project (optional)</label>
        <select className="form-input" {...register('project')}>
          <option value="">— None —</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Reason</label>
        <input className="form-input" {...register('reason')} placeholder="Medical, personal, festival..." />
      </div>
      <div>
        <label className="form-label">Notes</label>
        <textarea className="form-input h-16 resize-none" {...register('notes')} />
      </div>
      <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
        {loading ? 'Saving...' : 'Record Advance'}
      </button>
    </form>
  );
}

// ─── ATTENDANCE STATUS ICON ───────────────────────────────────────────────────
const statusIcon = (s) => {
  if (s === 'Present') return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (s === 'Half Day') return <Clock className="w-4 h-4 text-yellow-500" />;
  if (s === 'Absent') return <XCircle className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-purple-500" />;
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function WorkerDetailPage() {
  const { id } = useParams();
  const { showToast } = useApp();

  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [advanceModal, setAdvanceModal] = useState(false);
  const [savingAdvance, setSavingAdvance] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, pj] = await Promise.all([
        workerAPI.getProfile(id),
        projectAPI.getAll(),
      ]);
      setProfile(pr.data);
      setProjects(pj.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleAdvanceSubmit = async (data) => {
    setSavingAdvance(true);
    try {
      await advanceAPI.create({
        ...data,
        worker: id,
        amount: Number(data.amount),
        project: data.project || undefined,
      });
      showToast('Advance recorded');
      setAdvanceModal(false);
      load();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSavingAdvance(false);
    }
  };

  const handleDeleteAdvance = async (advId) => {
    if (!window.confirm('Delete this advance record?')) return;
    try {
      await advanceAPI.delete(advId);
      showToast('Advance deleted');
      load();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="py-24" />;
  if (!profile) return (
    <div className="text-center py-20 text-gray-400">
      <p>Worker not found.</p>
      <Link to="/dashboard/workers" className="text-primary mt-2 inline-block text-sm">← Back to Workers</Link>
    </div>
  );

  const { worker, currentMonth, advances, recentSalaries, stats } = profile;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <Link to="/dashboard/workers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Workers
      </Link>

      {/* Header card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {worker.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-secondary">{worker.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="badge bg-orange-100 text-orange-700 text-xs">{worker.role}</span>
                  <span className={`badge text-xs ${worker.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {worker.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <Link to="/dashboard/workers" state={{ editId: worker._id }} className="btn-outline text-sm py-1.5 px-3">
                <Edit className="w-3.5 h-3.5" /> Edit
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${worker.phone}`} className="hover:text-primary">{worker.phone || '—'}</a>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <IndianRupee className="w-4 h-4 text-gray-400" />
                <span>{formatCurrency(worker.dailyRate)}/day</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="truncate">{worker.project?.projectName || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{formatDate(worker.joiningDate)}</span>
              </div>
            </div>

            {worker.address && (
              <p className="text-xs text-gray-400 mt-2">{worker.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label="Earned (6 months)" value={formatCurrency(stats.totalEarned)} sub="Gross salary" />
        <Tile label="Total Paid" value={formatCurrency(stats.totalPaid)} color="text-green-600" />
        <Tile label="Total Advance Given" value={formatCurrency(stats.totalAdvanceGiven)} color="text-red-500" />
        <Tile
          label="Outstanding Advance"
          value={formatCurrency(stats.outstandingAdvance)}
          color={stats.outstandingAdvance > 0 ? 'text-red-500' : 'text-green-600'}
          sub={stats.outstandingAdvance > 0 ? 'To be deducted' : 'Fully cleared'}
        />
      </div>

      {/* This month */}
      <div className="card">
        <h2 className="font-semibold text-secondary mb-4">
          {getMonthName(currentMonth.month)} {currentMonth.year} — Attendance
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-sm">
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-green-700">{currentMonth.present}</p>
            <p className="text-xs text-green-600 mt-0.5">Present</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-yellow-700">{currentMonth.halfDay}</p>
            <p className="text-xs text-yellow-600 mt-0.5">Half Day</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-red-700">{currentMonth.absent}</p>
            <p className="text-xs text-red-600 mt-0.5">Absent</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-purple-700">{currentMonth.leave}</p>
            <p className="text-xs text-purple-600 mt-0.5">Leave</p>
          </div>
          <div className="bg-primary/5 rounded-xl p-3">
            <p className="text-2xl font-bold text-primary">{currentMonth.effectiveDays.toFixed(1)}</p>
            <p className="text-xs text-primary/70 mt-0.5">Eff. Days</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
          <span className="text-sm text-gray-600">Estimated Earned This Month</span>
          <span className="text-xl font-bold text-secondary">{formatCurrency(currentMonth.earnedThisMonth)}</span>
        </div>
      </div>

      {/* Salary History + Advances — side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Salary History */}
        <div className="card">
          <h2 className="font-semibold text-secondary mb-4">Salary History</h2>
          {recentSalaries.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No salary records yet.</p>
          ) : (
            <div className="space-y-2">
              {recentSalaries.map(s => (
                <div key={s._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-secondary">
                      {getMonthName(s.month)} {s.year}
                    </p>
                    <p className="text-xs text-gray-400">
                      {s.effectiveDays?.toFixed(1)} days × ₹{s.dailyRate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-secondary">{formatCurrency(s.finalPayable)}</p>
                    <span className={`badge text-xs ${s.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {s.isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/dashboard/salary" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
            View all salary records →
          </Link>
        </div>

        {/* Advance History */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-secondary">Advance History</h2>
            <button className="btn-primary text-xs py-1.5 px-3" onClick={() => setAdvanceModal(true)}>
              <Plus className="w-3.5 h-3.5" /> Add Advance
            </button>
          </div>
          {advances.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No advances recorded.</p>
          ) : (
            <div className="space-y-2">
              {advances.map(a => (
                <div key={a._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-secondary">{formatCurrency(a.amount)}</p>
                    <p className="text-xs text-gray-400">{formatDate(a.date)} {a.reason ? `— ${a.reason}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.deductedInSalary ? (
                      <span className="badge bg-gray-100 text-gray-500 text-xs">Deducted</span>
                    ) : (
                      <span className="badge bg-red-100 text-red-600 text-xs">Pending</span>
                    )}
                    {!a.deductedInSalary && (
                      <button
                        onClick={() => handleDeleteAdvance(a._id)}
                        className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Emergency contact + Notes */}
      {(worker.emergencyContact?.name || worker.notes) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {worker.emergencyContact?.name && (
            <div className="card bg-orange-50 border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <h3 className="font-semibold text-orange-800 text-sm">Emergency Contact</h3>
              </div>
              <p className="text-sm text-orange-900 font-medium">{worker.emergencyContact.name}</p>
              {worker.emergencyContact.relation && (
                <p className="text-xs text-orange-700">{worker.emergencyContact.relation}</p>
              )}
              {worker.emergencyContact.phone && (
                <a href={`tel:${worker.emergencyContact.phone}`} className="text-xs text-orange-700 hover:text-orange-900 font-medium">
                  {worker.emergencyContact.phone}
                </a>
              )}
            </div>
          )}
          {worker.notes && (
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-800 text-sm mb-2">Notes</h3>
              <p className="text-sm text-blue-700">{worker.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Advance Modal */}
      <Modal
        open={advanceModal}
        onClose={() => setAdvanceModal(false)}
        title={`Record Advance — ${worker.name}`}
        size="sm"
      >
        <AdvanceForm onSubmit={handleAdvanceSubmit} projects={projects} loading={savingAdvance} />
      </Modal>
    </div>
  );
}
