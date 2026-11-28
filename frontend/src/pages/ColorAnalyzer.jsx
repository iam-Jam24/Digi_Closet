import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, Pencil, Trash2, Save, X, Plus, Info, Hand } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import UploadDropzone from '../components/UploadDropzone';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import '../styles/critic-palette.css';

// Reference shades for each range. They illustrate the category only; they
// are not the user's measured skin colour.
const SKIN_TONES = [
  { key: 'fair', label: 'Fair', hex: '#F3DCCB' },
  { key: 'light', label: 'Light', hex: '#EAC7AC' },
  { key: 'light-medium', label: 'Light-medium', hex: '#DBAE8B' },
  { key: 'medium', label: 'Medium', hex: '#C48D67' },
  { key: 'tan', label: 'Tan', hex: '#A56E4B' },
  { key: 'deep', label: 'Deep', hex: '#7A4C33' },
  { key: 'dark', label: 'Dark', hex: '#4D3024' },
];

const UNDERTONES = {
  warm: { label: 'Warm', hint: 'Golden, peachy or yellow hints.' },
  cool: { label: 'Cool', hint: 'Pink, red or bluish hints.' },
  neutral: { label: 'Neutral', hint: 'A balance of warm and cool.' },
  olive: { label: 'Olive', hint: 'Muted green-grey or golden hints.' },
  uncertain: { label: 'Not clear', hint: 'The lighting made the undertone hard to judge.' },
};

const VEINS = {
  'blue-purple': { label: 'Blue / purple', colors: ['#4A5DA6', '#6A4B98'], hint: 'Often seen with cool undertones.' },
  green: { label: 'Green', colors: ['#4E7A58'], hint: 'Often seen with warm undertones.' },
  'blue-green': { label: 'Blue-green', colors: ['#3C6C8C', '#4E7A58'], hint: 'A mix, often seen with neutral undertones.' },
  inconclusive: { label: 'Inconclusive', colors: [], hint: 'Veins weren’t clear enough in the wrist photo.' },
  'not-provided': { label: 'Not analysed', colors: [], hint: 'Needs a photo of the inside of your wrist.' },
};

const EDITABLE_SECTIONS = [
  { key: 'recommendedColors', title: 'Your best colours', hint: 'Personalised to your skin tone and undertone, with why each one works.', large: true },
  { key: 'neutralColors', title: 'Your neutrals', hint: 'Bases for trousers, outerwear and shoes.' },
  { key: 'experimentColors', title: 'Worth trying', hint: 'Accents to experiment with.' },
  { key: 'avoidColors', title: 'Colours to use less', hint: 'Not forbidden: these can soften your natural contrast near the face. Wear them lower down or with one of your best colours if you love them.' },
];

const GUIDE_LABELS = {
  everyday: 'Everyday',
  formal: 'Formal',
  casual: 'Casual',
  festive: 'Festive',
  accessories: 'Accessories',
  neutrals: 'Neutrals',
  contrast: 'Contrast pairings',
};

const PIECE_LABELS = { tops: 'Tops', trousers: 'Trousers', jackets: 'Jackets', dresses: 'Dresses', shoes: 'Shoes', accessories: 'Accessories' };

const ANALYSIS_STEPS = ['Checking the light in your photo', 'Reading your skin tone', 'Estimating your undertone', 'Building your palette'];

// Dark text on light swatches, white text on dark ones.
function textColorFor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? '#252321' : '#FFFFFF';
}

const metalFinish = (hex) => `linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0) 45%, rgba(0,0,0,0.14)), ${hex}`;

function Swatch({ swatch, onRemove, large = false }) {
  return (
    <div className={`cp-swatch ${large ? 'cp-swatch--large' : ''}`}>
      <div className="cp-swatch__chip" style={{ background: swatch.hex, color: textColorFor(swatch.hex) }}>
        <span>{swatch.hex}</span>
        {onRemove && (
          <button type="button" className="cp-swatch__remove" onClick={onRemove} aria-label={`Remove ${swatch.name}`}>
            <X size={12} />
          </button>
        )}
      </div>
      <p className="cp-swatch__name">{swatch.name}</p>
      {swatch.note && <p className="cp-swatch__note">{swatch.note}</p>}
    </div>
  );
}

function AddSwatch({ onAdd }) {
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#B89B7A');

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), hex: hex.toUpperCase(), note: '' });
    setName('');
  };

  return (
    <div className="cp-add">
      <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} aria-label="Colour" />
      <input
        className="input"
        placeholder="Colour name"
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
      />
      <Button size="sm" variant="outline" onClick={submit} disabled={!name.trim()}><Plus size={14} /> Add</Button>
    </div>
  );
}

function SectionHeader({ title, hint }) {
  return (
    <div className="cp-section__header">
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
    </div>
  );
}

// The headline: skin tone, undertone and vein colour, each labelled with
// what it is based on.
function ResultHero({ palette, onAddWrist }) {
  const toneIndex = SKIN_TONES.findIndex((t) => t.key === palette.skinTone);
  const tone = SKIN_TONES[toneIndex];
  const undertone = UNDERTONES[palette.undertone] || UNDERTONES.uncertain;
  const vein = VEINS[palette.veinColor] || VEINS['not-provided'];

  return (
    <section className="cp-hero">
      <div className="cp-hero__tone">
        <span className="eyebrow">Your skin tone</span>
        {tone ? (
          <>
            <p className="cp-hero__value">{tone.label}</p>
            <div className="cp-hero__swatch" style={{ background: tone.hex }} aria-hidden="true" />
            <ol className="cp-scale" aria-label="Skin tone ranges">
              {SKIN_TONES.map((t, i) => (
                <li key={t.key} className={i === toneIndex ? 'is-active' : ''} title={t.label}>
                  <span style={{ background: t.hex }} />
                  <small>{t.label}</small>
                </li>
              ))}
            </ol>
            <p className="cp-hero__caption">Observed from your photo. The swatch is a reference shade for this range, not your exact skin colour.</p>
          </>
        ) : (
          <p className="cp-hero__value cp-hero__value--muted">Not estimated</p>
        )}
      </div>

      <div className="cp-hero__facts">
        <div className="cp-fact">
          <span className="eyebrow">Undertone · estimated</span>
          <p className="cp-fact__value">{undertone.label}</p>
          <p className="cp-fact__hint">{palette.undertoneNote || undertone.hint}</p>
        </div>

        <div className="cp-fact">
          <span className="eyebrow">Vein colour · {palette.veinColor === 'not-provided' ? 'unavailable' : 'from wrist photo'}</span>
          <div className="cp-fact__row">
            {vein.colors.length > 0 && (
              <span className="cp-vein" aria-hidden="true">
                {vein.colors.map((hex) => <span key={hex} style={{ background: hex }} />)}
              </span>
            )}
            <p className={`cp-fact__value ${vein.colors.length ? '' : 'cp-fact__value--muted'}`}>{vein.label}</p>
          </div>
          <p className="cp-fact__hint">{palette.veinNote || vein.hint}</p>
          {['not-provided', 'inconclusive'].includes(palette.veinColor) && onAddWrist && (
            <Button size="sm" variant="outline" onClick={onAddWrist}><Hand size={14} /> Add a wrist photo</Button>
          )}
        </div>

        {palette.confidence && (
          <p className={`cp-confidence cp-confidence--${palette.confidence}`}>
            {palette.confidence} confidence
          </p>
        )}
      </div>
    </section>
  );
}

function MetalList({ metals }) {
  return (
    <div className="cp-metals">
      {metals.map((metal) => (
        <div key={metal.name} className="cp-metal">
          <span className="cp-metal__chip" style={{ background: metalFinish(metal.hex) }} aria-hidden="true" />
          <div>
            <p className="cp-swatch__name">{metal.name}</p>
            {metal.note && <p className="cp-swatch__note">{metal.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function PaletteView({ palette, editing, onChange, onAddWrist }) {
  const updateSection = (key, list) => onChange({ ...palette, [key]: list });
  const hasMetals = palette.recommendedMetals?.length > 0 || palette.lessFlatteringMetals?.length > 0;

  return (
    <div className="cp-palette">
      {!editing && <ResultHero palette={palette} onAddWrist={onAddWrist} />}
      {palette.summary && <p className="cp-summary">{palette.summary}</p>}
      {palette.lightingNote && (
        <p className="cp-lighting"><Info size={14} /> {palette.lightingNote}</p>
      )}

      {EDITABLE_SECTIONS.map(({ key, title, hint, large }) => {
        const list = palette[key] || [];
        if (!editing && list.length === 0) return null;
        return (
          <section key={key} className="cp-section">
            <SectionHeader title={title} hint={hint} />
            <div className={`cp-swatches ${large ? 'cp-swatches--large' : ''}`}>
              {list.map((swatch, index) => (
                <Swatch
                  key={`${swatch.hex}-${index}`}
                  swatch={swatch}
                  large={large}
                  onRemove={editing ? () => updateSection(key, list.filter((_, i) => i !== index)) : undefined}
                />
              ))}
            </div>
            {editing && <AddSwatch onAdd={(swatch) => updateSection(key, [...list, swatch])} />}
          </section>
        );
      })}

      {!editing && hasMetals && (
        <section className="cp-section">
          <SectionHeader title="Best metals for you" hint="For jewellery, watches, buckles and hardware. Mixing metals works too." />
          <div className="cp-metal-groups">
            {palette.recommendedMetals?.length > 0 && (
              <div><h4 className="cp-subhead">Recommended</h4><MetalList metals={palette.recommendedMetals} /></div>
            )}
            {palette.lessFlatteringMetals?.length > 0 && (
              <div><h4 className="cp-subhead">Use less</h4><MetalList metals={palette.lessFlatteringMetals} /></div>
            )}
          </div>
        </section>
      )}

      {!editing && palette.combinations?.length > 0 && (
        <section className="cp-section">
          <SectionHeader title="Outfit colour combinations" hint="Pairings to build everyday looks around." />
          <div className="cp-combos">
            {palette.combinations.map((combo) => {
              const pieces = Object.entries(PIECE_LABELS).filter(([key]) => combo.pieces?.[key]);
              return (
                <div key={combo.name} className="cp-combo">
                  <div className="cp-combo__strip">
                    {combo.hexes.map((hex, i) => <span key={`${hex}-${i}`} style={{ background: hex }} />)}
                  </div>
                  <p className="cp-combo__name">{combo.name}</p>
                  <p className="cp-combo__usage">{combo.usage}</p>
                  {pieces.length > 0 && (
                    <dl className="cp-combo__pieces">
                      {pieces.map(([key, label]) => (
                        <div key={key}><dt>{label}</dt><dd>{combo.pieces[key]}</dd></div>
                      ))}
                    </dl>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!editing && palette.guide?.length > 0 && (
        <section className="cp-section">
          <SectionHeader title="Your personal colour guide" hint="What to reach for, occasion by occasion." />
          <div className="cp-guide">
            {palette.guide.map((entry) => (
              <div key={entry.category} className="cp-guide__row">
                <h4 className="cp-subhead">{GUIDE_LABELS[entry.category]}</h4>
                <div className="cp-guide__colors">
                  {entry.colors.map((c) => (
                    <span key={`${c.hex}-${c.name}`} className="cp-chip">
                      <span style={{ background: c.hex }} aria-hidden="true" />{c.name}
                    </span>
                  ))}
                </div>
                {entry.tip && <p className="cp-swatch__note">{entry.tip}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AnalysisLoader() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), 4000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="cp-loader" role="status" aria-live="polite">
      <div className="cp-loader__swatches" aria-hidden="true">
        {SKIN_TONES.map((t) => <span key={t.key} style={{ background: t.hex }} />)}
      </div>
      <p className="cp-loader__step">{ANALYSIS_STEPS[step]}…</p>
      <p className="cp-loader__hint">This can take up to 30 seconds.</p>
    </div>
  );
}

const previewOf = (file) => (file ? URL.createObjectURL(file) : '');

export default function ColorAnalyzer() {
  const { showToast } = useToast();
  const [saved, setSaved] = useState(null);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [draft, setDraft] = useState(null);
  const [draftSource, setDraftSource] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [wristFile, setWristFile] = useState(null);
  const [wristPreview, setWristPreview] = useState('');
  const [consent, setConsent] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    api.get('/colors/palette')
      .then(({ data }) => setSaved(data.data.palette))
      .catch((err) => setError(getErrorMessage(err, 'Could not load your saved palette.')))
      .finally(() => setLoadingSaved(false));
  }, []);

  const selectFace = (file) => { setImageFile(file); setImagePreview(previewOf(file)); setError(''); };
  const selectWrist = (file) => { setWristFile(file); setWristPreview(previewOf(file)); setError(''); };

  const analyze = async () => {
    const form = new FormData();
    form.append('image', imageFile);
    if (wristFile) form.append('wristImage', wristFile);
    form.append('consent', 'true');
    try {
      setAnalyzing(true);
      setError('');
      const { data } = await api.post('/colors/palette/analyze', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDraft(data.data.palette);
      setDraftSource('ai');
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err, 'The photo could not be analysed.'));
    } finally {
      setAnalyzing(false);
    }
  };

  const resetUpload = () => {
    selectFace(null);
    selectWrist(null);
  };

  const savePalette = async () => {
    try {
      setSaving(true);
      const { data } = await api.put('/colors/palette', { ...draft, source: draftSource });
      setSaved(data.data.palette);
      setDraft(null);
      setEditing(false);
      setShowUpload(false);
      resetUpload();
      showToast('Analysis saved to your profile.', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not save the analysis.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const removePalette = async () => {
    try {
      await api.delete('/colors/palette');
      setSaved(null);
      showToast('Analysis removed.', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not remove the analysis.'), 'error');
    } finally {
      setConfirmRemove(false);
    }
  };

  const startEditing = (palette) => {
    setDraft({ ...palette, ...Object.fromEntries(EDITABLE_SECTIONS.map(({ key }) => [key, palette[key] || []])) });
    setDraftSource('custom');
    setEditing(true);
  };

  // Back to the upload form, keeping the face photo if it is still selected.
  const addWrist = () => {
    setDraft(null);
    setEditing(false);
    setShowUpload(true);
  };

  if (loadingSaved) return <LoadingSpinner />;

  const disclaimer = (
    <p className="cp-disclaimer">
      An AI styling estimate, not a precise or medical colour analysis. Lighting, camera settings and filters change how skin looks in photos, so treat it as a starting point.
    </p>
  );

  // Reviewing a freshly generated analysis, or customising one.
  if (draft) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          eyebrow="AI Studio · Personal Colour"
          title="Your colour analysis."
          subtitle={editing ? 'Remove colours you don’t like and add your own.' : 'Review your results, then save them to your profile.'}
          action={
            <div className="cp-actions">
              <Button variant="ghost" onClick={() => { setDraft(null); setEditing(false); }}>Cancel</Button>
              {!editing && draftSource === 'ai' && imageFile && (
                <Button variant="outline" onClick={analyze} loading={analyzing}><RefreshCw size={15} /> Regenerate</Button>
              )}
              {!editing && <Button variant="outline" onClick={() => setEditing(true)}><Pencil size={15} /> Customise</Button>}
              <Button onClick={savePalette} loading={saving}><Save size={15} /> Save analysis</Button>
            </div>
          }
        />
        {error && <div className="alert alert--error section">{error}</div>}
        {analyzing ? <Card><AnalysisLoader /></Card> : (
          <Card>
            <PaletteView
              palette={draft}
              editing={editing}
              onChange={(next) => { setDraft(next); setDraftSource('custom'); }}
              onAddWrist={addWrist}
            />
            {disclaimer}
          </Card>
        )}
      </div>
    );
  }

  const showForm = !saved || showUpload;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="AI Studio"
        title="Find the colours that feel like you."
        subtitle="Upload a selfie for your skin tone, undertone and a personal palette. Add a wrist photo to include vein colour."
        image="/images/editorial/knit-rail.jpg"
        action={saved && !showUpload && (
          <div className="cp-actions">
            <Button variant="ghost" onClick={() => setConfirmRemove(true)}><Trash2 size={15} /> Remove</Button>
            <Button variant="outline" onClick={() => startEditing(saved)}><Pencil size={15} /> Edit colours</Button>
            <Button onClick={() => setShowUpload(true)}><RefreshCw size={15} /> Redo analysis</Button>
          </div>
        )}
      />

      {showForm ? (
        <Card className="cp-upload">
          {analyzing ? <AnalysisLoader /> : (
            <>
              <div className="cp-upload__photos">
                <div className="cp-upload__slot">
                  <h3 className="cp-subhead">Your face <span>Required</span></h3>
                  <UploadDropzone
                    onFileSelect={selectFace}
                    preview={imagePreview}
                    onRemove={() => selectFace(null)}
                    label="Upload a front-facing selfie"
                    hint="Natural daylight, no make-up filters or sunglasses. JPG, PNG or WebP up to 5MB."
                  />
                </div>
                <div className="cp-upload__slot">
                  <h3 className="cp-subhead">Inside of your wrist <span>Optional</span></h3>
                  <UploadDropzone
                    onFileSelect={selectWrist}
                    preview={wristPreview}
                    onRemove={() => selectWrist(null)}
                    label="Add a wrist photo for vein colour"
                    hint="Palm up, in daylight, veins in focus. Without it, vein colour is left out."
                  />
                </div>
              </div>
              <ul className="cp-tips">
                <li>Face the camera in natural daylight, near a window.</li>
                <li>Avoid coloured or warm indoor lighting, strong shadows and beauty filters.</li>
              </ul>
              <label className="cp-consent">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>I agree to send these photos to Google Gemini for analysis. DigiCloset does not store the photos, only the results.</span>
              </label>
              {disclaimer}
              {error && (
                <div className="alert alert--error fc-error">
                  <span>{error}</span>
                  <Button size="sm" variant="outline" onClick={analyze} disabled={!imageFile || !consent}>Try again</Button>
                </div>
              )}
              <div className="cp-actions">
                {saved && <Button variant="ghost" onClick={() => { setShowUpload(false); resetUpload(); }}>Cancel</Button>}
                <Button size="lg" onClick={analyze} disabled={!imageFile || !consent}>
                  <Sparkles size={16} /> Analyse my colours
                </Button>
              </div>
            </>
          )}
        </Card>
      ) : (
        <Card>
          <PaletteView palette={saved} editing={false} onAddWrist={() => setShowUpload(true)} />
          {disclaimer}
        </Card>
      )}

      <ConfirmDialog
        isOpen={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={removePalette}
        title="Remove analysis?"
        message="Your saved colour analysis will be deleted. Outfit suggestions will stop using it."
        confirmLabel="Remove"
      />
    </div>
  );
}
