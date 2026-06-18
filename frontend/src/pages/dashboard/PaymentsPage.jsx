import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Trash2, Edit, Wallet, Filter, Eye,
  Download, X, ChevronLeft, ChevronRight, FileImage,
  IndianRupee, TrendingUp, CalendarCheck,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { paymentAPI, projectAPI, clientAPI, milestoneAPI } from '../../api';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/shared/Modal';
import EmptyState from '../../components/shared/EmptyState';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import StatCard from '../../components/shared/StatCard';
import Badge from '../../components/shared/Badge';
import { formatCurrency, formatDate, PAYMENT_STATUSES, PAYMENT_MODES, MILESTONE_STAGES } from '../../utils/helpers';

// ─── RECEIPT VIEWER ───────────────────────────────────────────────────────────

function ReceiptModal({ payment, onClose, onDeleteReceipt }) {
  if (!payment) return null;
  const isImage = payment.receiptImage && !payment.receiptImage.endsWith('.pdf');
  return (
    <Modal open={!!payment} onClose={onClose} title="Payment Receipt" size="md">
      <div className="space-y-4">
        {payment.receiptImage ? (
          <div className="text-center">
            {isImage ? (
              <img
                src={payment.receiptImage}
                alt="receipt"
                className="max-h-96 mx-auto rounded-xl object-contain border border-gray-200"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <FileImage className="w-16 h-16 text-gray-300" />
                <p className="text-gray-600 text-sm">{payment.receiptOriginalName || 'PDF Document'}</p>
              </div>
            )}
            <div className="flex gap-3 justify-center mt-4">
              <a
                href={payment.receiptImage}
                target="_blank"
                rel="noreferrer"
                download
                className="btn-outline text-sm py-2 px-4"
              >
                <Download className="w-4 h-4" /> Download
              </a>
              <button
                onClick={() => onDeleteReceipt(payment._id)}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Wallet className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No receipt attached to this payment.</p>
          </div>
        )}
        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
          <div className="flex justify-between"><span className="text-gray-500">Project</span><span className="font-medium">{payment.project?.projectName || '—'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Client</span><span>{payment.client?.name || '—'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{formatDate(payment.paymentDate)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-green-600">{formatCurrency(payment.amount)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Method</span><span>{payment.paymentMethod}</span></div>
          {payment.transactionId && (
            <div className="flex justify-between"><span className="text-gray-500">Txn ID</span><span className="font-mono text-xs">{payment.transactionId}</span></div>
          )}
          {payment.receivedBy && (
            <div className="flex justify-between"><span className="text-gray-500">Received By</span><span>{payment.receivedBy}</span></div>
          )}
          {payment.milestone && (
            <div className="flex justify-between"><span className="text-gray-500">Milestone</span><span>{payment.milestone.title}</span></div>
          )}
          {payment.remarks && (
            <div className="pt-1 border-t border-gray-100"><span className="text-gray-500">Remarks: </span>{payment.remarks}</div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── PAYMENT FORM ─────────────────────────────────────────────────────────────

function PaymentForm({ onSubmit, defaultValues, loading, projects, clients, milestones, onProjectChange }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: defaultValues || {
      date: new Date().toISOString().split('T')[0],
      status: 'Received',
      paymentMethod: 'Cash',
    },
  });
  const [previewUrl, setPreviewUrl] = useState(defaultValues?.receiptImage || null);
  const selectedProject = watch('project');

  useEffect(() => {
    if (selectedProject && onProjectChange) onProjectChange(selectedProject);
  }, [selectedProject]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data" className="space-y-4">
      {/* Project + Client */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Project *</label>
          <select className="form-input" {...register('project', { required: 'Required' })}>
            <option value="">Select project…</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
          </select>
          {errors.project && <p className="text-xs text-red-500 mt-1">{errors.project.message}</p>}
        </div>
        <div>
          <label className="form-label">Client</label>
          <select className="form-input" {...register('client')}>
            <option value="">— None —</option>
            {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Amount + Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Amount (₹) *</label>
          <input
            className="form-input"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0"
            {...register('amount', { required: 'Required', min: { value: 0.01, message: 'Must be > 0' } })}
          />
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="form-label">Date *</label>
          <input className="form-input" type="date" {...register('paymentDate', { required: 'Required' })} />
          {errors.paymentDate && <p className="text-xs text-red-500 mt-1">{errors.paymentDate.message}</p>}
        </div>
      </div>

      {/* Method + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Payment Method</label>
          <select className="form-input" {...register('paymentMethod')}>
            {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-input" {...register('status')}>
            {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Transaction ID + Received By */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Transaction ID / Cheque No.</label>
          <input className="form-input" placeholder="Optional" {...register('transactionId')} />
        </div>
        <div>
          <label className="form-label">Received By</label>
          <input className="form-input" placeholder="Name of person who received" {...register('receivedBy')} />
        </div>
      </div>

      {/* Milestone */}
      {milestones.length > 0 && (
        <div>
          <label className="form-label">Link to Milestone</label>
          <select className="form-input" {...register('milestone')}>
            <option value="">— None —</option>
            {milestones.map(m => (
              <option key={m._id} value={m._id}>
                {m.title} — {formatCurrency(m.expectedAmount)} ({m.status})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Receipt upload */}
      <div>
        <label className="form-label">Receipt / Cheque Image (JPG, PNG, PDF — max 10 MB)</label>
        <input
          className="form-input py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0
            file:text-xs file:font-semibold file:bg-primary/10 file:text-primary
            hover:file:bg-primary/20 cursor-pointer"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          {...register('receipt')}
          onChange={e => {
            const f = e.target.files[0];
            if (f) setPreviewUrl(URL.createObjectURL(f));
          }}
        />
        {previewUrl && previewUrl !== 'null' && (
          <div className="mt-2">
            {!previewUrl.endsWith('.pdf') ? (
              <img src={previewUrl} alt="preview" className="h-24 rounded-lg object-cover border border-gray-200" />
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">
                <FileImage className="w-4 h-4" /> {defaultValues?.receiptOriginalName || 'Attached PDF'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Remarks */}
      <div>
        <label className="form-label">Remarks</label>
        <textarea className="form-input h-16 resize-none" {...register('remarks')} placeholder="Notes…" />
      </div>

      <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
        {loading ? 'Saving…' : <><Wallet className="w-4 h-4" /> Save Payment</>}
      </button>
    </form>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const { showToast } = useApp();

  const [payments,   setPayments]   = useState([]);
  const [projects,   setProjects]   = useState([]);
  const [clients,    setClients]    = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [total,      setTotal]      = useState(0);
  const [totalRec,   setTotalRec]   = useState(0);
  const [page,       setPage]       = useState(1);
  const [pages,      setPages]      = useState(1);

  const [addModal,    setAddModal]    = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [viewReceipt, setViewReceipt] = useState(null);

  // Filters
  const [search,        setSearch]        = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [filterFrom,    setFilterFrom]    = useState('');
  const [filterTo,      setFilterTo]      = useState('');
  const [showFilters,   setShowFilters]   = useState(false);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search)        params.search  = search;
      if (filterProject) params.project = filterProject;
      if (filterStatus)  params.status  = filterStatus;
      if (filterFrom)    params.from    = filterFrom;
      if (filterTo)      params.to      = filterTo;

      const [pr, st] = await Promise.all([
        paymentAPI.getAll(params),
        paymentAPI.getStats(),
      ]);
      setPayments(pr.data         || []);
      setTotal(pr.total           || 0);
      setTotalRec(pr.totalReceived || 0);
      setPages(pr.pages           || 1);
      setStats(st.data);
    } catch (err) {
      showToast(err.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterProject, filterStatus, filterFrom, filterTo]);

  useEffect(() => {
    Promise.all([projectAPI.getAll(), clientAPI.getAll()]).then(([p, c]) => {
      setProjects(p.data || []);
      setClients(c.data || []);
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(loadPayments, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [loadPayments]);

  useEffect(() => { setPage(1); }, [search, filterProject, filterStatus, filterFrom, filterTo]);

  const handleProjectChange = async (projectId) => {
    if (!projectId) { setMilestones([]); return; }
    try {
      const res = await milestoneAPI.getAll({ project: projectId });
      setMilestones(res.data || []);
    } catch { setMilestones([]); }
  };

  const buildFormData = (data) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (k === 'receipt') {
        if (v && v[0]) fd.append('receipt', v[0]);
      } else if (v !== undefined && v !== null && v !== '') {
        fd.append(k, v);
      }
    });
    return fd;
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      const fd = buildFormData(data);
      if (editing) {
        await paymentAPI.update(editing._id, fd);
        showToast('Payment updated');
      } else {
        await paymentAPI.create(fd);
        showToast('Payment recorded');
      }
      setAddModal(false);
      setEditing(null);
      setMilestones([]);
      loadPayments();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment? This will reduce the project\'s received amount.')) return;
    try {
      await paymentAPI.delete(id);
      showToast('Payment deleted');
      loadPayments();
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    }
  };

  const handleDeleteReceipt = async (id) => {
    if (!window.confirm('Remove receipt image?')) return;
    try {
      await paymentAPI.deleteReceipt(id);
      showToast('Receipt removed');
      setViewReceipt(null);
      loadPayments();
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    }
  };

  const openEdit = (p) => {
    setEditing(p);
    handleProjectChange(p.project?._id || p.project);
    setAddModal(true);
  };

  const clearFilters = () => {
    setSearch(''); setFilterProject(''); setFilterStatus('');
    setFilterFrom(''); setFilterTo(''); setPage(1);
  };
  const hasFilters = search || filterProject || filterStatus || filterFrom || filterTo;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        subtitle={`${total} records · ${formatCurrency(totalRec)} received`}
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setMilestones([]); setAddModal(true); }}>
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        }
      />

      {/* ── Stats Row ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Today Received"   value={formatCurrency(stats.todayReceived)}    icon={IndianRupee} color="green"   />
          <StatCard title="This Month"       value={formatCurrency(stats.monthReceived)}     icon={Wallet}      color="blue"    subtitle="Received this month" />
          <StatCard title="All Time"         value={formatCurrency(stats.totalReceivedAll)}  icon={TrendingUp}  color="primary" subtitle="Total collected" />
          <div className="stat-card">
            <p className="text-sm text-gray-500 font-medium">Pending Receivables</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(stats.pendingAmount)}</p>
            <p className="text-xs text-orange-500 mt-0.5">
              {stats.overdueCount > 0
                ? `${stats.overdueCount} milestone${stats.overdueCount > 1 ? 's' : ''} overdue`
                : 'From active projects'}
            </p>
          </div>
        </div>
      )}

      {/* ── Search + Filters ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="form-input pl-9"
              placeholder="Search by transaction ID or remarks…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
              ${showFilters || hasFilters ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 text-gray-600 bg-white'}`}
          >
            <Filter className="w-4 h-4" /> Filters {hasFilters && <span className="w-2 h-2 bg-primary rounded-full" />}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 px-3">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="form-label">Project</label>
              <select className="form-input" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                <option value="">All</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All</option>
                {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">From</label>
              <input className="form-input" type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
            </div>
            <div>
              <label className="form-label">To</label>
              <input className="form-input" type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payments found"
          description={hasFilters ? 'Try different filters' : 'Record your first client payment'}
          action={!hasFilters && (
            <button className="btn-primary" onClick={() => setAddModal(true)}>
              <Plus className="w-4 h-4" /> Record Payment
            </button>
          )}
        />
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Date', 'Project', 'Client', 'Method', 'Status', 'Milestone', 'Amount', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map(p => (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(p.paymentDate)}</td>
                      <td className="px-4 py-3">
                        {p.project ? (
                          <Link to={`/dashboard/projects/${p.project._id}`} className="font-medium text-secondary hover:text-primary">
                            {p.project.projectName}
                          </Link>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{p.client?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-gray-100 text-gray-600 text-xs">{p.paymentMethod}</span>
                      </td>
                      <td className="px-4 py-3"><Badge status={p.status} /></td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[120px] truncate">
                        {p.milestone?.title || '—'}
                      </td>
                      <td className="px-4 py-3 font-bold text-green-600 whitespace-nowrap">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewReceipt(p)}
                            title="View receipt"
                            className={`p-1.5 rounded transition-colors
                              ${p.receiptImage
                                ? 'text-primary hover:bg-primary/10'
                                : 'text-gray-300 hover:bg-gray-100 hover:text-gray-500'}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-xs text-gray-500 font-semibold">
                      Showing {payments.length} of {total}
                    </td>
                    <td className="px-4 py-3 font-bold text-green-700">{formatCurrency(totalRec)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-500">Page {page} of {pages}</p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={addModal}
        onClose={() => { setAddModal(false); setEditing(null); setMilestones([]); }}
        title={editing ? 'Edit Payment' : 'Record Payment'}
        size="md"
      >
        <PaymentForm
          onSubmit={handleSave}
          defaultValues={editing
            ? {
                ...editing,
                paymentDate: editing.paymentDate ? new Date(editing.paymentDate).toISOString().split('T')[0] : '',
                project:  editing.project?._id  || editing.project,
                client:   editing.client?._id   || editing.client,
                milestone: editing.milestone?._id || editing.milestone,
              }
            : {}}
          loading={saving}
          projects={projects}
          clients={clients}
          milestones={milestones}
          onProjectChange={handleProjectChange}
        />
      </Modal>

      {/* ── Receipt Viewer ── */}
      <ReceiptModal
        payment={viewReceipt}
        onClose={() => setViewReceipt(null)}
        onDeleteReceipt={handleDeleteReceipt}
      />
    </div>
  );
}
