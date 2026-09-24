import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';

const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-slate-950">
    <Navbar />
    <main>{children}</main>
  </div>
);

const AuthRedirect = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
    <Route path="/register" element={<AuthRedirect><Register /></AuthRedirect>} />
    <Route path="/dashboard" element={
      <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
    } />
    <Route path="/tasks" element={
      <ProtectedRoute><AppLayout><Tasks /></AppLayout></ProtectedRoute>
    } />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  </AuthProvider>
);

export default App;
