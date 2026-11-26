import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Shirt, Search, Pencil, Trash2, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import useWardrobe from '../hooks/useWardrobe';
import { getErrorMessage } from '../services/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import ClothingCard from '../components/ClothingCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmDialog from '../components/ConfirmDialog';
import WardrobeItemForm from '../components/WardrobeItemForm';
import { CATEGORIES, SEASONS, OCCASIONS, splitList } from '../constants/wardrobe';

const emptyItemForm = {
  name: '', category: '', type: '', primaryColor: '', secondaryColor: '', pattern: '',
  style: '', size: '', brand: '', season: [], occasions: '', notes: '', imageUrl: '',
};

function itemToForm(item) {
  return {
    name: item.name || '',
    category: item.category || '',
    type: item.type || '',
    primaryColor: item.colors?.[0] || '',
    secondaryColor: item.colors?.[1] || '',
    pattern: item.pattern || '',
    style: item.style || '',
    size: item.size || '',
    brand: item.brand || '',
    season: item.season || [],
    occasions: (item.occasions || []).join(', '),
    notes: item.notes || '',
    imageUrl: item.imageUrl || '',
  };
}

const SORT_OPTIONS = [
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'category', label: 'Category' },
];

function formToPayload(form) {
  return {
    name: form.name.trim(),
    category: form.category,
    type: form.type.trim() || null,
    colors: [form.primaryColor, form.secondaryColor].map((c) => c.trim()).filter(Boolean),
    pattern: form.pattern.trim() || null,
    style: form.style || null,
    size: form.size.trim() || null,
    brand: form.brand.trim() || null,
    season: form.season,
    occasions: splitList(form.occasions),
    notes: form.notes.trim(),
  };
}

const wornOn = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// Read-only view of one piece; editing is a separate, deliberate step.
function ItemDetail({ item, onEdit, onDelete }) {
  const rows = [
    ['Category', [item.category, item.type].filter(Boolean).join(' · ')],
    ['Colours', item.colors?.join(', ')],
    ['Pattern', item.pattern],
    ['Style', item.style],
    ['Season', item.season?.join(', ')],
    ['Occasions', item.occasions?.join(', ')],
    ['Brand', item.brand],
    ['Size', item.size],
    ['Worn', item.wearCount ? `${item.wearCount} ${item.wearCount === 1 ? 'time' : 'times'}${item.lastWornAt ? `, last on ${wornOn.format(new Date(item.lastWornAt))}` : ''}` : 'Not logged yet'],
  ].filter(([, value]) => value);

  return (
    <div className="item-detail">
      <div className="item-detail__image">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <Shirt size={48} strokeWidth={1} />}
      </div>
      <div className="item-detail__info">
        <span className="eyebrow">{item.category}</span>
        <h2 className="item-detail__name">{item.name}</h2>
        {item.notes && <p className="item-detail__notes">{item.notes}</p>}
        <dl className="item-detail__rows">
          {rows.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
        <div className="item-detail__actions">
          <Button variant="dark" onClick={() => onEdit(item)}><Pencil size={14} /> Edit</Button>
          {item.imageUrl && <Link to="/try-on" className="btn btn--outline btn--md"><Camera size={14} /> Try it on</Link>}
          <Button variant="ghost" onClick={() => onDelete(item)}><Trash2 size={14} /> Remove</Button>
        </div>
      </div>
    </div>
  );
}

export default function Wardrobe() {
  const { items, loading, error, addItem, updateItem, deleteItem, classifyImage, fetchItems } = useWardrobe({ autoFetch: false });
  const { showToast } = useToast();

  const [filters, setFilters] = useState({ category: '', season: '', occasion: '', sort: '' });
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyItemForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewing, setViewing] = useState(null);

  const hasFilters = Boolean(search || filters.category || filters.season || filters.occasion);

  // The dashboard's "Add clothing" link (?add=1) opens the form.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('add')) {
      openModal();
      setSearchParams({}, { replace: true });
    }
    // openModal only resets local form state; re-running on it would reopen the modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems({
        search: search.trim() || undefined,
        category: filters.category || undefined,
        season: filters.season || undefined,
        occasion: filters.occasion || undefined,
        sort: filters.sort || undefined,
      });
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, filters, fetchItems]);

  const setFilter = (name, value) => setFilters((prev) => ({ ...prev, [name]: value }));

  const openModal = (item = null) => {
    setEditingItem(item);
    setForm(item ? itemToForm(item) : emptyItemForm);
    setImagePreview(item?.imageUrl || '');
    setImageFile(null);
    setAiStatus(null);
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleFileSelect = async (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setAiStatus(null);
    setAnalyzing(true);
    try {
      const detected = await classifyImage(file);
      setForm((prev) => ({
        ...prev,
        name: detected.name || prev.name,
        category: detected.category || prev.category,
        type: detected.type || prev.type,
        primaryColor: detected.colors[0] || prev.primaryColor,
        secondaryColor: detected.colors[1] || '',
        pattern: detected.pattern || prev.pattern,
        style: detected.style || prev.style,
        season: detected.season.length ? detected.season : prev.season,
        occasions: detected.occasions.length ? detected.occasions.join(', ') : prev.occasions,
      }));
      setAiStatus({ type: 'success' });
    } catch (err) {
      setAiStatus({ type: 'error', message: getErrorMessage(err, 'Gemini could not analyse this photo.') });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setForm((prev) => ({ ...prev, imageUrl: '' }));
    setAiStatus(null);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.name.trim() || !form.category) {
      setFormError('Name and category are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = formToPayload(form);
      if (!imageFile && !form.imageUrl) {
        payload.imageUrl = null;
      }
      if (aiStatus?.type === 'success') {
        payload.aiSuggested = { category: form.category, colors: payload.colors, style: payload.style, accepted: true };
      }

      if (editingItem) {
        await updateItem(editingItem._id, payload, imageFile);
        showToast('Item updated.', 'success');
      } else {
        await addItem(payload, imageFile);
        showToast(`${payload.name} added to your wardrobe.`, 'success');
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not save this item.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteItem(deleteTarget._id);
      showToast('Item removed.', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not remove this item.'), 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="The pieces you own"
        title="A place for everything you wear."
        subtitle={loading && !items.length ? 'Loading your pieces…' : hasFilters ? `${items.length} ${items.length === 1 ? 'piece matches' : 'pieces match'} your filters.` : `${items.length} ${items.length === 1 ? 'piece' : 'pieces'}. Endless possibilities.`}
        image="/images/editorial/suits-rail.jpg"
        variant="stacked"
        action={<Button variant="dark" onClick={() => openModal()}><Plus size={16} /> Add a piece</Button>}
      />

      <div className="wardrobe-toolbar">
        <Input
          placeholder="Search by name, colour, brand…"
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="wardrobe-toolbar__search"
          aria-label="Search wardrobe"
        />
        <Select options={SEASONS} placeholder="Any season" value={filters.season} onChange={(e) => setFilter('season', e.target.value)} aria-label="Season" />
        <Select options={OCCASIONS} placeholder="Any occasion" value={filters.occasion} onChange={(e) => setFilter('occasion', e.target.value)} aria-label="Occasion" />
        <Select options={SORT_OPTIONS} placeholder="Newest first" value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort" />
      </div>

      <nav className="category-index" aria-label="Categories">
        <button onClick={() => setFilter('category', '')} className={!filters.category ? 'is-active' : ''} aria-pressed={!filters.category}>All</button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter('category', filters.category === cat ? '' : cat)}
            className={filters.category === cat ? 'is-active' : ''}
            aria-pressed={filters.category === cat}
          >
            {cat}
          </button>
        ))}
      </nav>

      {error ? (
        <ErrorMessage message={error} onRetry={() => setFilters((prev) => ({ ...prev }))} />
      ) : loading && !items.length ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        hasFilters ? (
          <EmptyState icon={Search} title="Nothing matches" description="Try a different search or clear the filters." />
        ) : (
          <EmptyState
            icon={Shirt}
            title="An empty wardrobe. A fresh start."
            description="Photograph a piece you own and it will be named and tagged for you."
            actionLabel="Add your first piece"
            onAction={() => openModal()}
          />
        )
      ) : (
        <div className="grid grid--cards">
          {items.map((item) => (
            <ClothingCard key={item._id} item={item} onClick={setViewing} onEdit={openModal} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit item' : 'Add to wardrobe'}
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving} disabled={analyzing}>
              {editingItem ? 'Save changes' : 'Save item'}
            </Button>
          </>
        }
      >
        <WardrobeItemForm
          form={form}
          onChange={(name, value) => { setForm((prev) => ({ ...prev, [name]: value })); setFormError(''); }}
          imagePreview={imagePreview}
          onFileSelect={handleFileSelect}
          onRemoveImage={handleRemoveImage}
          analyzing={analyzing}
          aiStatus={aiStatus}
          error={formError}
          onSubmit={handleSubmit}
        />
      </Modal>

      <Modal isOpen={Boolean(viewing)} onClose={() => setViewing(null)} title="From your wardrobe" size="xl">
        {viewing && (
          <ItemDetail
            item={viewing}
            onEdit={(item) => { setViewing(null); openModal(item); }}
            onDelete={(item) => { setViewing(null); setDeleteTarget(item); }}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove item?"
        message={`Remove "${deleteTarget?.name}" from your wardrobe? Saved outfits that use it will lose this piece.`}
        confirmLabel="Remove"
      />
    </div>
  );
}
