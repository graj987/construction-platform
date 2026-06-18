import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import LoadingSpinner from './components/shared/LoadingSpinner';

// ─── Layouts — static imports (tiny, needed immediately as route shells) ───────
import PublicLayout    from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// ─── Public pages — lazy loaded ───────────────────────────────────────────────
// Each becomes its own JS chunk, downloaded only when the route is visited.
const HomePage      = lazy(() => import('./pages/public/HomePage'));
const AboutPage     = lazy(() => import('./pages/public/AboutPage'));
const ServicesPage  = lazy(() => import('./pages/public/ServicesPage'));
const ProjectsPage  = lazy(() => import('./pages/public/ProjectsPage'));
const ContactPage   = lazy(() => import('./pages/public/ContactPage'));
const AIPlannerPage = lazy(() => import('./pages/ai/AIPlannerPage'));

// ─── Dashboard pages — lazy loaded ───────────────────────────────────────────
// recharts (DashboardHome, ProfitabilityPage, ProjectDetailPage) only downloads
// when the user navigates to one of those routes.
const DashboardHome    = lazy(() => import('./pages/dashboard/DashboardHome'));
const ClientsPage      = lazy(() => import('./pages/dashboard/ClientsPage'));
const ProjectsDashPage = lazy(() => import('./pages/dashboard/ProjectsPage'));
const ProjectDetailPage= lazy(() => import('./pages/dashboard/ProjectDetailPage'));
const WorkersPage      = lazy(() => import('./pages/dashboard/WorkersPage'));
const WorkerDetailPage = lazy(() => import('./pages/dashboard/WorkerDetailPage'));
const AttendancePage   = lazy(() => import('./pages/dashboard/AttendancePage'));
const SalaryPage       = lazy(() => import('./pages/dashboard/SalaryPage'));
const MaterialsPage    = lazy(() => import('./pages/dashboard/MaterialsPage'));
const ExpensesPage     = lazy(() => import('./pages/dashboard/ExpensesPage'));
const ProfitabilityPage= lazy(() => import('./pages/dashboard/ProfitabilityPage'));
const PaymentsPage     = lazy(() => import('./pages/dashboard/PaymentsPage'));
const ReceivablesPage  = lazy(() => import('./pages/dashboard/ReceivablesPage'));
const QuotationsPage   = lazy(() => import('./pages/dashboard/QuotationsPage'));
const DiaryPage        = lazy(() => import('./pages/dashboard/DiaryPage'));
const ContactsPage     = lazy(() => import('./pages/dashboard/ContactsPage'));

// ─── Suspense fallback ────────────────────────────────────────────────────────
// Shown while a lazy chunk is being fetched. Kept minimal so it renders fast.
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        {/*
          Single Suspense boundary wrapping all routes.
          - On initial page load: shows spinner until the first route chunk resolves.
          - On subsequent navigations to already-visited routes: chunk is cached, <1 frame.
          - Layouts (PublicLayout, DashboardLayout) are static so the shell renders
            immediately; only the <Outlet> content suspends.
        */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public ── */}
            <Route element={<PublicLayout />}>
              <Route path="/"         element={<HomePage />} />
              <Route path="/about"    element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/contact"  element={<ContactPage />} />
              <Route path="/planner"  element={<AIPlannerPage />} />
            </Route>

            {/* ── Dashboard ── */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />

              {/* Business */}
              <Route path="clients"      element={<ClientsPage />} />
              <Route path="projects"     element={<ProjectsDashPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="quotations"   element={<QuotationsPage />} />

              {/* Finance */}
              <Route path="payments"      element={<PaymentsPage />} />
              <Route path="receivables"   element={<ReceivablesPage />} />
              <Route path="expenses"      element={<ExpensesPage />} />
              <Route path="profitability" element={<ProfitabilityPage />} />

              {/* Workers */}
              <Route path="workers"      element={<WorkersPage />} />
              <Route path="workers/:id"  element={<WorkerDetailPage />} />

              {/* Labor */}
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="salary"     element={<SalaryPage />} />

              {/* Site */}
              <Route path="materials" element={<MaterialsPage />} />
              <Route path="diary"     element={<DiaryPage />} />

              {/* Leads */}
              <Route path="contacts"   element={<ContactsPage />} />

              {/* AI Tools */}
              <Route path="ai-planner" element={<AIPlannerPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}
