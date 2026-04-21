import React, { useState, useEffect, useCallback } from 'react';
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
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');

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

  const handleVerify = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post(`${API}/auth/verify-otp`, { email, otp });
      setSuccess('✓ Email verified successfully! Redirecting...');
      localStorage.removeItem('pending_email');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }, [email, otp, navigate]);

  const handleResend = useCallback(async () => {
    setError('');
    setSuccess('');
    setResending(true);

    try {
      await axios.post(`${API}/auth/resend-otp`, { email });
      setSuccess('✓ OTP sent to your email!');
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  }, [email]);

  const handleChangeEmail = useCallback(() => {
    if (newEmail && newEmail !== email) {
      localStorage.setItem('pending_email', newEmail);
      setEmail(newEmail);
      setNewEmail('');
      setShowChangeEmail(false);
      setSuccess('Email updated. Please request a new OTP.');
    }
  }, [newEmail, email]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F2EA] via-[#E8EFE6] to-[#F5F2EA] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-primary mb-2">Verify Email</h1>
          <p className="text-muted-foreground mb-2">Enter the 6-digit code sent to</p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-primary font-medium">{email}</p>
            <button
              onClick={() => setShowChangeEmail(true)}
              className="text-xs text-primary hover:underline"
            >
              Change
            </button>
          </div>
        </div>

        {showChangeEmail && (
          <div className="card mb-4">
            <h3 className="text-lg font-medium text-primary mb-3">Change Email</h3>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="input-field flex-1"
                placeholder="New email address"
              />
              <button onClick={handleChangeEmail} className="btn-primary px-4">
                Update
              </button>
            </div>
            <button
              onClick={() => setShowChangeEmail(false)}
              className="text-sm text-muted-foreground mt-2 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="card">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Verification Code</label>
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

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
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

        <div className="mt-6 card bg-blue-50 border-blue-200">
          <p className="text-xs text-gray-700">
            <strong>Note:</strong> OTP expires in 5 minutes. Check your spam folder if you don't see the email.
          </p>
        </div>
      </div>
    </div>
  );
}