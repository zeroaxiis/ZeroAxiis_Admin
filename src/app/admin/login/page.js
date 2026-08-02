'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (!result.success) {
      showToast(result.message || 'Invalid credentials', 'error');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-top-nav">
        <div className="flex items-center gap-2.5">
          <Logo size={24} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
            ZeroAxiis
          </span>
        </div>
      </div>

      <div className="login-box">
        <div className="login-box-header">
          <h1 className="login-box-title">Sign in</h1>
          <p className="login-box-desc">
            Enter your credentials to access the admin panel.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@zeroaxiis.tech"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
