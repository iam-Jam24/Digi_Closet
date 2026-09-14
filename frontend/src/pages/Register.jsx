import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Scissors } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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
      await register(form.name, form.email, form.password, form.confirmPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-900 rounded-xl mb-4">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-brand-900 font-display">Create your account</h1>
          <p className="text-sm text-brand-500 mt-1">Start your fashion journey today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            placeholder="John Doe"
            icon={User}
            value={form.name}
            onChange={handleChange}
          />
          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="you@example.com"
            icon={Mail}
            value={form.email}
            onChange={handleChange}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="At least 6 characters"
            icon={Lock}
            value={form.password}
            onChange={handleChange}
          />
          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            icon={Lock}
            value={form.confirmPassword}
            onChange={handleChange}
          />

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button type="submit" fullWidth loading={loading} className="mt-2">
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-brand-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
