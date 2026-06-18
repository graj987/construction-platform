import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit, FolderOpen, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { projectAPI, clientAPI } from '../../api';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/shared/PageHeader';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import EmptyState from '../../components/shared/EmptyState';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { formatDate, formatCurrency, PROJECT_STATUSES } from '../../utils/helpers';

const TYPES = ['House', 'Duplex', 'Apartment', 'Commercial', 'Renovation', 'Other'];

export default function ProjectsPage() {
  const { showToast } = useApp();
  const [projects, setProjects] = useState([]);
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const { register, handleSubmit, reset } = useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, cr] = await Promise.all([projectAPI.getAll(), clientAPI.getAll()]);
      setProjects(pr.data || []);
      setClients(cr.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = (p = null) => { setEditing(p); reset(p || {}); setModalOpen(true); };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) { await projectAPI.update(editing._id, data); showToast('Project updated'); }
      else         { await projectAPI.create(data);              showToast('Project created'); }
      setModalOpen(false);
      load();
    } catch (e) { showToast(e.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try { await projectAPI.delete(id); showToast('Project deleted'); load(); }
    catch  { showToast('Failed', 'error'); }
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} total projects`}
        action={
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus className="w-4 h-4" /> New Project
          </button>
        }
      />

      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          action={
            <button className="btn-primary" onClick={() => openModal()}>
              <Plus className="w-4 h-4" /> New Project
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <div key={p._id} className="card hover:shadow-card-hover transition-shadow flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-secondary text-sm">{p.projectName}</p>
                  <p className="text-xs text-gray-400">{p.projectCode}</p>
                </div>
                <Badge status={p.status} />
              </div>

              <div className="space-y-1.5 text-xs text-gray-500 mb-3 flex-1">
                <div className="flex justify-between">
                  <span>Client</span>
                  <span className="font-medium text-secondary">{p.clientName || p.client?.name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type</span>
                  <span>{p.constructionType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Area</span>
                  <span>{p.totalArea ? `${p.totalArea} sq ft` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Budget</span>
                  <span className="font-medium text-secondary">{formatCurrency(p.budget)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Received</span>
                  <span className="font-medium text-green-600">{formatCurrency(p.amountReceived)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Started</span>
                  <span>{formatDate(p.startDate)}</span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span><span>{p.completionPercentage || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 bg-primary rounded-full"
                    style={{ width: `${p.completionPercentage || 0}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-1 pt-2 border-t border-gray-100">
                {/* View costs detail */}
                <Link
                  to={`/dashboard/projects/${p._id}`}
                  className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-primary
                    hover:bg-primary/10 py-1.5 rounded-lg transition-colors"
                >
                  Cost Details <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => openModal(p)}
                  className="flex items-center justify-center gap-1 text-xs text-gray-500
                    hover:text-primary px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(p._id)}
                  className="flex items-center justify-center gap-1 text-xs text-gray-500
                    hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Project' : 'New Project'}
        size="lg"
      >
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Project Name *</label>
              <input
                className="form-input"
                {...register('projectName', { required: true })}
                placeholder="e.g. Sharma Residence"
              />
            </div>
            <div>
              <label className="form-label">Client</label>
              <select className="form-input" {...register('client')}>
                <option value="">Select Client</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Client Name (Manual)</label>
              <input className="form-input" {...register('clientName')} placeholder="If not in list" />
            </div>
            <div>
              <label className="form-label">Construction Type</label>
              <select className="form-input" {...register('constructionType')}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-input" {...register('status')}>
                {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Total Area (sq ft)</label>
              <input className="form-input" type="number" {...register('totalArea')} placeholder="1200" />
            </div>
            <div>
              <label className="form-label">Floors</label>
              <select className="form-input" {...register('floors')}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Budget (₹)</label>
              <input className="form-input" type="number" {...register('budget')} placeholder="2500000" />
            </div>
            <div>
              <label className="form-label">Amount Received (₹)</label>
              <input className="form-input" type="number" {...register('amountReceived')} placeholder="0" />
            </div>
            <div>
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" {...register('startDate')} />
            </div>
            <div>
              <label className="form-label">Expected Completion</label>
              <input className="form-input" type="date" {...register('expectedCompletion')} />
            </div>
            <div>
              <label className="form-label">Completion %</label>
              <input
                className="form-input" type="number" min="0" max="100"
                {...register('completionPercentage')} placeholder="0"
              />
            </div>
            <div>
              <label className="form-label">Location</label>
              <input className="form-input" {...register('location')} placeholder="Site address" />
            </div>
            <div className="col-span-2">
              <label className="form-label">Description</label>
              <textarea className="form-input h-20 resize-none" {...register('description')} />
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary w-full justify-center"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Project'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
