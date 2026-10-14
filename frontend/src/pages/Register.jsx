import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Scissors } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';

const FRIENDLY_ERRORS = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
};

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await register(form.name, form.email, form.password);
      navigate('/onboarding');
    } catch (err) {
      setError(FRIENDLY_ERRORS[err.code] || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate('/onboarding');
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
          <h1 className="auth-card__title">Create your account</h1>
          <p className="auth-card__subtitle">Start your fashion journey today</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-card__form">
          <Input label="Full Name" name="name" placeholder="John Doe" icon={User} value={form.name} onChange={handleChange} />
          <Input label="Email" type="email" name="email" placeholder="you@example.com" icon={Mail} value={form.email} onChange={handleChange} />
          <Input label="Password" type="password" name="password" placeholder="At least 6 characters" icon={Lock} value={form.password} onChange={handleChange} />
          <Input label="Confirm Password" type="password" name="confirmPassword" placeholder="Confirm your password" icon={Lock} value={form.confirmPassword} onChange={handleChange} />

          {error && <div className="alert alert--error">{error}</div>}

          <Button type="submit" fullWidth loading={loading}>Create Account</Button>
          <Button type="button" variant="outline" fullWidth onClick={handleGoogle} disabled={loading}>
            Continue with Google
          </Button>
        </form>

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-card__link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
