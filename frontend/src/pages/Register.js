import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await register({ name, email, password });
    
    if (result.success) {
      navigate('/login');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  }

  return (
    <div className="card">
      <h2 className="page-title">Register</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">Name</label>
          <input
            className="input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <div className="error">{error}</div>
        )}
        <button type="submit" disabled={loading} className="button" style={{ marginTop: 12 }}>
          {loading ? 'Registering…' : 'Register'}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        Have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;
