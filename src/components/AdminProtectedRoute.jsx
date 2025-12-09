import { Navigate } from 'react-router-dom';

export default function AdminProtectedRoute({ children }) {
  const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');

  if (!adminToken) {
    console.log('No admin token found, redirecting to admin login');
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  return children;
}
