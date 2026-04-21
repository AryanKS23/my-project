import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function VerifyOTP() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const pendingEmail = localStorage.getItem('pending_email');
    if (!pendingEmail) {
      navigate('/signup');
      return;
    }
    setEmail(pendingEmail);
  }, [navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post(`${API}/auth/verify-otp`, { email, otp });
      setSuccess('Email verified! Redirecting to login...');
      localStorage.removeItem('pending_email');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResending(true);

    try {
      await axios.post(`${API}/auth/resend-otp`, { email });
      setSuccess('OTP resent successfully!');
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F2EA] via-[#E8EFE6] to-[#F5F2EA] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-primary mb-2">Verify Email</h1>
          <p className="text-muted-foreground">Enter the 6-digit OTP sent to</p>
          <p className="text-primary font-medium">{email}</p>
        </div>

        <div className="card">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">OTP Code</label>
              <input
                data-testid="otp-input"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input-field text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>}

            <button
              data-testid="verify-submit"
              type="submit"
              disabled={loading || otp.length !== 6}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Didn't receive the code?</p>
            <button
              data-testid="resend-otp"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="btn-secondary flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}