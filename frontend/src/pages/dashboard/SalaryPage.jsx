import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator, RefreshCw, CheckCircle, Trash2, Eye,
  IndianRupee, Users, AlertCircle, Plus,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { workerAPI, salaryAPI } from '../../api';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/shared/Modal';
import EmptyState from '../../components/shared/EmptyState';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { formatCurrency, formatDate, getMonthName, MONTHS, PAYMENT_MODES } from '../../utils/helpers';

// ─── CALCULATE MODAL ──────────────────────────────────────────────────────────

function CalculateModal({ open, onClose, workers, month, year, onSuccess }) {
  const { showToast } = useApp();
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const workerId = watch('worker');

  // Auto-preview when worker changes
  useEffect(() => {
    if (!workerId) { setPreview(null); return; }
    const timer = setTimeout(async () => {
      setLoadingPreview(true);
      try {
        const res = await salaryAPI.preview({ worker: workerId, month, year });
        setPreview(res.data);
      } catch {
        setPreview(null);
      } finally {
        setLoadingPreview(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [workerId, month, year]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      await salaryAPI.calculate({
        worker: data.worker,
        month,
        year,
        otherDeductions: Number(data.otherDeductions || 0),
        deductionNotes: data.deductionNotes || '',
        notes: data.notes || '',
      });
      showToast('Salary calculated & saved');
      reset();
      setPreview(null);
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Calculate Salary — ${getMonthName(month)} ${year}`} size="md">
      <form onSubmit={handleSubmit(handleSave)} className="space-y-5">
        <div>
          <label className="form-label">Select Worker *</label>
          <select className="form-input" {...register('worker', { required: 'Worker is required' })}>
            <option value="">— Choose worker —</option>
            {workers.map(w => (
              <option key={w._id} value={w._id}>
                {w.name} ({w.role}) — ₹{w.dailyRate}/day
              </option>
            ))}
          </select>
          {errors.worker && <p className="text-xs text-red-500 mt-1">{errors.worker.message}</p>}
        </div>

        {/* Preview box */}
        {loadingPreview && <div className="flex items-center gap-2 text-sm text-gray-500"><RefreshCw className="w-4 h-4 animate-spin" /> Loading attendance data...</div>}
        {preview && !loadingPreview && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Auto-calculated from attendance</p>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-lg font-bold text-green-700">{preview.daysPresent}</p>
                <p className="text-green-600">Present</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-2">
                <p className="text-lg font-bold text-yellow-700">{preview.daysHalfDay}</p>
                <p className="text-yellow-600">Half Day</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2">
                <p className="text-lg font-bold text-red-700">{preview.daysAbsent}</p>
                <p className="text-red-600">Absent</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-2">
                <p className="text-lg font-bold text-purple-700">{preview.daysLeave}</p>
                <p className="text-purple-600">Leave</p>
              </div>
            </div>
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Effective Days</span><span className="font-semibold">{preview.effectiveDays.toFixed(1)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Daily Rate</span><span>₹{preview.dailyRate}</span></div>
              <div className="flex justify-between text-sm font-semibold"><span>Gross Amount</span><span>{formatCurrency(preview.grossAmount)}</span></div>
              {preview.totalAdvance > 0 && (
                <div className="flex justify-between text-sm text-red-600"><span>Advance Deduction ({preview.pendingAdvanceCount} records)</span><span>- {formatCurrency(preview.totalAdvance)}</span></div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 text-primary">
                <span>Estimated Net Payable</span>
                <span>{formatCurrency(preview.finalPayable)}</span>
              </div>
            </div>
            {preview.attendanceCount === 0 && (
              <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg mt-2">
                <AlertCircle className="w-4 h-4" />
                No attendance records found for this month. Salary will be ₹0.
              </div>
            )}
          </div>
        )}

        {preview && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Extra Deductions (₹)</label>
                <input className="form-input" type="number" min="0" {...register('otherDeductions')} placeholder="0" />
              </div>
              <div>
                <label className="form-label">Deduction Reason</label>
                <input className="form-input" {...register('deductionNotes')} placeholder="Fine, material damage..." />
              </div>
            </div>
            <div>
              <label className="form-label">Notes</label>
              <textarea className="form-input h-16 resize-none" {...register('notes')} />
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
              {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Calculator className="w-4 h-4" /> Save Salary Record</>}
            </button>
          </>
        )}
      </form>
    </Modal>
  );
}

// ─── PAY MODAL ────────────────────────────────────────────────────────────────

function PayModal({ open, onClose, salary, onSuccess }) {
  const { showToast } = useApp();
  const { register, handleSubmit } = useForm({
    defaultValues: { paymentMode: 'Cash', paidAmount: salary?.finalPayable || 0 },
  });
  const [saving, setSaving] = useState(false);

  if (!salary) return null;

  const handlePay = async (data) => {
    setSaving(true);
    try {
      await salaryAPI.markPaid(salary._id, {
        paymentMode: data.paymentMode,
        paidAmount: Number(data.paidAmount),
      });
      showToast('Payment recorded');
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Record Payment" size="sm">
      <div className="space-y-4">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">{salary.workerName} — {getMonthName(salary.month)} {salary.year}</p>
          <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(salary.finalPayable)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Net Payable Amount</p>
        </div>
        <form onSubmit={handleSubmit(handlePay)} className="space-y-4">
          <div>
            <label className="form-label">Payment Mode</label>
            <select className="form-input" {...register('paymentMode')}>
              {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Amount Paid (₹)</label>
            <input className="form-input" type="number" min="0" {...register('paidAmount')} defaultValue={salary.finalPayable} />
          </div>
          <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? 'Recording...' : <><CheckCircle className="w-4 h-4" /> Confirm Payment</>}
          </button>
        </form>
      </div>
    </Modal>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function SalaryPage() {
  const { showToast } = useApp();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [filterPaid, setFilterPaid] = useState('');

  const [salaries, setSalaries] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calcModal, setCalcModal] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [totalPayable, setTotalPayable] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { month, year };
      if (filterPaid !== '') params.isPaid = filterPaid;
      const [sr, wr] = await Promise.all([
        salaryAPI.getAll(params),
        workerAPI.getAll({ isActive: 'true' }),
      ]);
      setSalaries(sr.data || []);
      setTotalPayable(sr.totalPayable || 0);
      setTotalPaid(sr.totalPaid || 0);
      setWorkers(wr.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, year, filterPaid]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this salary record? Advance deductions will be reversed.')) return;
    try {
      await salaryAPI.delete(id);
      showToast('Salary record deleted');
      load();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary Management"
        subtitle={`${getMonthName(month)} ${year} — Auto-calculated from attendance`}
        action={
          <button className="btn-primary" onClick={() => setCalcModal(true)}>
            <Calculator className="w-4 h-4" /> Calculate Salary
          </button>
        }
      />

      {/* Month / Year / Filter controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <select className="form-input w-36" value={month} onChange={e => setMonth(Number(e.target.value))}>
          {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <input
          className="form-input w-24"
          type="number"
          value={year}
          min={2020}
          max={2099}
          onChange={e => setYear(Number(e.target.value))}
        />
        <select className="form-input w-32" value={filterPaid} onChange={e => setFilterPaid(e.target.value)}>
          <option value="">All</option>
          <option value="false">Pending</option>
          <option value="true">Paid</option>
        </select>

        {/* Totals */}
        <div className="ml-auto flex gap-4 text-sm">
          <div className="text-right">
            <p className="text-gray-400 text-xs">Total Payable</p>
            <p className="font-bold text-secondary">{formatCurrency(totalPayable)}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Total Paid</p>
            <p className="font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-16" />
      ) : salaries.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="No salary records"
          description={`No salary records for ${getMonthName(month)} ${year}. Calculate salaries from attendance data.`}
          action={
            <button className="btn-primary" onClick={() => setCalcModal(true)}>
              <Calculator className="w-4 h-4" /> Calculate Salary
            </button>
          }
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Worker', 'Eff. Days', 'Gross', 'Advance', 'Deductions', 'Net Payable', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {salaries.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/dashboard/workers/${s.worker?._id || s.worker}`} className="font-medium text-secondary hover:text-primary">
                        {s.workerName || s.worker?.name}
                      </Link>
                      <p className="text-xs text-gray-400">{s.worker?.role}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold">{s.effectiveDays?.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">
                          {s.daysPresent}P · {s.daysHalfDay}H · {s.daysAbsent}A · {s.daysLeave}L
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(s.grossAmount)}</td>
                    <td className="px-4 py-3 text-red-500">
                      {s.totalAdvance > 0 ? `−${formatCurrency(s.totalAdvance)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-orange-600">
                      {s.otherDeductions > 0 ? `−${formatCurrency(s.otherDeductions)}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-bold text-secondary">{formatCurrency(s.finalPayable)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${s.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {s.isPaid ? `Paid ${formatDate(s.paidDate)}` : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {!s.isPaid && (
                          <button
                            onClick={() => setPayModal(s)}
                            className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Pay
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete salary record"
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
      )}

      {/* Modals */}
      <CalculateModal
        open={calcModal}
        onClose={() => setCalcModal(false)}
        workers={workers}
        month={month}
        year={year}
        onSuccess={load}
      />
      <PayModal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        salary={payModal}
        onSuccess={load}
      />
    </div>
  );
}
