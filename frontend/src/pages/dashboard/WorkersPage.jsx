import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Edit, Trash2, HardHat, Search, ChevronRight,
  Users, UserCheck, MapPin, IndianRupee, TrendingUp,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { workerAPI, projectAPI } from '../../api';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/shared/Modal';
import EmptyState from '../../components/shared/EmptyState';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import StatCard from '../../components/shared/StatCard';
import { formatCurrency, formatDate, WORKER_ROLES } from '../../utils/helpers';

// ─── WORKER FORM ─────────────────────────────────────────────────────────────

function WorkerForm({ onSubmit, defaultValues, loading, projects }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Basic Info */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Personal Info</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Full Name *</label>
            <input className="form-input" {...register('name', { required: 'Name is required' })} placeholder="Ramesh Kumar" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input className="form-input" {...register('phone')} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="form-label">Role / Skill *</label>
            <select className="form-input" {...register('role')}>
              {WORKER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Daily Wage (₹) *</label>
            <input className="form-input" type="number" min="0" {...register('dailyRate', { required: 'Daily rate is required' })} placeholder="500" />
            {errors.dailyRate && <p className="text-xs text-red-500 mt-1">{errors.dailyRate.message}</p>}
          </div>
          <div>
            <label className="form-label">Joining Date</label>
            <input className="form-input" type="date" {...register('joiningDate')} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-input" {...register('isActive')}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignment */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Project Assignment</p>
        <div>
          <label className="form-label">Assign to Project</label>
          <select className="form-input" {...register('project')}>
            <option value="">— No project assigned —</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.projectName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Emergency Contact */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Emergency Contact</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Name</label>
            <input className="form-input" {...register('emergencyContact.name')} placeholder="Contact name" />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input className="form-input" {...register('emergencyContact.phone')} placeholder="+91..." />
          </div>
          <div>
            <label className="form-label">Relation</label>
            <input className="form-input" {...register('emergencyContact.relation')} placeholder="Father / Wife..." />
          </div>
        </div>
      </div>

      {/* Address & Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Home Address</label>
          <textarea className="form-input h-16 resize-none" {...register('address')} placeholder="Village / District" />
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea className="form-input h-16 resize-none" {...register('notes')} placeholder="Any notes..." />
        </div>
      </div>

      <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
        {loading ? 'Saving...' : 'Save Worker'}
      </button>
    </form>
  );
}

// ─── ROLE BADGE ───────────────────────────────────────────────────────────────

const ROLE_COLORS = {
  Mason: 'bg-orange-100 text-orange-700',
  Carpenter: 'bg-amber-100 text-amber-700',
  Electrician: 'bg-yellow-100 text-yellow-700',
  Plumber: 'bg-blue-100 text-blue-700',
  Helper: 'bg-gray-100 text-gray-700',
  Painter: 'bg-pink-100 text-pink-700',
  Supervisor: 'bg-purple-100 text-purple-700',
  Welder: 'bg-red-100 text-red-700',
  'Tile Fitter': 'bg-teal-100 text-teal-700',
  Other: 'bg-gray-100 text-gray-600',
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function WorkersPage() {
  const { showToast } = useApp();
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('true');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterRole) params.role = filterRole;
      if (filterActive !== '') params.isActive = filterActive;

      const [wr, pr, st] = await Promise.all([
        workerAPI.getAll(params),
        projectAPI.getAll(),
        workerAPI.getStats(),
      ]);
      setWorkers(wr.data || []);
      setProjects(pr.data || []);
      setStats(st.data);
    } catch (err) {
      showToast(err.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filterActive]);

  useEffect(() => {
    const t = setTimeout(loadAll, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadAll]);

  const openModal = (w = null) => {
    setEditing(w);
    setModalOpen(true);
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await workerAPI.update(editing._id, data);
        showToast('Worker updated');
      } else {
        await workerAPI.create(data);
        showToast('Worker added');
      }
      setModalOpen(false);
      setEditing(null);
      loadAll();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this worker? This cannot be undone.')) return;
    try {
      await workerAPI.delete(id);
      showToast('Worker deleted');
      loadAll();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  // Flatten editing data for form defaultValues
  const editingDefaults = editing
    ? {
        ...editing,
        project: editing.project?._id || editing.project || '',
        isActive: String(editing.isActive ?? true),
        joiningDate: editing.joiningDate ? editing.joiningDate.split('T')[0] : '',
      }
    : {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workers"
        subtitle={`${stats?.activeWorkers ?? 0} active workers`}
        action={
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus className="w-4 h-4" /> Add Worker
          </button>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Workers" value={stats.totalWorkers} icon={HardHat} color="primary" />
          <StatCard title="Active Workers" value={stats.activeWorkers} icon={UserCheck} color="green" />
          <StatCard title="On Site Today" value={stats.onSiteToday} icon={MapPin} color="blue" />
          <StatCard title="Monthly Labor Cost" value={formatCurrency(stats.monthlyLaborCost)} icon={IndianRupee} color="orange" subtitle="Current month" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="form-input pl-9"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-input sm:w-40" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">All Roles</option>
          {WORKER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="form-input sm:w-36" value={filterActive} onChange={e => setFilterActive(e.target.value)}>
          <option value="true">Active Only</option>
          <option value="false">Inactive</option>
          <option value="">All</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-16" />
      ) : workers.length === 0 ? (
        <EmptyState
          icon={HardHat}
          title="No workers found"
          description={search ? 'Try a different search term' : 'Add your first worker to get started'}
          action={!search && (
            <button className="btn-primary" onClick={() => openModal()}>
              <Plus className="w-4 h-4" /> Add Worker
            </button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {workers.map(w => (
            <div key={w._id} className="card hover:shadow-card-hover transition-all duration-200 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary text-sm leading-tight">{w.name}</h3>
                    <p className="text-xs text-gray-400">{w.phone || '—'}</p>
                  </div>
                </div>
                <span className={`badge text-xs ${w.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {w.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs mb-4">
                <div className="flex items-center gap-2">
                  <span className={`badge ${ROLE_COLORS[w.role] || 'bg-gray-100 text-gray-600'}`}>{w.role}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Daily Wage</span>
                  <span className="font-semibold text-secondary">{formatCurrency(w.dailyRate)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Project</span>
                  <span className="font-medium text-secondary truncate max-w-[120px]">
                    {w.project?.projectName || <span className="text-gray-400">Unassigned</span>}
                  </span>
                </div>
                {w.totalAdvance > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Total Advance</span>
                    <span className="font-semibold text-red-500">{formatCurrency(w.totalAdvance)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <Link
                  to={`/dashboard/workers/${w._id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:bg-primary/10 py-1.5 rounded-lg transition-colors"
                >
                  View Profile <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => openModal(w)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(w._id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role breakdown */}
      {stats?.roleBreakdown?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-secondary mb-4 text-sm">Workers by Role</h3>
          <div className="flex flex-wrap gap-2">
            {stats.roleBreakdown.map(r => (
              <div key={r._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${ROLE_COLORS[r._id] || 'bg-gray-100 text-gray-600'}`}>
                {r._id} <span className="font-bold">({r.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? `Edit — ${editing.name}` : 'Add New Worker'}
        size="lg"
      >
        <WorkerForm
          onSubmit={handleSave}
          defaultValues={editingDefaults}
          loading={saving}
          projects={projects}
        />
      </Modal>
    </div>
  );
}
