import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSpinner from './common/LoadingSpinner';

/**
 * DashboardRedirect — Inspects the authenticated user's role and routes them
 * to the correct dashboard (/admin/dashboard or /student/dashboard).
 */
const DashboardRedirect = () => {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <LoadingSpinner size="lg" text="Redirecting to dashboard..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/student/dashboard" replace />;
};

export default DashboardRedirect;
