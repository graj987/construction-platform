import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, Clock, XCircle, Minus, Save, RefreshCw,
  ChevronLeft, ChevronRight, AlertCircle, Users,
} from 'lucide-react';
import { attendanceAPI, projectAPI } from '../../api';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import { formatDate, getMonthName } from '../../utils/helpers';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUSES = [
  { value: 'Present', label: 'P', icon: CheckCircle, bg: 'bg-green-500', text: 'text-white', light: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'Half Day', label: 'H', icon: Clock, bg: 'bg-yellow-500', text: 'text-white', light: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'Absent', label: 'A', icon: XCircle, bg: 'bg-red-500', text: 'text-white', light: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'Leave', label: 'L', icon: Minus, bg: 'bg-purple-500', text: 'text-white', light: 'bg-purple-100 text-purple-700 border-purple-300' },
];

const today = () => new Date().toISOString().split('T')[0];

const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

const isFuture = (dateStr) => new Date(dateStr) > new Date();

// ─── STATUS BUTTON ────────────────────────────────────────────────────────────

function StatusCycleButton({ current, onChange }) {
  const idx = STATUSES.findIndex(s => s.value === current);
  const st = STATUSES[idx] ?? STATUSES[0];

  const cycle = () => {
    const next = STATUSES[(idx + 1) % STATUSES.length];
    onChange(next.value);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 select-none ${st.light}`}
      title={`Click to change — currently: ${st.value}`}
    >
      <st.icon className="w-3.5 h-3.5" />
      {st.value}
    </button>
  );
}

// ─── MARK TAB ─────────────────────────────────────────────────────────────────

function MarkTab({ projects }) {
  const { showToast } = useApp();
  const [date, setDate] = useState(today());
  const [projectId, setProjectId] = useState('');
  const [rows, setRows] = useState([]);     // { worker, status, overtimeHours, notes, attendanceId }
  const [loadingRows, setLoadingRows] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);
  const [markAll, setMarkAll] = useState('Present');

  // Load workers + existing attendance whenever project or date changes
  const loadRows = useCallback(async () => {
    if (!projectId) { setRows([]); return; }
    setLoadingRows(true);
    try {
      const res = await attendanceAPI.getProjectDay(projectId, date);
      setRows(res.data || []);
      setAlreadySaved(res.alreadySaved || false);
    } catch (err) {
      showToast(err.message || 'Failed to load', 'error');
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  }, [projectId, date]);

  useEffect(() => { loadRows(); }, [loadRows]);

  const setStatus = (workerId, status) => {
    setRows(prev => prev.map(r =>
      r.worker._id === workerId ? { ...r, status } : r
    ));
  };

  const setOT = (workerId, val) => {
    setRows(prev => prev.map(r =>
      r.worker._id === workerId ? { ...r, overtimeHours: Number(val) || 0 } : r
    ));
  };

  const markAllAs = (status) => {
    setMarkAll(status);
    setRows(prev => prev.map(r => ({ ...r, status })));
  };

  const handleSave = async () => {
    if (!projectId) return showToast('Please select a project', 'error');
    if (rows.length === 0) return showToast('No workers to mark', 'error');
    if (isFuture(date)) return showToast("Can't mark attendance for a future date", 'error');

    setSaving(true);
    try {
      await attendanceAPI.mark({
        projectId,
        date,
        records: rows.map(r => ({
          workerId: r.worker._id,
          status: r.status,
          overtimeHours: r.overtimeHours || 0,
          notes: r.notes || '',
        })),
      });
      showToast(`Attendance saved for ${rows.length} workers`);
      setAlreadySaved(true);
      loadRows(); // refresh to show updated data
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Quick stats
  const counts = rows.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Date + Project selector */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Date navigation */}
          <div>
            <label className="form-label">Date</label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDate(d => addDays(d, -1))}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                className="form-input w-36"
                value={date}
                max={today()}
                onChange={e => setDate(e.target.value)}
              />
              <button
                onClick={() => !isFuture(addDays(date, 1)) && setDate(d => addDays(d, 1))}
                disabled={date === today()}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDate(today())}
                className="text-xs text-primary hover:underline ml-1 font-medium"
              >
                Today
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="form-label">Project</label>
            <select className="form-input" value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">— Select a project —</option>
              {projects.filter(p => p.status !== 'Completed').map(p => (
                <option key={p._id} value={p._id}>{p.projectName}</option>
              ))}
            </select>
          </div>

          {rows.length > 0 && (
            <div>
              <label className="form-label">Mark All As</label>
              <div className="flex gap-1.5">
                {STATUSES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => markAllAs(s.value)}
                    className={`px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${markAll === s.value ? `${s.bg} ${s.text} border-transparent` : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick stat pills */}
        {rows.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            {STATUSES.map(s => (
              <span key={s.value} className={`badge text-xs border ${s.light}`}>
                {s.value}: <strong>{counts[s.value] || 0}</strong>
              </span>
            ))}
            {alreadySaved && (
              <span className="badge bg-blue-100 text-blue-700 border border-blue-200 text-xs">
                ✓ Previously saved
              </span>
            )}
          </div>
        )}
      </div>

      {/* Workers list */}
      {!projectId ? (
        <div className="card py-12 text-center">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Select a project to load its workers</p>
        </div>
      ) : loadingRows ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No workers assigned"
          description="Assign workers to this project first"
          action={<Link to="/dashboard/workers" className="btn-primary text-sm">Go to Workers</Link>}
        />
      ) : (
        <div className="space-y-2">
          {rows.map(row => (
            <div
              key={row.worker._id}
              className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow"
            >
              {/* Worker info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {row.worker.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-secondary text-sm truncate">{row.worker.name}</p>
                  <p className="text-xs text-gray-400">{row.worker.role} · ₹{row.worker.dailyRate}/day</p>
                </div>
              </div>

              {/* Status cycle button */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <StatusCycleButton current={row.status} onChange={s => setStatus(row.worker._id, s)} />

                {/* Overtime — compact input, show only on mobile when status = Present */}
                {row.status === 'Present' && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <label className="text-xs text-gray-400 whitespace-nowrap">OT hrs</label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      value={row.overtimeHours || 0}
                      onChange={e => setOT(row.worker._id, e.target.value)}
                      className="w-16 form-input text-xs py-1.5"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Save button — sticky on mobile */}
          <div className="sticky bottom-4 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || isFuture(date)}
              className="btn-primary w-full justify-center text-base py-3 shadow-lg"
            >
              {saving ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Attendance — {formatDate(date)}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── REPORT TAB ───────────────────────────────────────────────────────────────

function ReportTab({ projects }) {
  const { showToast } = useApp();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [projectId, setProjectId] = useState('');
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const params = { month, year };
      if (projectId) params.project = projectId;
      const res = await attendanceAPI.getMonthlyReport(params);
      setReport(res.data || []);
      setTotalCost(res.totalCost || 0);
    } catch (err) {
      showToast(err.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on mount
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="form-label">Month</label>
            <select className="form-input w-36" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Year</label>
            <input
              className="form-input w-24"
              type="number"
              value={year}
              min={2020}
              max={2099}
              onChange={e => setYear(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="form-label">Project (optional)</label>
            <select className="form-input w-48" value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">All Projects</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={load} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Generate Report'}
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : report.length === 0 ? (
        <EmptyState icon={AlertCircle} title="No data found" description="Try a different month, year, or project" />
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Worker', 'Role', 'P', 'H', 'A', 'L', 'Eff. Days', 'Rate', 'Gross'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {report.map(r => (
                    <tr key={r.worker._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-secondary whitespace-nowrap">
                        <Link to={`/dashboard/workers/${r.worker._id}`} className="hover:text-primary">
                          {r.worker.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{r.worker.role}</td>
                      <td className="px-4 py-3"><span className="badge bg-green-100 text-green-700">{r.present}</span></td>
                      <td className="px-4 py-3"><span className="badge bg-yellow-100 text-yellow-700">{r.halfDay}</span></td>
                      <td className="px-4 py-3"><span className="badge bg-red-100 text-red-700">{r.absent}</span></td>
                      <td className="px-4 py-3"><span className="badge bg-purple-100 text-purple-700">{r.leave}</span></td>
                      <td className="px-4 py-3 font-semibold">{r.effectiveDays.toFixed(1)}</td>
                      <td className="px-4 py-3 text-gray-500">₹{r.worker.dailyRate}</td>
                      <td className="px-4 py-3 font-bold text-secondary">₹{r.grossAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={8} className="px-4 py-3 text-sm font-semibold text-secondary">
                      Total Labor Cost — {getMonthName(month)} {year}
                    </td>
                    <td className="px-4 py-3 font-bold text-primary text-base">
                      ₹{totalCost.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [tab, setTab] = useState('mark');
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    projectAPI.getAll()
      .then(r => setProjects(r.data || []))
      .finally(() => setLoadingProjects(false));
  }, []);

  if (loadingProjects) return <LoadingSpinner size="lg" className="py-20" />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance"
        subtitle="Mark daily attendance per project and generate monthly reports"
      />

      {/* Tab switcher */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {[['mark', 'Mark Attendance'], ['report', 'Monthly Report']].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              tab === v ? 'bg-white text-secondary shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'mark' ? <MarkTab projects={projects} /> : <ReportTab projects={projects} />}
    </div>
  );
}
