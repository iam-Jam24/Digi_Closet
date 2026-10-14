import { useState, useEffect } from 'react';
import { Save, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useProfile from '../hooks/useProfile';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmDialog from '../components/ConfirmDialog';

const STYLE_OPTIONS = ['Minimalist', 'Casual', 'Classic', 'Formal', 'Old Money', 'Gen Z Streetwear', 'Gothic', 'Bright / Maximalist', 'Sporty'];
const OCCASION_OPTIONS = ['Casual', 'College', 'Office', 'Interview', 'Date', 'Wedding', 'Party', 'Travel'];
const COLOR_OPTIONS = ['Black', 'White', 'Navy', 'Grey', 'Beige', 'Brown', 'Red', 'Blue', 'Green', 'Pink', 'Maroon', 'Olive'];

function TagToggle({ options, selected, onToggle }) {
  return (
    <div className="tag-toggle-group">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={`filter-chip ${selected.includes(opt) ? 'filter-chip--active' : ''}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ProfileForm({ authUser, form, setForm, toggleArrayItem, handleSubmit, formError, success, saving, setShowDeleteConfirm }) {
  const update = (field) => (e) => { setForm({ ...form, [field]: e.target.value }); };

  return (
    <form onSubmit={handleSubmit} className="auth-card__form">
      <Card>
        <h2 className="section__title">Basic Information</h2>
        <div className="form-grid">
          <Input label="Name" value={authUser?.name || ''} disabled />
          <Input label="Email" value={authUser?.email || ''} disabled />
        </div>
      </Card>

      <Card>
        <h2 className="section__title">Favorite Colors</h2>
        <TagToggle options={COLOR_OPTIONS} selected={form.favoriteColors} onToggle={(v) => toggleArrayItem('favoriteColors', v)} />
      </Card>

      <Card>
        <h2 className="section__title">Disliked Colors</h2>
        <TagToggle options={COLOR_OPTIONS} selected={form.dislikedColors} onToggle={(v) => toggleArrayItem('dislikedColors', v)} />
      </Card>

      <Card>
        <h2 className="section__title">Preferred Styles</h2>
        <TagToggle options={STYLE_OPTIONS} selected={form.preferredStyles} onToggle={(v) => toggleArrayItem('preferredStyles', v)} />
      </Card>

      <Card>
        <h2 className="section__title">Budget Range (₹)</h2>
        <div className="form-grid form-grid--2">
          <Input label="Minimum" type="number" placeholder="e.g. 500" value={form.budgetMin} onChange={update('budgetMin')} />
          <Input label="Maximum" type="number" placeholder="e.g. 5000" value={form.budgetMax} onChange={update('budgetMax')} />
        </div>
      </Card>

      <Card>
        <h2 className="section__title">Preferred Occasions</h2>
        <TagToggle options={OCCASION_OPTIONS} selected={form.preferredOccasions} onToggle={(v) => toggleArrayItem('preferredOccasions', v)} />
      </Card>

      <Card>
        <h2 className="section__title">Optional Physical Profile</h2>
        <p className="text-secondary" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
          Optional, used only to improve fit-related suggestions. Never used for health or appearance judgments.
          Delete it anytime below.
        </p>
        <div className="form-grid form-grid--2">
          <Input label="Height" placeholder="e.g. 5'8&quot; or 173cm" value={form.height} onChange={update('height')} />
          <Input label="Weight" placeholder="Optional" value={form.weight} onChange={update('weight')} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={form.consentGiven} onChange={(e) => setForm({ ...form, consentGiven: e.target.checked })} />
          I consent to storing this physical profile information for personalization.
        </label>
      </Card>

      {formError && <div className="alert alert--error">{formError}</div>}
      {success && <div className="alert alert--success"><Check size={16} /> Profile updated successfully.</div>}

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button type="submit" loading={saving} size="lg"><Save size={16} /> Save Profile</Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => setShowDeleteConfirm(true)}>
          <Trash2 size={16} /> Delete Profile Data
        </Button>
      </div>
    </form>
  );
}

export default function Profile() {
  const { user: authUser } = useAuth();
  const { profile, loading, error, saving, updateProfile, deleteProfileData, refetch } = useProfile();
  const [form, setForm] = useState({
    preferredStyles: [], favoriteColors: [], dislikedColors: [], preferredOccasions: [],
    budgetMin: '', budgetMax: '', height: '', weight: '', consentGiven: false,
  });
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (profile) {
      const sp = profile.stylePreferences || {};
      const pp = profile.physicalProfile || {};
      setForm({
        preferredStyles: sp.preferredStyles || [],
        favoriteColors: sp.favoriteColors || [],
        dislikedColors: sp.dislikedColors || [],
        preferredOccasions: sp.preferredOccasions || [],
        budgetMin: sp.budgetMin?.toString() || '',
        budgetMax: sp.budgetMax?.toString() || '',
        height: pp.height || '',
        weight: pp.weight || '',
        consentGiven: pp.consentGiven || false,
      });
    }
  }, [profile]);

  const toggleArrayItem = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((v) => v !== value) : [...prev[field], value],
    }));
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess(false);
    try {
      await updateProfile({
        stylePreferences: {
          preferredStyles: form.preferredStyles,
          favoriteColors: form.favoriteColors,
          dislikedColors: form.dislikedColors,
          preferredOccasions: form.preferredOccasions,
          budgetMin: form.budgetMin ? Number(form.budgetMin) : null,
          budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
        },
        physicalProfile: {
          height: form.height || null,
          weight: form.weight || null,
          consentGiven: form.consentGiven,
        },
        onboardingCompleted: true,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save profile.');
    }
  };

  const handleDeleteData = async () => {
    await deleteProfileData();
    setShowDeleteConfirm(false);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '40rem' }}>
      <PageHeader title="My Profile" subtitle="Manage your fashion preferences and personal information." />
      <ProfileForm
        authUser={authUser} form={form} setForm={setForm} toggleArrayItem={toggleArrayItem}
        handleSubmit={handleSubmit} formError={formError} success={success} saving={saving}
        setShowDeleteConfirm={setShowDeleteConfirm}
      />
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteData}
        title="Delete profile data?"
        message="This will permanently delete your style preferences and physical profile information. Your account and wardrobe items will not be affected."
        confirmLabel="Delete"
      />
    </div>
  );
}
