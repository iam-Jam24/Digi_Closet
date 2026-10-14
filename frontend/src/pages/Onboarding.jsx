import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Palette,
  Shirt, Calendar, Ruler, Wallet, CheckCircle2
} from 'lucide-react';
import useProfile from '../hooks/useProfile';
import Card from '../components/Card';
import Button from '../components/Button';

const STYLE_OPTIONS = [
  'Minimalist', 'Casual', 'Classic', 'Formal', 'Old Money',
  'Gen Z Streetwear', 'Gothic', 'Bright / Maximalist', 'Sporty',
  'Bohemian', 'Vintage / Retro', 'Smart Casual'
];

const OCCASION_OPTIONS = [
  'Casual / Everyday', 'Office / Work', 'College / Campus', 'Interview',
  'Date Night', 'Weddings', 'Cocktail / Party', 'Travel & Vacation', 'Activewear / Gym'
];

const COLOR_OPTIONS = [
  { name: 'Black', hex: '#111111' },
  { name: 'White', hex: '#f8fafc' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Beige / Cream', hex: '#d4b996' },
  { name: 'Olive Green', hex: '#4d5d3e' },
  { name: 'Burgundy', hex: '#701a31' },
  { name: 'Charcoal Grey', hex: '#374151' },
  { name: 'Emerald Green', hex: '#065f46' },
  { name: 'Pastel Blue', hex: '#93c5fd' },
  { name: 'Dusty Pink', hex: '#f472b6' },
  { name: 'Terracotta / Brown', hex: '#9a3412' },
  { name: 'Lavender', hex: '#c084fc' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const FIT_OPTIONS = ['Slim Fit', 'Regular Fit', 'Relaxed / Oversized'];

const BODY_TYPES = [
  { label: 'Slim / Lean', desc: 'Slender frame with narrow shoulders & waist' },
  { label: 'Athletic / Muscular', desc: 'Broader shoulders with tapered waist' },
  { label: 'Average / Medium', desc: 'Balanced proportions throughout' },
  { label: 'Curvy / Hourglass', desc: 'Defined waist with fuller bust/hips' },
  { label: 'Plus / Full-figured', desc: 'Fuller silhouette with comfortable drape' },
];

const BUDGET_RANGES = [
  { label: 'Budget-Friendly', desc: 'High value essentials (Under ₹2,000 / item)', min: 0, max: 2000 },
  { label: 'Balanced / Mid-Range', desc: 'Quality everyday staples (₹2,000 – ₹6,000 / item)', min: 2000, max: 6000 },
  { label: 'Premium & Designer', desc: 'Invested wardrobe pieces (₹6,000+ / item)', min: 6000, max: 25000 },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateProfile } = useProfile();

  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [styles, setStyles] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [favoriteColors, setFavoriteColors] = useState([]);
  const [dislikedColors, setDislikedColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [fit, setFit] = useState('Regular Fit');
  const [bodyType, setBodyType] = useState('Average / Medium');
  const [budgetRange, setBudgetRange] = useState(BUDGET_RANGES[1]);
  const [saving, setSaving] = useState(false);

  const toggleArrayItem = (list, setList, item) => {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const handleFinish = async () => {
    try {
      setSaving(true);
      await updateProfile({
        stylePreferences: {
          preferredStyles: styles,
          preferredOccasions: occasions,
          favoriteColors,
          dislikedColors,
          preferredSizes: sizes,
          budgetMin: budgetRange?.min,
          budgetMax: budgetRange?.max,
        },
        physicalProfile: {
          faceShape: bodyType,
          fitPreferences: fit,
          clothingSizes: sizes.join(', '),
          consentGiven: true,
        },
        privacySettings: {
          allowAIPersonalization: true,
          allowPhysicalDataUse: true,
        },
        onboardingCompleted: true,
      });
    } catch (err) {
      console.error('Failed to save onboarding data:', err);
    } finally {
      navigate('/dashboard');
    }
  };

  const handleSkip = () => navigate('/dashboard');

  return (
    <div className="centered-page" style={{ padding: 'var(--space-6) var(--space-4)' }}>
      <div style={{ width: '100%', maxWidth: '42rem' }}>
        {/* Header */}
        <div className="auth-card__header" style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div className="auth-card__logo" style={{ margin: '0 auto var(--space-3)' }}>
            <Sparkles size={24} />
          </div>
          <h1 className="auth-card__title">Curate Your Style Profile</h1>
          <p className="auth-card__subtitle">
            Tailor Digi Closet&apos;s AI to your silhouette, favorite palettes, and budget.
          </p>
        </div>

        {/* Wizard Progress Bar */}
        <div className="wizard-progress">
          <div className="wizard-progress__bar">
            <div
              className="wizard-progress__fill"
              style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`wizard-step-node ${
                step === s ? 'wizard-step-node--active' : step > s ? 'wizard-step-node--completed' : ''
              }`}
            >
              {step > s ? <Check size={14} /> : s}
            </div>
          ))}
        </div>

        {/* Step 1: Style Aesthetics */}
        {step === 1 && (
          <Card className="section">
            <h2 className="section__title">
              <Shirt size={18} style={{ verticalAlign: 'middle', marginRight: 'var(--space-2)' }} />
              What aesthetics resonate with you?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-4)' }}>
              Pick as many as you like. We use this to curate daily outfit suggestions.
            </p>
            <div className="tag-toggle-group">
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleArrayItem(styles, setStyles, s)}
                  className={`filter-chip ${styles.includes(s) ? 'filter-chip--active' : ''}`}
                >
                  {styles.includes(s) && <Check size={12} style={{ display: 'inline', marginRight: 4 }} />}
                  {s}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Step 2: Occasions */}
        {step === 2 && (
          <Card className="section">
            <h2 className="section__title">
              <Calendar size={18} style={{ verticalAlign: 'middle', marginRight: 'var(--space-2)' }} />
              What occasions do you dress for most?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-4)' }}>
              Select where you spend most of your time so we prioritize appropriate looks.
            </p>
            <div className="tag-toggle-group">
              {OCCASION_OPTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggleArrayItem(occasions, setOccasions, o)}
                  className={`filter-chip ${occasions.includes(o) ? 'filter-chip--active' : ''}`}
                >
                  {occasions.includes(o) && <Check size={12} style={{ display: 'inline', marginRight: 4 }} />}
                  {o}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Step 3: Color Palette */}
        {step === 3 && (
          <Card className="section">
            <h2 className="section__title">
              <Palette size={18} style={{ verticalAlign: 'middle', marginRight: 'var(--space-2)' }} />
              Favorite Color Palettes
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)' }}>
              Select colors you love wearing:
            </p>
            <div className="analytics-color-chips" style={{ marginBottom: 'var(--space-5)' }}>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => toggleArrayItem(favoriteColors, setFavoriteColors, c.name)}
                  className={`analytics-color-chip ${favoriteColors.includes(c.name) ? 'selectable-card--selected' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="analytics-color-dot" style={{ background: c.hex }} />
                  {c.name}
                  {favoriteColors.includes(c.name) && <Check size={12} />}
                </button>
              ))}
            </div>

            <h3 className="analytics-subtitle" style={{ marginTop: 'var(--space-4)' }}>
              Any colors you prefer to avoid?
            </h3>
            <div className="analytics-color-chips">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={`dislike-${c.name}`}
                  type="button"
                  onClick={() => toggleArrayItem(dislikedColors, setDislikedColors, c.name)}
                  className={`analytics-color-chip ${dislikedColors.includes(c.name) ? 'selectable-card--selected' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="analytics-color-dot" style={{ background: c.hex }} />
                  {c.name}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Step 4: Fit, Silhouette & Sizes */}
        {step === 4 && (
          <Card className="section">
            <h2 className="section__title">
              <Ruler size={18} style={{ verticalAlign: 'middle', marginRight: 'var(--space-2)' }} />
              Fit & Proportions
            </h2>

            <div style={{ marginBottom: 'var(--space-5)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' }}>
                Your body frame:
              </p>
              <div className="selectable-cards">
                {BODY_TYPES.map((bt) => (
                  <div
                    key={bt.label}
                    onClick={() => setBodyType(bt.label)}
                    className={`selectable-card ${bodyType === bt.label ? 'selectable-card--selected' : ''}`}
                  >
                    <div>{bt.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{bt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-5)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' }}>
                Preferred fit:
              </p>
              <div className="selectable-cards">
                {FIT_OPTIONS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFit(f)}
                    className={`selectable-card ${fit === f ? 'selectable-card--selected' : ''}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' }}>
                Typical clothing sizes you wear:
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleArrayItem(sizes, setSizes, sz)}
                    className={`filter-chip ${sizes.includes(sz) ? 'filter-chip--active' : ''}`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Step 5: Budget Range */}
        {step === 5 && (
          <Card className="section">
            <h2 className="section__title">
              <Wallet size={18} style={{ verticalAlign: 'middle', marginRight: 'var(--space-2)' }} />
              Preferred Shopping Budget
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-4)' }}>
              Helps our Smart Clothes Finder and Budget Assistant suggest items tailored to your wallet.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {BUDGET_RANGES.map((b) => (
                <div
                  key={b.label}
                  onClick={() => setBudgetRange(b)}
                  className={`selectable-card ${budgetRange?.label === b.label ? 'selectable-card--selected' : ''}`}
                  style={{ textAlign: 'left', padding: 'var(--space-4)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{b.label}</strong>
                    {budgetRange?.label === b.label && <CheckCircle2 size={18} color="var(--accent-violet)" />}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {b.desc}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Navigation Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-6)' }}>
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft size={16} /> Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {step < totalSteps ? (
              <Button onClick={() => setStep((s) => s + 1)}>
                Next <ArrowRight size={16} />
              </Button>
            ) : (
              <Button onClick={handleFinish} loading={saving}>
                Finish & Go to Dashboard <Check size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
