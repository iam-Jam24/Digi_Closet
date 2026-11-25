import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Shirt, X, AlertCircle } from 'lucide-react';
import useWardrobe from '../hooks/useWardrobe';
import useLooks from '../hooks/useLooks';
import { getErrorMessage } from '../services/api';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import UploadDropzone from '../components/UploadDropzone';
import WardrobePicker from '../components/WardrobePicker';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import LookResult from '../components/LookResult';
import LookGallery from '../components/LookGallery';
import { sortBySlot } from '../constants/wardrobe';
import '../styles/looks.css';

const MAX_ITEMS = 5;

export default function TryOn() {
  const navigate = useNavigate();
  const { items: wardrobe, loading: wardrobeLoading } = useWardrobe();
  const {
    savedLooks, loading, error: listError, fetchLooks, capabilities, fetchCapabilities, generateTryOn, updateLook, deleteLook,
  } = useLooks('try-on');

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  // Once a look exists for the current photo, later generations reuse the
  // stored copy instead of uploading the photo again.
  const [photoLookId, setPhotoLookId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [category, setCategory] = useState('');
  const [look, setLook] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  // True while capabilities are re-checked after an "unavailable" response.
  const [rechecking, setRechecking] = useState(false);
  const unavailable = capabilities?.tryOn?.available === false;

  // Only items with a photo can be tried on.
  const withPhotos = sortBySlot(wardrobe.filter((item) => item.imageUrl));
  const categories = [...new Set(withPhotos.map((item) => item.category))];
  const shown = category ? withPhotos.filter((item) => item.category === category) : withPhotos;
  const selectedItems = selectedIds.map((id) => withPhotos.find((item) => item._id === id)).filter(Boolean);

  const handlePhoto = (file) => {
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : '');
    setPhotoLookId(null);
    setError('');
  };

  const toggleItem = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
      setError('');
    } else if (selectedIds.length >= MAX_ITEMS) {
      setError(`You can try on up to ${MAX_ITEMS} items at once.`);
    } else {
      setSelectedIds([...selectedIds, id]);
      setError('');
    }
  };

  const generate = async (itemIds, sourceLookId = photoLookId) => {
    try {
      setGenerating(true);
      setError('');
      const result = await generateTryOn(sourceLookId ? { itemIds, sourceLookId } : { photoFile, itemIds });
      setLook(result);
      // Only track it if it was made from the photo currently in the upload box.
      if (!sourceLookId || sourceLookId === photoLookId) setPhotoLookId(result._id);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not generate your look. Please try again.'));
      // 503: no provider can serve this right now, so re-check instead of
      // letting the same call fail again. 429 stays "wait and retry".
      if (err.response?.status === 503) {
        setRechecking(true);
        await fetchCapabilities();
        setRechecking(false);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdate = async (id, changes) => {
    const updated = await updateLook(id, changes);
    if (look?._id === id) setLook(updated);
  };

  const handleDelete = async (id) => {
    await deleteLook(id);
    if (look?._id === id) setLook(null);
    if (photoLookId === id) setPhotoLookId(null);
  };

  if (wardrobeLoading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="AI Studio · Virtual Try-On"
        title="See yourself in something new."
        subtitle="Step into something new: choose pieces from your wardrobe and see them on you."
        image="/images/editorial/leather-jacket-model.jpg"
        variant="overlay"
      />

      {unavailable && (
        <div className="alert alert--info looks-banner" role="status">
          <AlertCircle size={18} />
          <span>{capabilities.tryOn.reason} You can still browse your saved looks.</span>
        </div>
      )}

      <div className="looks-layout section">
        <Card className="looks-panel">
          <div className="looks-step">
            <h2 className="looks-step__title">1. Your photo</h2>
            <p className="looks-step__hint">A clear, well-lit full-body photo, standing and facing the camera, works best.</p>
            <UploadDropzone
              onFileSelect={handlePhoto}
              preview={photoPreview}
              onRemove={() => handlePhoto(null)}
              label="Upload a full-body photo"
            />
          </div>

          <div className="looks-step">
            <h2 className="looks-step__title">2. Pick clothes</h2>
            {withPhotos.length === 0 ? (
              <EmptyState
                icon={Shirt}
                title="No wardrobe photos yet"
                description="Add photos of your clothes to your wardrobe to try them on."
                actionLabel="Build your wardrobe"
                onAction={() => navigate('/wardrobe')}
              />
            ) : (
              <>
                {categories.length > 1 && (
                  <div className="tag-toggle-group">
                    {['', ...categories].map((value) => (
                      <button
                        key={value || 'all'}
                        type="button"
                        className={`filter-chip ${category === value ? 'filter-chip--active' : ''}`}
                        onClick={() => setCategory(value)}
                      >
                        {value || 'All'}
                      </button>
                    ))}
                  </div>
                )}
                <WardrobePicker items={shown} selected={selectedIds} onToggle={toggleItem} />
              </>
            )}
          </div>

          {selectedItems.length > 0 && (
            <div className="looks-step">
              <h2 className="looks-step__title">Selected ({selectedItems.length}/{MAX_ITEMS})</h2>
              <ul className="looks-selected">
                {selectedItems.map((item) => (
                  <li key={item._id} className="looks-selected__item">
                    <img src={item.imageUrl} alt="" />
                    <span>{item.name}</span>
                    <button type="button" onClick={() => toggleItem(item._id)} aria-label={`Remove ${item.name}`}>
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <div className="alert alert--error">{error}</div>}

          <Button
            fullWidth
            size="lg"
            onClick={() => generate(selectedIds)}
            loading={generating}
            disabled={unavailable || rechecking || !(photoFile || photoLookId) || selectedIds.length === 0}
          >
            <Sparkles size={16} /> Generate my look
          </Button>
        </Card>

        <div className="looks-output">
          {look || generating ? (
            <LookResult
              look={look}
              generating={generating}
              onRegenerate={() => generate(look.clothingItems.map((item) => item._id), look._id)}
              regenerateDisabled={unavailable || rechecking}
              onUpdate={handleUpdate}
            />
          ) : (
            <div className="looks-output__empty">
              <Sparkles size={22} />
              <p>Your look will appear here.</p>
            </div>
          )}
        </div>
      </div>

      <LookGallery
        looks={savedLooks}
        loading={loading}
        error={listError}
        onRetry={fetchLooks}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        emptyText="Save a generated look to keep it here."
      />
    </div>
  );
}
