import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, BookOpen, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { diaryAPI, projectAPI } from '../../api';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/shared/Modal';
import EmptyState from '../../components/shared/EmptyState';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { formatDate } from '../../utils/helpers';

const WEATHERS = ['Sunny', 'Cloudy', 'Rainy', 'Hot', 'Other'];
const STAGES = ['Planning', 'Foundation', 'Structure', 'Brickwork', 'Plumbing', 'Electrical', 'Finishing', 'Other'];
const STAGE_COLORS = { Planning: 'bg-blue-100 text-blue-700', Foundation: 'bg-yellow-100 text-yellow-700', Structure: 'bg-orange-100 text-orange-700', Brickwork: 'bg-amber-100 text-amber-700', Finishing: 'bg-green-100 text-green-700', Other: 'bg-gray-100 text-gray-700' };

export default function DiaryPage() {
  const { showToast } = useApp();
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState('');
  const { register, handleSubmit, reset } = useForm({ defaultValues: { weather: 'Sunny', workersPresent: 0 } });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [er, pr] = await Promise.all([diaryAPI.getAll({ project: projectFilter || undefined }), projectAPI.getAll()]);
      setEntries(er.data || []);
      setProjects(pr.data || []);
    } finally { setLoading(false); }
  }, [projectFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (k !== 'photos') formData.append(k, v); });
      if (data.photos?.length) Array.from(data.photos).forEach(f => formData.append('photos', f));
      await diaryAPI.create(formData);
      showToast('Diary entry saved');
      setModalOpen(false);
      reset();
      load();
    } catch (e) { showToast('Error', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete entry?')) return;
    await diaryAPI.delete(id);
    showToast('Deleted');
    load();
  };

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  return (
    <div>
      <PageHeader title="Construction Diary" subtitle="Daily project logs and progress records" action={<button className="btn-primary" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add Entry</button>} />

      <div className="mb-5">
        <select className="form-input w-56" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
        </select>
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={BookOpen} title="No diary entries" description="Start recording daily construction progress" action={<button className="btn-primary" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add Entry</button>} />
      ) : (
        <div className="space-y-4">
          {entries.map(e => (
            <div key={e._id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="flex items-center gap-1 text-sm font-semibold text-secondary"><Calendar className="w-4 h-4" />{formatDate(e.date)}</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-sm text-primary font-medium">{e.project?.projectName || e.projectName}</span>
                    {e.stage && <span className={`badge ${STAGE_COLORS[e.stage] || 'bg-gray-100 text-gray-700'}`}>{e.stage}</span>}
                    <span className="badge bg-gray-100 text-gray-600">{e.weather}</span>
                    <span className="text-xs text-gray-400">{e.workersPresent} workers</span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium mb-1">{e.description}</p>
                  {e.workDone && <p className="text-xs text-gray-500 mb-1"><strong>Work Done:</strong> {e.workDone}</p>}
                  {e.issues && <p className="text-xs text-red-500 mb-1"><strong>Issues:</strong> {e.issues}</p>}
                </div>
                <button onClick={() => handleDelete(e._id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title="Add Diary Entry" size="lg">
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Project *</label>
              <select className="form-input" {...register('project', { required: true })}>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Date *</label>
              <input className="form-input" type="date" {...register('date', { required: true })} defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="form-label">Stage</label>
              <select className="form-input" {...register('stage')}>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Weather</label>
              <select className="form-input" {...register('weather')}>
                {WEATHERS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Workers Present</label>
              <input className="form-input" type="number" min="0" {...register('workersPresent')} />
            </div>
          </div>
          <div>
            <label className="form-label">Description *</label>
            <textarea className="form-input h-20 resize-none" {...register('description', { required: true })} placeholder="Summary of today's work..." />
          </div>
          <div>
            <label className="form-label">Work Done (Details)</label>
            <textarea className="form-input h-16 resize-none" {...register('workDone')} placeholder="Detailed work done today..." />
          </div>
          <div>
            <label className="form-label">Issues / Observations</label>
            <textarea className="form-input h-16 resize-none" {...register('issues')} placeholder="Any issues, material shortage, delays..." />
          </div>
          <div>
            <label className="form-label">Photos (up to 5)</label>
            <input className="form-input" type="file" multiple accept="image/*" {...register('photos')} />
          </div>
          <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>{saving ? 'Saving...' : 'Save Entry'}</button>
        </form>
      </Modal>
    </div>
  );
}
