import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderOpen, ClipboardList, Calculator,
  Package, FileText, BookOpen, Building2, Menu, X, ChevronRight,
  Bell, UserCheck, HardHat, Receipt, TrendingUp, Wallet, ArrowDownUp,
  Brain,
} from 'lucide-react';

const navGroups = [
  {
    label: null,
    items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true }],
  },
  {
    label: 'Business',
    items: [
      { to: '/dashboard/clients',    icon: Users,      label: 'Clients' },
      { to: '/dashboard/projects',   icon: FolderOpen, label: 'Projects' },
      { to: '/dashboard/quotations', icon: FileText,   label: 'Quotations' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/dashboard/payments',      icon: Wallet,      label: 'Payments' },
      { to: '/dashboard/receivables',   icon: ArrowDownUp, label: 'Receivables' },
      { to: '/dashboard/expenses',      icon: Receipt,     label: 'Expenses' },
      { to: '/dashboard/profitability', icon: TrendingUp,  label: 'Profitability' },
    ],
  },
  {
    label: 'Labor',
    items: [
      { to: '/dashboard/workers',    icon: HardHat,   label: 'Workers' },
      { to: '/dashboard/attendance', icon: UserCheck, label: 'Attendance' },
      { to: '/dashboard/salary',     icon: Calculator,label: 'Salary' },
    ],
  },
  {
    label: 'Site',
    items: [
      { to: '/dashboard/materials', icon: Package,  label: 'Materials' },
      { to: '/dashboard/diary',     icon: BookOpen, label: 'Site Diary' },
    ],
  },
  {
    label: 'Leads',
    items: [
      { to: '/dashboard/contacts', icon: ClipboardList, label: 'Enquiries' },
    ],
  },
  {
    label: 'AI Tools',
    items: [
      { to: '/dashboard/ai-planner', icon: Brain, label: 'AI Planner' },
    ],
  },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-200
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-200 flex-shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-secondary text-sm leading-none block">BuildBihar</span>
            <span className="text-xs text-gray-500 leading-none">Owner Panel</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-hide space-y-4">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ to, icon: Icon, label, end }) => (
                  <NavLink
                    key={to} to={to} end={end}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" /> {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 flex-shrink-0">
          <Link to="/" className="sidebar-link text-xs">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to Website
          </Link>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-4 lg:px-6 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100"><Bell className="w-5 h-5" /></button>
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">O</div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
