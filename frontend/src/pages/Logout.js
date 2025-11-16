import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  useEffect(() => {
    logout();
    navigate('/', { replace: true });
  }, [navigate, logout]);
  
  return null;
}

export default Logout;
