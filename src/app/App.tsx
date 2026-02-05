import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreatePR from './pages/CreatePR';
import PRTracking from './pages/PRTracking';
import PRApproval from './pages/PRApproval';
import VendorList from './pages/VendorList';
import POManagement from './pages/POManagement';
import WarehouseReceiving from './pages/WarehouseReceiving';
import Logistics from './pages/Logistics';
import FinanceReconciliation from './pages/FinanceReconciliation';
import AuditLog from './pages/AuditLog';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Main App Routes Component
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pr/create" element={<CreatePR />} />
                <Route path="/pr/tracking" element={<PRTracking />} />
                <Route path="/pr/approval" element={<PRApproval />} />
                <Route path="/vendors" element={<VendorList />} />
                <Route path="/po" element={<POManagement />} />
                <Route path="/warehouse/receiving" element={<WarehouseReceiving />} />
                <Route path="/logistics" element={<Logistics />} />
                <Route path="/finance/reconciliation" element={<FinanceReconciliation />} />
                <Route path="/audit" element={<AuditLog />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

// Main App Component
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
