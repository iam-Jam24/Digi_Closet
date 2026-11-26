import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, RotateCcw, ImageIcon, Shirt, Check, ChevronLeft, ChevronRight, Wand2,
  SunMedium, Palette, Ruler, Footprints, Watch, Scissors, PersonStanding, Camera,
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import useWardrobe from '../hooks/useWardrobe';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Select from '../components/Select';
import Button from '../components/Button';
import Modal from '../components/Modal';
import UploadDropzone from '../components/UploadDropzone';
import WardrobePicker from '../components/WardrobePicker';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import OutfitCard from '../components/OutfitCard';
import { OCCASIONS, sortBySlot } from '../constants/wardrobe';
import '../styles/critic-palette.css';

const WHOLE_PHOTO = { x: 0, y: 0, width: 1, height: 1 };
// Regions covering most of the photo are about the whole look: they get a
// card thumbnail but no marker, which would just sit in the middle.
const isLocal = (region) => region && region.width * region.height < 0.45;

const RATINGS = [['fit', 'Fit'], ['colour', 'Colour'], ['coordination', 'Coordination']];
const CHECKS = {
  'skin-tone': { label: 'Skin tone match', icon: SunMedium },
  colour: { label: 'Colour combination', icon: Palette },
  fit: { label: 'Fit', icon: Ruler },
  footwear: { label: 'Footwear', icon: Footprints },
  accessories: { label: 'Accessories', icon: Watch },
  grooming: { label: 'Hair & grooming', icon: Scissors },
  pose: { label: 'Pose & presence', icon: PersonStanding },
  setting: { label: 'Setting & light', icon: Camera },
};
const VERDICTS = { great: 'Great', good: 'Good', fix: 'Needs work' };

function TryInstead({ options }) {
  if (!options?.length) return null;
  return (
    <span className="fc-try">
      <span className="fc-try__label">Try instead</span>
      {options.map((option) => <span key={option} className="fc-try__chip">{option}</span>)}
    </span>
  );
}
const ANALYSIS_STEPS = ['Reading the silhouette', 'Checking the fit', 'Weighing the colours', 'Marking the details'];

/**
 * Widens a region (normalised 0-1) with some context around it to exactly the
 * frame's aspect ratio (width / height in pixels), staying inside the photo,
 * so its crop looks like a detail shot and is never stretched.
 */
function framedRegion(region, size, aspect) {
  if (!region || !size) return null;
  const pad = 0.12;
  let w = region.width * (1 + pad * 2);
  let h = region.height * (1 + pad * 2);
  const cx = region.x + region.width / 2;
  const cy = region.y + region.height / 2;
  const ratio = size.width / size.height;
  // Grow the short side to the frame's shape, then fit it inside the photo.
  if ((w * ratio) / h < aspect) w = (h * aspect) / ratio;
  else h = (w * ratio) / aspect;
  if (w > 1) { w = 1; h = ratio / aspect; }
  if (h > 1) { h = 1; w = aspect / ratio; }
  const x = Math.min(Math.max(cx - w / 2, 0), 1 - w);
  const y = Math.min(Math.max(cy - h / 2, 0), 1 - h);
  return { x, y, width: w, height: h };
}

// A real crop of the uploaded photo, drawn with CSS so no copy is made.
// aspect is the frame's width / height.
function Crop({ src, region, size, aspect = 1, className = '' }) {
  const frame = framedRegion(region || WHOLE_PHOTO, size, aspect);
  // Until the photo's size is known, hold the space.
  if (!frame) return <div className={`fc-crop ${className}`} style={{ aspectRatio: aspect }} aria-hidden="true" />;
  const position = (offset, extent) => (extent >= 1 ? 0 : (offset / (1 - extent)) * 100);
  return (
    <div
      className={`fc-crop ${className}`}
      role="img"
      aria-label="Detail from your photo"
      style={{
        aspectRatio: aspect,
        backgroundImage: `url(${src})`,
        backgroundSize: `${100 / frame.width}% ${100 / frame.height}%`,
        backgroundPosition: `${position(frame.x, frame.width)}% ${position(frame.y, frame.height)}%`,
      }}
    />
  );
}

/**
 * Marker positions at the centre of each region, nudged apart so markers for
 * overlapping areas (e.g. a jacket and its colour) never cover each other.
 * gap is the minimum distance as a fraction of the photo.
 */
function markerPositions(observations, size, gap = 0.07) {
  const ratio = size ? size.height / size.width : 1;
  const placed = [];
  return new Map(observations.map((o) => {
    let x = o.region.x + o.region.width / 2;
    let y = o.region.y + o.region.height / 2;
    for (let tries = 0; tries < 12 && placed.some((p) => Math.hypot(p.x - x, (p.y - y) * ratio) < gap); tries += 1) {
      y = Math.min(0.96, y + gap / ratio);
      if (y >= 0.96) { y = o.region.y + o.region.height / 2; x = Math.min(0.96, x + gap); }
    }
    placed.push({ x, y });
    return [o.id, { x, y }];
  }));
}

function Marker({ observation, position, active, onSelect }) {
  const { region, status, id, title } = observation;
  return (
    <>
      {active && (
        <span
          className={`fc-region fc-region--${status}`}
          style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.width * 100}%`, height: `${region.height * 100}%` }}
          aria-hidden="true"
        />
      )}
      <button
        type="button"
        className={`fc-marker fc-marker--${status} ${active ? 'is-active' : ''}`}
        style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%` }}
        onClick={() => onSelect(id)}
        aria-label={`${status === 'good' ? 'Looks good' : 'Needs improvement'}: ${title}`}
      >
        {status === 'good' ? <Check size={13} strokeWidth={3} /> : id}
      </button>
    </>
  );
}

function ObservationCard({ observation, photo, size, onSelect }) {
  const { status, title, detail, fix, region, id } = observation;
  return (
    <button type="button" className={`fc-obs fc-obs--${status}`} onClick={() => onSelect(id)}>
      {photo && <Crop src={photo} region={region} size={size} className="fc-obs__crop" />}
      <span className="fc-obs__body">
        <span className="fc-obs__title">
          <span className={`fc-dot fc-dot--${status}`} aria-hidden="true">{status === 'good' ? <Check size={10} strokeWidth={3} /> : id}</span>
          {title}
        </span>
        <span className="fc-obs__text">{detail}</span>
        {status === 'improve' && fix && <span className="fc-obs__fix">{fix}</span>}
        {status === 'improve' && <TryInstead options={observation.options} />}
      </span>
    </button>
  );
}

function AnalysisLoader({ photo }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), 4000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="fc-loader" role="status" aria-live="polite">
      {photo && (
        <div className="fc-loader__photo">
          <img src={photo} alt="" />
          <span className="fc-loader__scan" aria-hidden="true" />
        </div>
      )}
      <p className="fc-loader__step">{ANALYSIS_STEPS[step]}…</p>
      <p className="fc-wait">This can take up to 30 seconds.</p>
    </div>
  );
}

// Current crop beside an AI preview of the fix, generated on request.
function FixComparison({ observation, photo, size, imageFile, canPreview }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    const form = new FormData();
    form.append('image', imageFile);
    form.append('data', JSON.stringify({ area: observation.area, fix: observation.fix }));
    try {
      setLoading(true);
      setError('');
      const { data } = await api.post('/fashion/visualize', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPreview(data.data.image);
    } catch (err) {
      setError(getErrorMessage(err, 'The preview could not be generated.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fc-compare">
      <p className="fc-compare__title"><span className="fc-dot fc-dot--improve">{observation.id}</span>{observation.title}</p>
      <div className="fc-compare__pair">
        <figure>
          {observation.region ? <Crop src={photo} region={observation.region} size={size} aspect={3 / 4} /> : <img src={photo} alt="Your outfit" className="fc-compare__full" />}
          <figcaption>Current</figcaption>
        </figure>
        <figure>
          {preview ? (
            observation.region
              ? <Crop src={preview} region={observation.region} size={size} aspect={3 / 4} />
              : <img src={preview} alt="AI preview of the suggested change" className="fc-compare__full" />
          ) : (
            <div className="fc-compare__pending">
              <p>{observation.fix}</p>
              <TryInstead options={observation.options} />
              {canPreview && imageFile && (
                <Button size="sm" variant="outline" onClick={generate} loading={loading}><Wand2 size={14} /> Preview</Button>
              )}
            </div>
          )}
          <figcaption>{preview ? 'Suggested · AI preview' : 'Suggested'}</figcaption>
        </figure>
      </div>
      {loading && <p className="fc-wait">Generating a preview. This can take a minute.</p>}
      {error && <p className="fc-compare__error">{error}</p>}
    </div>
  );
}

export default function FashionCritic() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { items: wardrobe, loading: wardrobeLoading } = useWardrobe();

  const [mode, setMode] = useState('photo');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [photoSize, setPhotoSize] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [occasion, setOccasion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [zoomId, setZoomId] = useState(null);
  const [canPreview, setCanPreview] = useState(false);
  const [savedTitles, setSavedTitles] = useState([]);
  const [savingTitle, setSavingTitle] = useState(null);

  useEffect(() => {
    api.get('/fashion/capabilities')
      .then(({ data }) => setCanPreview(Boolean(data.data.visualize?.available)))
      .catch(() => setCanPreview(false));
  }, []);

  // Natural size of the photo, needed to frame crops without distortion.
  useEffect(() => {
    if (!imagePreview) { setPhotoSize(null); return; }
    const img = new Image();
    img.onload = () => setPhotoSize({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = imagePreview;
  }, [imagePreview]);

  const itemsById = new Map(wardrobe.map((i) => [i._id, i]));
  const resolve = (ids = []) => ids.map((id) => itemsById.get(id)).filter(Boolean);
  const canSubmit = mode === 'photo' ? Boolean(imageFile) : selectedIds.length >= 2;

  const toggleItem = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleFile = (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const handleAnalyze = async () => {
    const form = new FormData();
    if (mode === 'photo') form.append('image', imageFile);
    else form.append('itemIds', JSON.stringify(selectedIds));
    if (occasion) form.append('occasion', occasion);

    try {
      setLoading(true);
      setError('');
      const { data } = await api.post('/fashion/analyze', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.data);
      setActiveId(null);
      setSavedTitles([]);
    } catch (err) {
      setError(getErrorMessage(err, 'The outfit could not be analysed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError('');
    setImageFile(null);
    setImagePreview('');
    setSelectedIds([]);
    setActiveId(null);
    setZoomId(null);
  };

  const handleSaveAlternative = async (alt) => {
    try {
      setSavingTitle(alt.title);
      await api.post('/outfits/saved', {
        title: alt.title,
        itemIds: alt.itemIds,
        explanation: alt.explanation,
        source: 'fashion-critic',
      });
      setSavedTitles((prev) => [...prev, alt.title]);
      showToast('Outfit saved.', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not save the outfit.'), 'error');
    } finally {
      setSavingTitle(null);
    }
  };

  if (result) {
    const photo = mode === 'photo' ? imagePreview : '';
    const reviewedItems = mode === 'wardrobe' ? sortBySlot(resolve(selectedIds)) : [];
    const observations = result.observations || [];
    const good = observations.filter((o) => o.status === 'good');
    const improve = observations.filter((o) => o.status === 'improve');
    const mapped = photo ? observations.filter((o) => isLocal(o.region)) : [];
    const fixes = improve.filter((o) => o.fix);
    const positions = markerPositions(mapped, photoSize);
    // Clicking a marker or card highlights it on the photo and opens the zoom.
    const select = (id) => { setActiveId(id); if (photo) setZoomId(id); };
    const zoomList = photo ? observations : [];
    const zoomIndex = zoomList.findIndex((o) => o.id === zoomId);
    const zoomed = zoomList[zoomIndex];
    const step = (delta) => {
      const next = zoomList[(zoomIndex + delta + zoomList.length) % zoomList.length];
      setZoomId(next.id);
      setActiveId(next.id);
    };

    return (
      <div className="animate-fade-in">
        <PageHeader
          eyebrow="AI Studio · Fashion Critic"
          title="The verdict."
          action={<Button variant="outline" onClick={handleReset}><RotateCcw size={15} /> Review another outfit</Button>}
        />

        {/* Score strip */}
        <section className="fc-scoreline">
          <div className="fc-scoreline__score">
            <p className="fc-scoreline__value">{result.score.toFixed(1)}<span>/10</span></p>
            {result.category && <span className="fc-chip">{result.category}</span>}
          </div>
          <p className="fc-scoreline__summary">{result.summary}</p>
          <div className="fc-meters">
            {RATINGS.map(([key, label]) => result.ratings?.[key] != null && (
              <div key={key} className="fc-meter">
                <span className="fc-meter__label">{label}<b>{result.ratings[key].toFixed(1)}</b></span>
                <span className="fc-meter__track"><span style={{ width: `${result.ratings[key] * 10}%` }} /></span>
              </div>
            ))}
          </div>
        </section>

        <div className="fc-studio">
          {/* Photo with markers, or the reviewed wardrobe pieces */}
          <div className="fc-stage">
            {photo ? (
              <div className="fc-stage__photo">
                <img src={photo} alt="Your outfit" />
                {mapped.map((o) => <Marker key={o.id} observation={o} position={positions.get(o.id)} active={activeId === o.id} onSelect={select} />)}
              </div>
            ) : (
              <div className="fc-summary__thumbs">
                {reviewedItems.map((item) => (
                  <div key={item._id} className="fc-summary__thumb" title={item.name}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <ImageIcon size={18} />}
                  </div>
                ))}
              </div>
            )}
            {mapped.length > 0 && <p className="fc-stage__hint">Tap a marker to zoom into that detail.</p>}
          </div>

          <div className="fc-columns">
            {[['good', 'What looks good', good], ['improve', 'Needs improvement', improve]].map(([status, heading, list]) => list.length > 0 && (
              <section key={status} className="fc-column">
                <h2 className={`fc-column__title fc-column__title--${status}`}>{heading}</h2>
                <div className="fc-obs-list">
                  {list.map((o) => <ObservationCard key={o.id} observation={o} photo={photo} size={photoSize} onSelect={select} />)}
                </div>
              </section>
            ))}
          </div>
        </div>

        {result.checks?.length > 0 && (
          <section className="section">
            <h2 className="fc-heading">Head-to-toe check</h2>
            <div className="fc-checks">
              {result.checks.map(({ aspect, verdict, note }) => {
                const { label, icon: Icon } = CHECKS[aspect] || { label: aspect, icon: Check };
                return (
                  <div key={aspect} className={`fc-check fc-check--${verdict}`}>
                    <span className="fc-check__icon"><Icon size={18} strokeWidth={1.5} /></span>
                    <span className="fc-check__label">{label}</span>
                    <span className="fc-check__verdict">{VERDICTS[verdict]}</span>
                    <p className="fc-check__note">{note}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {fixes.length > 0 && photo && (
          <section className="section">
            <h2 className="fc-heading">Current vs suggested</h2>
            <div className="fc-compares">
              {fixes.map((o) => (
                <FixComparison key={o.id} observation={o} photo={photo} size={photoSize} imageFile={imageFile} canPreview={canPreview} />
              ))}
            </div>
            {canPreview && <p className="fc-note">Previews are AI-generated illustrations of a suggestion, not photos of you.</p>}
          </section>
        )}

        {result.finalTip && (
          <section className="fc-tip">
            <span className="eyebrow">Stylist&apos;s note</span>
            <p>{result.finalTip}</p>
          </section>
        )}

        {result.alternatives?.length > 0 && (
          <section className="section">
            <h2 className="fc-heading">Try these from your wardrobe</h2>
            <div className="fc-alternatives">
              {result.alternatives.map((alt) => (
                <OutfitCard
                  key={alt.title}
                  outfit={alt}
                  items={resolve(alt.itemIds)}
                  saved={savedTitles.includes(alt.title)}
                  saving={savingTitle === alt.title}
                  onSave={handleSaveAlternative}
                />
              ))}
            </div>
          </section>
        )}

        <Modal isOpen={Boolean(zoomed)} onClose={() => setZoomId(null)} title={zoomed?.area || 'Detail'} size="md">
          {zoomed && (
            <div className="fc-zoom">
              {zoomed.region
                ? <Crop src={photo} region={zoomed.region} size={photoSize} aspect={4 / 5} className="fc-zoom__crop" />
                : <img src={photo} alt="Your outfit" className="fc-zoom__full" />}
              <p className="fc-zoom__title">
                <span className={`fc-dot fc-dot--${zoomed.status}`}>{zoomed.status === 'good' ? <Check size={10} strokeWidth={3} /> : zoomed.id}</span>
                {zoomed.title}
              </p>
              <p className="fc-zoom__text">{zoomed.detail}</p>
              {zoomed.fix && <p className="fc-zoom__fix"><b>Fix:</b> {zoomed.fix}</p>}
              <TryInstead options={zoomed.options} />
              {zoomList.length > 1 && (
                <div className="fc-zoom__nav">
                  <Button size="sm" variant="ghost" onClick={() => step(-1)}><ChevronLeft size={16} /> Previous</Button>
                  <span>{zoomIndex + 1} / {zoomList.length}</span>
                  <Button size="sm" variant="ghost" onClick={() => step(1)}>Next <ChevronRight size={16} /></Button>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="AI Studio"
        title="An honest second opinion."
        subtitle="Upload an outfit and see, at a glance, what works and what to fix."
        image="/images/editorial/dark-jacket-watch.jpg"
      />

      <Card className="fc-form">
        {loading ? <AnalysisLoader photo={mode === 'photo' ? imagePreview : ''} /> : (
          <>
            <div className="fc-toggle" role="tablist">
              {[['photo', 'Upload photo'], ['wardrobe', 'Pick from wardrobe']].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  className={`fc-toggle__option ${mode === value ? 'fc-toggle__option--active' : ''}`}
                  onClick={() => { setMode(value); setError(''); }}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === 'photo' ? (
              <UploadDropzone
                onFileSelect={handleFile}
                preview={imagePreview}
                onRemove={() => { setImageFile(null); setImagePreview(''); }}
                label="Upload a photo of your outfit"
                hint="Full-length or mirror photos work best. JPEG, PNG or WebP up to 5MB."
              />
            ) : wardrobeLoading ? (
              <LoadingSpinner size="sm" />
            ) : wardrobe.length < 2 ? (
              <EmptyState
                icon={Shirt}
                title="Not enough items yet"
                description="Add at least two pieces to your wardrobe to review a combination."
                actionLabel="Build your wardrobe"
                onAction={() => navigate('/wardrobe')}
              />
            ) : (
              <>
                <p className="fc-picker__hint">
                  {selectedIds.length ? `${selectedIds.length} selected` : 'Select the pieces you want to wear together'}
                </p>
                <WardrobePicker items={wardrobe} selected={selectedIds} onToggle={toggleItem} />
              </>
            )}

            <Select
              label="Occasion (optional)"
              options={OCCASIONS}
              placeholder="Any occasion"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
            />

            {error && (
              <div className="alert alert--error fc-error">
                <span>{error}</span>
                <Button size="sm" variant="outline" onClick={handleAnalyze} disabled={!canSubmit}>Try again</Button>
              </div>
            )}

            <Button onClick={handleAnalyze} disabled={!canSubmit} fullWidth>
              <Sparkles size={16} /> Review outfit
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
