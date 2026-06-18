import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Eye, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { quotationAPI, clientAPI } from '../../api';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/shared/PageHeader';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import EmptyState from '../../components/shared/EmptyState';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { formatDate, formatCurrency, CONSTRUCTION_TYPES } from '../../utils/helpers';

export default function QuotationsPage() {
  const { showToast } = useApp();
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const { register, handleSubmit, watch, reset } = useForm({ defaultValues: { constructionType: 'Standard', floors: 1 } });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [qr, cr] = await Promise.all([quotationAPI.getAll(), clientAPI.getAll()]);
      setQuotations(qr.data || []);
      setClients(cr.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async (data) => {
    setSaving(true);
    try {
      await quotationAPI.generate({ ...data, area: Number(data.area), floors: Number(data.floors) });
      showToast('Quotation generated');
      setModalOpen(false);
      reset();
      load();
    } catch (e) { showToast('Error', 'error'); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    await quotationAPI.update(id, { status });
    showToast(`Status updated to ${status}`);
    load();
  };

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  return (
    <div>
      <PageHeader title="Quotations" subtitle={`${quotations.length} quotations`} action={<button className="btn-primary" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Generate Quotation</button>} />

      {quotations.length === 0 ? (
        <EmptyState icon={FileText} title="No quotations yet" action={<button className="btn-primary" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Generate Quotation</button>} />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Quotation #', 'Client', 'Area', 'Type', 'Total Amount', 'Status', 'Valid Until', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs text-gray-500">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quotations.map(q => (
                  <tr key={q._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{q.quotationNumber}</td>
                    <td className="px-4 py-3 font-medium text-secondary">{q.clientName}</td>
                    <td className="px-4 py-3">{q.area * (q.floors || 1)} sq ft</td>
                    <td className="px-4 py-3"><span className="badge bg-purple-100 text-purple-700">{q.constructionType}</span></td>
                    <td className="px-4 py-3 font-bold text-secondary">{formatCurrency(q.totalAmount)}</td>
                    <td className="px-4 py-3"><Badge status={q.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(q.validUntil)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => setViewModal(q)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary"><Eye className="w-3.5 h-3.5" /></button>
                        <select className="text-xs border border-gray-200 rounded px-1.5 py-1" value={q.status} onChange={e => updateStatus(q._id, e.target.value)}>
                          {['Draft', 'Sent', 'Accepted', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title="Generate Quotation" size="lg">
        <form onSubmit={handleSubmit(handleGenerate)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Client Name *</label>
              <input className="form-input" {...register('clientName', { required: true })} placeholder="Client Name" />
            </div>
            <div>
              <label className="form-label">Select Client (Optional)</label>
              <select className="form-input" {...register('client')}>
                <option value="">— Select from list —</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input" {...register('clientPhone')} />
            </div>
            <div>
              <label className="form-label">Location</label>
              <input className="form-input" {...register('clientLocation')} />
            </div>
            <div>
              <label className="form-label">Plot Area (sq ft) *</label>
              <input className="form-input" type="number" {...register('area', { required: true })} placeholder="1200" />
            </div>
            <div>
              <label className="form-label">Floors</label>
              <select className="form-input" {...register('floors')}>
                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Construction Type *</label>
              <select className="form-input" {...register('constructionType')}>
                {CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Notes</label>
              <textarea className="form-input h-20 resize-none" {...register('notes')} />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>{saving ? 'Generating...' : 'Generate Quotation'}</button>
        </form>
      </Modal>

      {/* View Modal */}
      {viewModal && (
        <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={`Quotation — ${viewModal.quotationNumber}`} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400 text-xs">Client</p><p className="font-semibold">{viewModal.clientName}</p></div>
              <div><p className="text-gray-400 text-xs">Phone</p><p>{viewModal.clientPhone || '—'}</p></div>
              <div><p className="text-gray-400 text-xs">Location</p><p>{viewModal.clientLocation || '—'}</p></div>
              <div><p className="text-gray-400 text-xs">Construction Type</p><p>{viewModal.constructionType}</p></div>
              <div><p className="text-gray-400 text-xs">Area</p><p>{viewModal.area * (viewModal.floors || 1)} sq ft</p></div>
              <div><p className="text-gray-400 text-xs">Rate/Sq Ft</p><p>₹{viewModal.ratePerSqFt}</p></div>
            </div>
            <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
              <thead className="bg-gray-50"><tr>{['Description', 'Qty', 'Unit', 'Rate', 'Amount'].map(h => <th key={h} className="text-left px-3 py-2 text-xs text-gray-500">{h}</th>)}</tr></thead>
              <tbody>{viewModal.lineItems?.map((li, i) => (<tr key={i} className="border-t border-gray-50"><td className="px-3 py-2">{li.description}</td><td className="px-3 py-2">{li.quantity?.toLocaleString()}</td><td className="px-3 py-2">{li.unit}</td><td className="px-3 py-2">₹{li.rate}</td><td className="px-3 py-2 font-semibold">{formatCurrency(li.amount)}</td></tr>))}</tbody>
            </table>
            <div className="flex justify-end">
              <div className="text-right space-y-1 text-sm">
                <div className="flex gap-8"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(viewModal.subtotal)}</span></div>
                {viewModal.discount > 0 && <div className="flex gap-8 text-green-600"><span>Discount</span><span>-{formatCurrency(viewModal.discount)}</span></div>}
                <div className="flex gap-8 font-bold text-lg border-t pt-1"><span className="text-secondary">Total</span><span className="text-primary">{formatCurrency(viewModal.totalAmount)}</span></div>
              </div>
            </div>
            {viewModal.terms && <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-500"><strong>Terms:</strong> {viewModal.terms}</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}
