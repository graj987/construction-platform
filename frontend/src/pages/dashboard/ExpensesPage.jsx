import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Trash2, Edit, Receipt, Filter,
  Eye, Download, X, ChevronLeft, ChevronRight, FileImage,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { expenseAPI, projectAPI } from '../../api';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/shared/Modal';
import EmptyState from '../../components/shared/EmptyState';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import StatCard from '../../components/shared/StatCard';
import {
  formatCurrency, formatDate, EXPENSE_CATEGORIES, CATEGORY_COLORS, PAYMENT_MODES,
} from '../../utils/helpers';

// ─── CATEGORY BADGE ───────────────────────────────────────────────────────────

function CategoryBadge({ category }) {
  const c = CATEGORY_COLORS[category] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  return <span className={`badge text-xs ${c.bg} ${c.text}`}>{category}</span>;
}

// ─── QUICK-ADD / EDIT FORM ────────────────────────────────────────────────────

function ExpenseForm({ onSubmit, defaultValues, loading, projects }) {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: defaultValues || { date: new Date().toISOString().split('T')[0] },
  });
  const billRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(defaultValues?.billImage || null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      encType="multipart/form-data"
      className="space-y-4"
    >
      {/* Row 1 — Category + Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Category *</label>
          <select className="form-input" {...register('category', { required: 'Required' })}>
            <option value="">Select…</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
        </div>
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
      </div>

      {/* Row 2 — Date + Payment */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Date *</label>
          <input className="form-input" type="date" {...register('date', { required: 'Required' })} />
        </div>
        <div>
          <label className="form-label">Payment Method</label>
          <select className="form-input" {...register('paymentMethod')}>
            {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Row 3 — Description */}
      <div>
        <label className="form-label">Description *</label>
        <input
          className="form-input"
          placeholder="What was purchased / paid for?"
          {...register('description', { required: 'Required' })}
        />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
      </div>

      {/* Row 4 — Project + Vendor */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Project</label>
          <select className="form-input" {...register('project')}>
            <option value="">— None —</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Vendor / Supplier</label>
          <input className="form-input" placeholder="Shop / person name" {...register('vendor')} />
        </div>
      </div>

      {/* Row 5 — Bill upload */}
      <div>
        <label className="form-label">Bill / Receipt (JPG, PNG, PDF — max 10 MB)</label>
        <input
          ref={billRef}
          className="form-input py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0
            file:text-xs file:font-semibold file:bg-primary/10 file:text-primary
            hover:file:bg-primary/20 cursor-pointer"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          {...register('bill')}
          onChange={handleFileChange}
        />
        {previewUrl && previewUrl !== 'null' && (
          <div className="mt-2 relative inline-block">
            {previewUrl.startsWith('blob:') || previewUrl.endsWith('.jpg') || previewUrl.endsWith('.png') || previewUrl.endsWith('.webp') ? (
              <img
                src={previewUrl}
                alt="bill preview"
                className="h-24 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">
                <FileImage className="w-4 h-4" /> {defaultValues?.billOriginalName || 'Attached file'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="form-label">Notes</label>
        <textarea className="form-input h-16 resize-none" {...register('notes')} placeholder="Optional notes…" />
      </div>

      <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
        {loading ? 'Saving…' : <><Receipt className="w-4 h-4" /> Save Expense</>}
      </button>
    </form>
  );
}

// ─── RECEIPT VIEWER MODAL ─────────────────────────────────────────────────────

function ReceiptModal({ expense, onClose, onDeleteBill }) {
  if (!expense) return null;
  const isImage = expense.billImage && !expense.billImage.endsWith('.pdf');
  return (
    <Modal open={!!expense} onClose={onClose} title="Receipt / Bill" size="md">
      <div className="space-y-4">
        {expense.billImage ? (
          <div className="text-center">
            {isImage ? (
              <img
                src={expense.billImage}
                alt="receipt"
                className="max-h-96 mx-auto rounded-xl object-contain border border-gray-200"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <FileImage className="w-16 h-16 text-gray-300" />
                <p className="text-gray-600 text-sm">{expense.billOriginalName || 'PDF Document'}</p>
              </div>
            )}
            <div className="flex gap-3 justify-center mt-4">
              <a
                href={expense.billImage}
                target="_blank"
                rel="noreferrer"
                download
                className="btn-outline text-sm py-2 px-4"
              >
                <Download className="w-4 h-4" /> Download
              </a>
              <button
                onClick={() => onDeleteBill(expense._id)}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Remove Bill
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No bill attached to this expense.</p>
          </div>
        )}
        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{formatDate(expense.date)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-secondary">{formatCurrency(expense.amount)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Vendor</span><span>{expense.vendor || '—'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Payment</span><span>{expense.paymentMethod}</span></div>
        </div>
      </div>
    </Modal>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const { showToast } = useApp();

  const [expenses,   setExpenses]   = useState([]);
  const [projects,   setProjects]   = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [total,      setTotal]      = useState(0);
  const [pageTotal,  setPageTotal]  = useState(0);
  const [page,       setPage]       = useState(1);
  const [pages,      setPages]      = useState(1);

  const [addModal,   setAddModal]   = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [viewReceipt, setViewReceipt] = useState(null);

  // Filters
  const [search,        setSearch]        = useState('');
  const [filterCat,     setFilterCat]     = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterFrom,    setFilterFrom]    = useState('');
  const [filterTo,      setFilterTo]      = useState('');
  const [showFilters,   setShowFilters]   = useState(false);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search)        params.search   = search;
      if (filterCat)     params.category = filterCat;
      if (filterProject) params.project  = filterProject;
      if (filterFrom)    params.from     = filterFrom;
      if (filterTo)      params.to       = filterTo;

      const [er, st] = await Promise.all([
        expenseAPI.getAll(params),
        expenseAPI.getStats(),
      ]);
      setExpenses(er.data    || []);
      setTotal(er.total      || 0);
      setPageTotal(er.totalAmount || 0);
      setPages(er.pages      || 1);
      setStats(st.data);
    } catch (err) {
      showToast(err.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCat, filterProject, filterFrom, filterTo]);

  // Load projects once
  useEffect(() => {
    projectAPI.getAll().then(r => setProjects(r.data || []));
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(loadExpenses, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [loadExpenses]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, filterCat, filterProject, filterFrom, filterTo]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const buildFormData = (data) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (k === 'bill') {
        if (v && v[0]) fd.append('bill', v[0]);
      } else if (v !== undefined && v !== null) {
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
        await expenseAPI.update(editing._id, fd);
        showToast('Expense updated');
      } else {
        await expenseAPI.create(fd);
        showToast('Expense recorded');
      }
      setAddModal(false);
      setEditing(null);
      loadExpenses();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expenseAPI.delete(id);
      showToast('Expense deleted');
      loadExpenses();
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    }
  };

  const handleDeleteBill = async (id) => {
    if (!window.confirm('Remove bill attachment?')) return;
    try {
      await expenseAPI.deleteBill(id);
      showToast('Bill removed');
      setViewReceipt(null);
      loadExpenses();
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    }
  };

  const clearFilters = () => {
    setSearch(''); setFilterCat(''); setFilterProject('');
    setFilterFrom(''); setFilterTo(''); setPage(1);
  };
  const hasFilters = search || filterCat || filterProject || filterFrom || filterTo;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Expenses"
        subtitle={`${total} records · ${formatCurrency(pageTotal)} shown`}
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setAddModal(true); }}>
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        }
      />

      {/* ── Stats Row ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Today"        value={formatCurrency(stats.todayTotal)}  icon={Receipt}  color="primary" />
          <StatCard title="This Month"   value={formatCurrency(stats.monthTotal)}  icon={Receipt}  color="orange"  subtitle="Direct expenses" />
          <StatCard title="Total (All)"  value={formatCurrency(stats.totalAll)}    icon={Receipt}  color="blue"    subtitle="All time" />
          <Link to="/dashboard/profitability" className="stat-card hover:shadow-card-hover cursor-pointer">
            <p className="text-sm text-gray-500 font-medium">Project Profit</p>
            <p className="text-base font-bold text-primary mt-1">View Report →</p>
          </Link>
        </div>
      )}

      {/* ── Search + Filter bar ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="form-input pl-9"
              placeholder="Search description or vendor…"
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
              <label className="form-label">Category</label>
              <select className="form-input" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="">All</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Project</label>
              <select className="form-input" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                <option value="">All</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
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

      {/* ── Expense Table ── */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses found"
          description={hasFilters ? 'Try different filters' : 'Add your first expense to start tracking costs'}
          action={!hasFilters && (
            <button className="btn-primary" onClick={() => setAddModal(true)}>
              <Plus className="w-4 h-4" /> Add Expense
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
                    {['Date', 'Category', 'Description', 'Vendor', 'Project', 'Payment', 'Amount', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expenses.map(e => (
                    <tr key={e._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(e.date)}</td>
                      <td className="px-4 py-3"><CategoryBadge category={e.category} /></td>
                      <td className="px-4 py-3 font-medium text-secondary max-w-[180px] truncate">{e.description}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{e.vendor || '—'}</td>
                      <td className="px-4 py-3 text-xs">
                        {e.project ? (
                          <Link to={`/dashboard/projects/${e.project._id}`} className="text-primary hover:underline">
                            {e.project.projectName}
                          </Link>
                        ) : <span className="text-gray-400">General</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-gray-100 text-gray-600 text-xs">{e.paymentMethod}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-secondary whitespace-nowrap">
                        {formatCurrency(e.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewReceipt(e)}
                            title="View bill"
                            className={`p-1.5 rounded transition-colors
                              ${e.billImage
                                ? 'text-primary hover:bg-primary/10'
                                : 'text-gray-300 hover:bg-gray-100 hover:text-gray-500'}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setEditing(e); setAddModal(true); }}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(e._id)}
                            className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-500">Page {page} of {pages} · {total} records</p>
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
        onClose={() => { setAddModal(false); setEditing(null); }}
        title={editing ? 'Edit Expense' : 'Add Expense'}
        size="md"
      >
        <ExpenseForm
          onSubmit={handleSave}
          defaultValues={editing || {}}
          loading={saving}
          projects={projects}
        />
      </Modal>

      {/* ── Receipt Viewer ── */}
      <ReceiptModal
        expense={viewReceipt}
        onClose={() => setViewReceipt(null)}
        onDeleteBill={handleDeleteBill}
      />
    </div>
  );
}
