import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import Input from '../components/Input';
import Button from '../components/Button';
import AuthShell from '../components/AuthShell';

const FRIENDLY_ERRORS = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/network-request-failed': 'Cannot reach the sign-in service. Make sure the Firebase Auth Emulator is running.',
};

// Firebase errors carry a `code`; anything else came from our own API.
const describeError = (err, fallback) => FRIENDLY_ERRORS[err.code] || (err.code ? fallback : getErrorMessage(err, fallback));

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
      setError(describeError(err, 'Registration failed. Please try again.'));
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
      setError(describeError(err, 'Google sign-in failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      image="/images/editorial/two-men-grass-field.jpg"
      quote="Your style. Your world."
      title="Create your account"
      subtitle="Build your digital wardrobe and meet your personal AI stylist."
      footer={<>
        Already have an account?{' '}
        <Link to="/login" className="auth-card__link">Sign in</Link>
      </>}
    >
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
    </AuthShell>
  );
}
