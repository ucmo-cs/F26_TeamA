import { Routes, Route, Navigate } from 'react-router';
import Header from './Header';
import Home from './pages/Home';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateLoan from './pages/admin/CreateLoan';
import AdminLoanDetails from './pages/admin/AdminLoanDetails';
import AdminEmails from './pages/admin/AdminEmails';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerLoanDetails from './pages/customer/CustomerLoanDetails';
import PaymentSchedule from './pages/customer/PaymentSchedule';
import CustomerProfile from './pages/customer/CustomerProfile';
import { useLanguage } from './i18n/LanguageContext';
import './App.css';

export default function App() {
  const { t } = useLanguage();

  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/admin/login" element={<Login role="admin" />} />
          <Route path="/customer/login" element={<Login role="customer" />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/loans/new"
            element={
              <ProtectedRoute role="admin">
                <CreateLoan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/loans/:id"
            element={
              <ProtectedRoute role="admin">
                <AdminLoanDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/emails"
            element={
              <ProtectedRoute role="admin">
                <AdminEmails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer"
            element={
              <ProtectedRoute role="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/loans/:id"
            element={
              <ProtectedRoute role="customer">
                <CustomerLoanDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/schedule"
            element={
              <ProtectedRoute role="customer">
                <PaymentSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute role="customer">
                <CustomerProfile />
              </ProtectedRoute>
            }
          />

          {/* Legacy redirects */}
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/portal" element={<Navigate to="/admin" replace />} />

          <Route path="*" element={<p className="empty">{t('pageNotFound')}</p>} />
        </Routes>
      </main>
    </>
  );
}
