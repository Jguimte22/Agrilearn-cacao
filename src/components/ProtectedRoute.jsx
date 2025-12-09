  import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  // Check both localStorage and sessionStorage for token
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token) {
    console.log('No authentication token found, redirecting to login');
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  return children;
}
