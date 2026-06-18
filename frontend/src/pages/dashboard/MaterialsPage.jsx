import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { materialAPI, projectAPI } from '../../api';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/shared/Modal';
import EmptyState from '../../components/shared/EmptyState';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { MATERIAL_CATEGORIES, formatCurrency } from '../../utils/helpers';

const UNITS = ['Bags', 'Cubic Ft', 'Cubic M', 'Kg', 'Tons', 'Pieces', 'Sqft', 'Liters', 'Numbers', 'Other'];

export default function MaterialsPage() {
  const { showToast } = useApp();
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [projectFilter, setProjectFilter] = useState('');
  const { register, handleSubmit, reset } = useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mr, pr] = await Promise.all([materialAPI.getAll({ project: projectFilter || undefined }), projectAPI.getAll()]);
      setMaterials(mr.data || []);
      setProjects(pr.data || []);
    } finally { setLoading(false); }
  }, [projectFilter]);

  useEffect(() => { load(); }, [load]);

  const openModal = (m = null) => { setEditing(m); reset(m || {}); setModalOpen(true); };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) { await materialAPI.update(editing._id, data); showToast('Material updated'); }
      else { await materialAPI.create(data); showToast('Material added'); }
      setModalOpen(false);
      load();
    } catch (e) { showToast('Error', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    await materialAPI.delete(id);
    showToast('Deleted');
    load();
  };

  const totalCost = materials.reduce((a, m) => a + (m.totalCost || 0), 0);

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  return (
    <div>
      <PageHeader title="Material Management" subtitle={`Total Cost: ${formatCurrency(totalCost)}`} action={<button className="btn-primary" onClick={() => openModal()}><Plus className="w-4 h-4" /> Add Material</button>} />

      <div className="mb-5">
        <select className="form-input w-56" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
        </select>
      </div>

      {materials.length === 0 ? (
        <EmptyState icon={Package} title="No materials tracked" action={<button className="btn-primary" onClick={() => openModal()}><Plus className="w-4 h-4" /> Add Material</button>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Material', 'Category', 'Project', 'Purchased', 'Used', 'Remaining', 'Rate', 'Total Cost', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs text-gray-500">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {materials.map(m => (
                  <tr key={m._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-secondary">{m.name}</td>
                    <td className="px-4 py-3"><span className="badge bg-blue-100 text-blue-700">{m.category}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.project?.projectName || m.projectName || '—'}</td>
                    <td className="px-4 py-3">{m.purchased} {m.unit}</td>
                    <td className="px-4 py-3 text-orange-600">{m.used} {m.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${m.remaining < m.purchased * 0.2 ? 'text-red-600' : 'text-green-600'}`}>{m.remaining} {m.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">₹{m.pricePerUnit}/{m.unit}</td>
                    <td className="px-4 py-3 font-semibold text-secondary">{formatCurrency(m.totalCost)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openModal(m)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(m._id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Material' : 'Add Material'}>
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Material Name *</label>
              <input className="form-input" {...register('name', { required: true })} placeholder="e.g. OPC 53 Grade Cement" />
            </div>
            <div>
              <label className="form-label">Category *</label>
              <select className="form-input" {...register('category', { required: true })}>
                {MATERIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Unit</label>
              <select className="form-input" {...register('unit')}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Project *</label>
              <select className="form-input" {...register('project', { required: true })}>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Supplier</label>
              <input className="form-input" {...register('supplier')} placeholder="Supplier name" />
            </div>
            <div>
              <label className="form-label">Quantity Purchased</label>
              <input className="form-input" type="number" min="0" {...register('purchased')} placeholder="0" />
            </div>
            <div>
              <label className="form-label">Quantity Used</label>
              <input className="form-input" type="number" min="0" {...register('used')} placeholder="0" />
            </div>
            <div className="col-span-2">
              <label className="form-label">Price Per Unit (₹)</label>
              <input className="form-input" type="number" min="0" {...register('pricePerUnit')} placeholder="0" />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>{saving ? 'Saving...' : 'Save Material'}</button>
        </form>
      </Modal>
    </div>
  );
}
