'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (!result.success) {
      showToast(result.message || 'Invalid email or password', 'error');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-slide-up">
        <div className="text-center mb-8">
          <h1
            className="heading-lg"
            style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}
          >
            ZeroAxiis
          </h1>
          <p className="text-muted">Sign in to the admin panel</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@zeroaxiis.tech"
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

          <button
            type="submit"
            className="btn btn-primary w-full mt-4"
            disabled={loading}
            style={{ padding: '0.85rem' }}
          >
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
