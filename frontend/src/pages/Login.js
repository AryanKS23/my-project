import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User, Shield } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loginType, setLoginType] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      
      if (response.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'Email not verified. Please verify your email first') {
        setError(detail + '. Redirecting to verification...');
        setTimeout(() => {
          localStorage.setItem('pending_email', formData.email);
          navigate('/verify-otp');
        }, 2000);
      } else {
        setError(detail || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F2EA] via-[#E8EFE6] to-[#F5F2EA] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Login to your HealthAdvisor account</p>
        </div>

        <div className="card">
          <div className="mb-6">
            <label className="block text-sm font-medium text-primary mb-3">Login As</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                data-testid="login-type-user"
                onClick={() => setLoginType('user')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  loginType === 'user'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary/30'
                }`}
              >
                <User className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-sm font-medium text-primary">User</p>
              </button>
              <button
                type="button"
                data-testid="login-type-admin"
                onClick={() => setLoginType('admin')}
                className={`p-3 rounded-xl border-2 transition-all ${
                  loginType === 'admin'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary/30'
                }`}
              >
                <Shield className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-sm font-medium text-primary">Admin</p>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  data-testid="login-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field pl-10"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  data-testid="login-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {error && (
              <div data-testid="login-error" className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : (
                <>
                  Login <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button onClick={() => navigate('/signup')} className="text-primary font-medium hover:underline">
                Sign up
              </button>
            </p>
          </div>
        </div>

        {loginType === 'admin' && (
          <div className="mt-6 card bg-blue-50 border-blue-200">
            <p className="text-sm text-gray-700 mb-2 font-medium">Demo Admin Credentials:</p>
            <p className="text-xs text-gray-600">Email: admin@healthadvisor.com</p>
            <p className="text-xs text-gray-600">Password: admin123</p>
          </div>
        )}
      </div>
    </div>
  );
}