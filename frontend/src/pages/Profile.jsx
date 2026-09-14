import { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useProfile from '../hooks/useProfile';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const STYLE_OPTIONS = [
  'Minimalist', 'Casual', 'Classic', 'Formal', 'Old Money',
  'Gen Z Streetwear', 'Gothic', 'Bright / Maximalist', 'Sporty',
];

const OCCASION_OPTIONS = [
  'Casual', 'College', 'Office', 'Interview',
  'Date', 'Wedding', 'Party', 'Travel',
];

const COLOR_OPTIONS = [
  'Black', 'White', 'Navy', 'Grey', 'Beige', 'Brown',
  'Red', 'Blue', 'Green', 'Pink', 'Maroon', 'Olive',
];

export default function Profile() {
  const { user } = useAuth();
  const { profile, loading, error, saving, updateProfile, refetch } = useProfile();
  const [form, setForm] = useState({
    height: '',
    preferredColors: [],
    preferredStyles: [],
    budgetMin: '',
    budgetMax: '',
    preferredOccasions: [],
  });
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        height: profile.height || '',
        preferredColors: profile.preferredColors || [],
        preferredStyles: profile.preferredStyles || [],
        budgetMin: profile.budgetMin?.toString() || '',
        budgetMax: profile.budgetMax?.toString() || '',
        preferredOccasions: profile.preferredOccasions || [],
      });
    }
  }, [profile]);

  const toggleArrayItem = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess(false);

    try {
      await updateProfile({
        ...form,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : null,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save profile.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        title="My Profile"
        subtitle="Manage your fashion preferences and personal information."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <h2 className="text-base font-semibold text-brand-900 mb-4">Basic Information</h2>
          <div className="grid gap-4">
            <Input
              label="Name"
              value={user?.name || ''}
              disabled
              className="opacity-60"
            />
            <Input
              label="Email"
              value={user?.email || ''}
              disabled
              className="opacity-60"
            />
            <Input
              label="Height"
              placeholder="e.g. 5'10 or 178 cm"
              value={form.height}
              onChange={(e) => {
                setForm({ ...form, height: e.target.value });
                setSuccess(false);
              }}
            />
          </div>
        </Card>

        {/* Preferred Colors */}
        <Card>
          <h2 className="text-base font-semibold text-brand-900 mb-4">Preferred Colors</h2>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => toggleArrayItem('preferredColors', color)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                  form.preferredColors.includes(color)
                    ? 'bg-brand-900 text-white border-brand-900'
                    : 'bg-white text-brand-600 border-brand-200 hover:border-brand-300'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </Card>

        {/* Preferred Styles */}
        <Card>
          <h2 className="text-base font-semibold text-brand-900 mb-4">Preferred Styles</h2>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => toggleArrayItem('preferredStyles', style)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                  form.preferredStyles.includes(style)
                    ? 'bg-brand-900 text-white border-brand-900'
                    : 'bg-white text-brand-600 border-brand-200 hover:border-brand-300'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </Card>

        {/* Budget Range */}
        <Card>
          <h2 className="text-base font-semibold text-brand-900 mb-4">Budget Range (₹)</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Minimum"
              type="number"
              placeholder="e.g. 500"
              value={form.budgetMin}
              onChange={(e) => {
                setForm({ ...form, budgetMin: e.target.value });
                setSuccess(false);
              }}
            />
            <Input
              label="Maximum"
              type="number"
              placeholder="e.g. 5000"
              value={form.budgetMax}
              onChange={(e) => {
                setForm({ ...form, budgetMax: e.target.value });
                setSuccess(false);
              }}
            />
          </div>
        </Card>

        {/* Preferred Occasions */}
        <Card>
          <h2 className="text-base font-semibold text-brand-900 mb-4">Preferred Occasions</h2>
          <div className="flex flex-wrap gap-2">
            {OCCASION_OPTIONS.map((occasion) => (
              <button
                key={occasion}
                type="button"
                onClick={() => toggleArrayItem('preferredOccasions', occasion)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                  form.preferredOccasions.includes(occasion)
                    ? 'bg-brand-900 text-white border-brand-900'
                    : 'bg-white text-brand-600 border-brand-200 hover:border-brand-300'
                }`}
              >
                {occasion}
              </button>
            ))}
          </div>
        </Card>

        {/* Error / Success */}
        {formError && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-red-600">{formError}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-lg">
            <Check className="w-4 h-4 text-emerald-600" />
            <p className="text-sm text-emerald-600">Profile updated successfully.</p>
          </div>
        )}

        <Button type="submit" loading={saving} size="lg">
          <Save className="w-4 h-4" />
          Save Profile
        </Button>
      </form>
    </div>
  );
}
