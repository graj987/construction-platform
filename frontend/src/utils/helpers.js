export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateInput = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

export const getMonthName = (m) => new Date(2024, m - 1, 1).toLocaleString('default', { month: 'long' });

export const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }));

// ─── STATUS BADGE COLORS ─────────────────────────────────────────────────────

export const STATUS_COLORS = {
  'New Lead':            'bg-blue-100 text-blue-800',
  Contacted:             'bg-yellow-100 text-yellow-800',
  'Site Visit':          'bg-purple-100 text-purple-800',
  'Quotation Sent':      'bg-orange-100 text-orange-800',
  'Construction Started':'bg-green-100 text-green-800',
  Completed:             'bg-gray-100 text-gray-700',
  Lost:                  'bg-red-100 text-red-800',
  Planning:              'bg-blue-100 text-blue-800',
  Foundation:            'bg-yellow-100 text-yellow-800',
  Structure:             'bg-orange-100 text-orange-800',
  Brickwork:             'bg-amber-100 text-amber-800',
  Finishing:             'bg-green-100 text-green-800',
  'On Hold':             'bg-red-100 text-red-800',
  Draft:                 'bg-gray-100 text-gray-700',
  Sent:                  'bg-blue-100 text-blue-800',
  Accepted:              'bg-green-100 text-green-800',
  Rejected:              'bg-red-100 text-red-800',
  Present:               'bg-green-100 text-green-800',
  'Half Day':            'bg-yellow-100 text-yellow-800',
  Absent:                'bg-red-100 text-red-800',
  Leave:                 'bg-purple-100 text-purple-800',
  Active:                'bg-green-100 text-green-800',
  Inactive:              'bg-gray-100 text-gray-600',
  Paid:                  'bg-green-100 text-green-800',
  Pending:               'bg-yellow-100 text-yellow-800',
  // Payment statuses
  Received:              'bg-green-100 text-green-800',
  Partial:               'bg-blue-100 text-blue-800',
  Cancelled:             'bg-gray-100 text-gray-600',
  // Milestone statuses
  Upcoming:              'bg-blue-100 text-blue-800',
  Overdue:               'bg-red-100 text-red-800',
};

// ─── EXPENSE CATEGORY CONFIG ─────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
  'Material','Labor','Transport','Equipment','Machinery',
  'Food','Accommodation','Site Maintenance','Government Fees','Miscellaneous',
];

export const CATEGORY_COLORS = {
  Material:           { bg: 'bg-orange-100', text: 'text-orange-700', hex: '#ea580c' },
  Labor:              { bg: 'bg-blue-100',   text: 'text-blue-700',   hex: '#2563eb' },
  Transport:          { bg: 'bg-yellow-100', text: 'text-yellow-700', hex: '#ca8a04' },
  Equipment:          { bg: 'bg-purple-100', text: 'text-purple-700', hex: '#7c3aed' },
  Machinery:          { bg: 'bg-red-100',    text: 'text-red-700',    hex: '#dc2626' },
  Food:               { bg: 'bg-green-100',  text: 'text-green-700',  hex: '#16a34a' },
  Accommodation:      { bg: 'bg-teal-100',   text: 'text-teal-700',   hex: '#0d9488' },
  'Site Maintenance': { bg: 'bg-amber-100',  text: 'text-amber-700',  hex: '#b45309' },
  'Government Fees':  { bg: 'bg-indigo-100', text: 'text-indigo-700', hex: '#4f46e5' },
  Miscellaneous:      { bg: 'bg-gray-100',   text: 'text-gray-600',   hex: '#6b7280' },
};

// ─── PAYMENT CONSTANTS ────────────────────────────────────────────────────────

export const PAYMENT_STATUSES  = ['Received', 'Pending', 'Partial', 'Cancelled'];
export const MILESTONE_STAGES  = [
  'Booking Advance', 'Foundation Completion', 'Structure Completion',
  'Roofing Completion', 'Plumbing & Electrical', 'Finishing Completion', 'Final Handover',
];

// ─── GENERAL CONSTANTS ────────────────────────────────────────────────────────

export const DISTRICTS           = ['Bhojpur','Chhapra','Vaishali','Patna','Other'];
export const CONSTRUCTION_TYPES  = ['Economy','Standard','Premium','Luxury'];
export const CLIENT_STATUSES     = ['New Lead','Contacted','Site Visit','Quotation Sent','Construction Started','Completed','Lost'];
export const PROJECT_STATUSES    = ['Planning','Foundation','Structure','Brickwork','Plumbing','Electrical','Finishing','Completed','On Hold'];
export const WORKER_ROLES        = ['Mason','Carpenter','Electrician','Plumber','Helper','Painter','Supervisor','Welder','Tile Fitter','Other'];
export const MATERIAL_CATEGORIES = ['Cement','Sand','Bricks','Steel','Tiles','Wood','Electrical','Plumbing','Paint','Other'];
export const ATTENDANCE_STATUSES = ['Present','Half Day','Absent','Leave'];
export const PAYMENT_MODES       = ['Cash','Bank Transfer','UPI','Cheque','Other'];
