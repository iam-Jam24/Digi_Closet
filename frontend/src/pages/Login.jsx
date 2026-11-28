import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { USE_AUTH_EMULATOR } from '../firebase';
import Input from '../components/Input';
import Button from '../components/Button';
import AuthShell from '../components/AuthShell';

const FRIENDLY_ERRORS = {
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/network-request-failed': 'Cannot reach the sign-in service. Make sure the Firebase Auth Emulator is running.',
};

// Firebase errors carry a `code`; anything else came from our own API.
const describeError = (err, fallback) => FRIENDLY_ERRORS[err.code] || (err.code ? fallback : getErrorMessage(err, fallback));

// With the local Auth Emulator, accounts only persist if it was stopped cleanly
// (npm run auth:start / auth:save), so a missing account is the likely cause.
const EMULATOR_HINT = ' Running locally? If the Auth Emulator was restarted, register again with the same email to restore your wardrobe.';
const describeLoginError = (err, fallback) => {
  const message = describeError(err, fallback);
  return USE_AUTH_EMULATOR && ['auth/invalid-credential', 'auth/user-not-found'].includes(err.code) ? message + EMULATOR_HINT : message;
};

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/dashboard';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      await login(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(describeLoginError(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(describeError(err, 'Google sign-in failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      image="/images/editorial/striped-shirt-utility-duo.jpg"
      quote="Every look starts with what you already own."
      title="Sign in to your studio"
      subtitle="Your wardrobe, outfits and saved looks are waiting."
      footer={<>
        Don&apos;t have an account?{' '}
        <Link to="/register" className="auth-card__link">Create one</Link>
      </>}
    >
      <form onSubmit={handleSubmit} className="auth-card__form">
        <Input label="Email" type="email" name="email" placeholder="you@example.com" icon={Mail} value={form.email} onChange={handleChange} />
        <Input label="Password" type="password" name="password" placeholder="Enter your password" icon={Lock} value={form.password} onChange={handleChange} />

        {error && <div className="alert alert--error">{error}</div>}

        <Button type="submit" fullWidth loading={loading}>Sign In</Button>
        <Button type="button" variant="outline" fullWidth onClick={handleGoogle} disabled={loading}>
          Continue with Google
        </Button>
      </form>
    </AuthShell>
  );
}
