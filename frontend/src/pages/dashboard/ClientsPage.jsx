import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2, Edit, Phone, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { clientAPI } from '../../api';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/shared/PageHeader';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import EmptyState from '../../components/shared/EmptyState';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { formatDate, formatCurrency, CLIENT_STATUSES, DISTRICTS } from '../../utils/helpers';

function ClientForm({ onSubmit, defaultValues, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Name *</label>
          <input className="form-input" {...register('name', { required: true })} placeholder="Client Name" />
          {errors.name && <p className="text-xs text-red-500 mt-1">Required</p>}
        </div>
        <div>
          <label className="form-label">Phone *</label>
          <input className="form-input" {...register('phone', { required: true })} placeholder="+91 98765 43210" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Location</label>
          <input className="form-input" {...register('location')} placeholder="Village / Town" />
        </div>
        <div>
          <label className="form-label">District</label>
          <select className="form-input" {...register('district')}>
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Budget (₹)</label>
          <input className="form-input" type="number" {...register('budget')} placeholder="e.g. 2500000" />
        </div>
        <div>
          <label className="form-label">Plot Size</label>
          <input className="form-input" {...register('plotSize')} placeholder="e.g. 40x60 ft" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Floors</label>
          <select className="form-input" {...register('floors')}>
            {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-input" {...register('status')}>
            {CLIENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="form-label">Source</label>
        <select className="form-input" {...register('source')}>
          {['Website', 'Referral', 'Walk-in', 'Social Media', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Notes</label>
        <textarea className="form-input h-20 resize-none" {...register('notes')} placeholder="Any additional notes..." />
      </div>
      <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
        {loading ? 'Saving...' : 'Save Client'}
      </button>
    </form>
  );
}

export default function ClientsPage() {
  const { showToast } = useApp();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await clientAPI.getAll({ search, status: statusFilter || undefined });
      setClients(r.data || []);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await clientAPI.update(editing._id, data);
        showToast('Client updated');
      } else {
        await clientAPI.create(data);
        showToast('Client added');
      }
      setModalOpen(false);
      setEditing(null);
      load();
    } catch (e) {
      showToast(e.message || 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return;
    try {
      await clientAPI.delete(id);
      showToast('Client deleted');
      load();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} total clients`}
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4" /> Add Client
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="form-input pl-9" placeholder="Search by name, phone, location..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input sm:w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {CLIENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : clients.length === 0 ? (
        <EmptyState icon={Users} title="No clients found" description="Add your first client to get started" action={<button className="btn-primary" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add Client</button>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Phone', 'Location', 'Budget', 'Status', 'Date', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-secondary">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1 hover:text-primary"><Phone className="w-3 h-3" />{c.phone}</a>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.location || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatCurrency(c.budget)}</td>
                    <td className="px-4 py-3"><Badge status={c.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditing(c); setModalOpen(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(c._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Client' : 'Add New Client'}>
        <ClientForm onSubmit={handleSave} defaultValues={editing || {}} loading={saving} />
      </Modal>
    </div>
  );
}
