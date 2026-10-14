import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Scissors } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';

const FRIENDLY_ERRORS = {
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/invalid-email': 'Please enter a valid email address.',
};

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

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
      navigate('/dashboard');
    } catch (err) {
      setError(FRIENDLY_ERRORS[err.code] || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(FRIENDLY_ERRORS[err.code] || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="centered-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <div className="auth-card__logo"><Scissors size={24} /></div>
          <h1 className="auth-card__title">Welcome back</h1>
          <p className="auth-card__subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-card__form">
          <Input label="Email" type="email" name="email" placeholder="you@example.com" icon={Mail} value={form.email} onChange={handleChange} />
          <Input label="Password" type="password" name="password" placeholder="Enter your password" icon={Lock} value={form.password} onChange={handleChange} />

          {error && <div className="alert alert--error">{error}</div>}

          <Button type="submit" fullWidth loading={loading}>Sign In</Button>
          <Button type="button" variant="outline" fullWidth onClick={handleGoogle} disabled={loading}>
            Continue with Google
          </Button>
        </form>

        <p className="auth-card__footer">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="auth-card__link">Create one</Link>
        </p>
      </div>
    </div>
  );
}
