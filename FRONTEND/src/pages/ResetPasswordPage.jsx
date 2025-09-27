// En FRONTEND/src/pages/ResetPasswordPage.jsx
import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NotificationContext } from '../context/NotificationContext';
import { resetPasswordAPI } from '../api/authApi';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { notify } = useContext(NotificationContext);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      notify('Passwords do not match.', 'error');
      return;
    }
    setLoading(true);

    try {
      const data = await resetPasswordAPI(token, password);
      notify(data.message, 'success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      notify(err.detail || 'An error occurred. The token may be invalid or expired.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page-container" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h1 className="form-title">CREATE NEW PASSWORD</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="input-group">
          <label htmlFor="password">NEW PASSWORD</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="input-group">
          <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" className="form-button" disabled={loading} style={{ marginTop: '1.5rem' }}>
          {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
        </button>
      </form>
    </main>
  );
};

export default ResetPasswordPage;