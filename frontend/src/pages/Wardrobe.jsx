import { useState } from 'react';
import { Plus, Shirt, Search } from 'lucide-react';
import useWardrobe from '../hooks/useWardrobe';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import ClothingCard from '../components/ClothingCard';
import UploadDropzone from '../components/UploadDropzone';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmDialog from '../components/ConfirmDialog';

const CATEGORIES = ['Tops', 'Shirts', 'T-Shirts', 'Trousers', 'Jeans', 'Dresses', 'Footwear', 'Outerwear', 'Accessories'];
const SORT_OPTIONS = [{ value: '', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'name', label: 'Name (A-Z)' }, { value: 'category', label: 'Category' }];

const initialForm = { name: '', category: '', colors: '', brand: '', imageUrl: '', style: '', occasions: '', notes: '' };

export default function Wardrobe() {
  const { items, loading, error, adding, addItem, updateItem, deleteItem, uploadImage, classifyImage, fetchItems } = useWardrobe();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [classifying, setClassifying] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleFileSelect = async (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    try {
      setClassifying(true);
      const suggestion = await classifyImage(file);
      if (suggestion.category) {
        setForm((prev) => ({
          ...prev,
          category: suggestion.category || prev.category,
          colors: suggestion.colors?.join(', ') || prev.colors,
          style: suggestion.style || prev.style,
        }));
        showToast(
          suggestion.mode === 'ai' ? 'AI suggested a category and colors — review before saving.' : 'Could not run AI classification (offline mode).',
          suggestion.mode === 'ai' ? 'success' : 'info'
        );
      }
    } catch {
      showToast('AI classification failed. You can still fill in details manually.', 'info');
    } finally {
      setClassifying(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setImageFile(null);
    setImagePreview('');
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category) {
      setFormError('Name and category are required.');
      return;
    }
    try {
      let imageUrl = form.imageUrl;
      if (imageFile) {
        const result = await uploadImage(imageFile);
        imageUrl = result.imageUrl;
      }
      const payload = {
        ...form,
        imageUrl,
        colors: form.colors ? form.colors.split(',').map((c) => c.trim()).filter(Boolean) : [],
        occasions: form.occasions ? form.occasions.split(',').map((c) => c.trim()).filter(Boolean) : [],
      };
      if (editingId) {
        await updateItem(editingId, payload);
        showToast('Item updated.', 'success');
      } else {
        await addItem(payload);
        showToast('Item added to wardrobe.', 'success');
      }
      resetForm();
      setShowModal(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save item.');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name, category: item.category, colors: (item.colors || []).join(', '),
      brand: item.brand || '', imageUrl: item.imageUrl || '', style: item.style || '',
      occasions: (item.occasions || []).join(', '), notes: item.notes || '',
    });
    setImagePreview(item.imageUrl || '');
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem(deleteTarget._id);
      showToast('Item removed.', 'success');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleFilter = (category) => {
    const newFilter = category === activeFilter ? '' : category;
    setActiveFilter(newFilter);
    fetchItems({ category: newFilter || undefined, search: search || undefined, sort: sort || undefined });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchItems({ category: activeFilter || undefined, search: search || undefined, sort: sort || undefined });
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    fetchItems({ category: activeFilter || undefined, search: search || undefined, sort: e.target.value || undefined });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => fetchItems()} />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Wardrobe"
        subtitle="Manage your clothing collection."
        action={<Button onClick={() => { resetForm(); setShowModal(true); }}><Plus size={16} /> Add Item</Button>}
      />

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <Input placeholder="Search wardrobe..." icon={Search} value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, marginBottom: 0 }} />
        <Select options={SORT_OPTIONS} value={sort} onChange={handleSortChange} placeholder="Sort by" style={{ minWidth: '10rem', marginBottom: 0 }} />
      </form>

      <div className="filter-bar">
        <button onClick={() => handleFilter('')} className={`filter-chip ${!activeFilter ? 'filter-chip--active' : ''}`}>All</button>
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => handleFilter(cat)} className={`filter-chip ${activeFilter === cat ? 'filter-chip--active' : ''}`}>{cat}</button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Shirt}
          title="No items found"
          description="Add your first clothing item to start building your digital wardrobe."
          actionLabel="Add Item"
          onAction={() => { resetForm(); setShowModal(true); }}
        />
      ) : (
        <div className="grid grid--cards">
          {items.map((item) => (
            <ClothingCard key={item._id} item={item} onEdit={handleEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingId ? 'Edit Item' : 'Add Wardrobe Item'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={adding}>{editingId ? 'Save Changes' : 'Add Item'}</Button>
          </>
        }
      >
        <WardrobeForm
          form={form} handleChange={handleChange} formError={formError}
          imagePreview={imagePreview} onFileSelect={handleFileSelect}
          onRemoveImage={() => { setImageFile(null); setImagePreview(''); setForm({ ...form, imageUrl: '' }); }}
          classifying={classifying} onSubmit={handleSubmit}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove item?"
        message={`Remove "${deleteTarget?.name}" from your wardrobe? This cannot be undone.`}
        confirmLabel="Remove"
      />
    </div>
  );
}

function WardrobeForm({ form, handleChange, formError, imagePreview, onFileSelect, onRemoveImage, classifying, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="auth-card__form">
      <UploadDropzone onFileSelect={onFileSelect} preview={imagePreview} onRemove={onRemoveImage} label="Upload a photo for AI-assisted details" />
      {classifying && <p className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>Analyzing image…</p>}
      <Input label="Item Name" name="name" placeholder="e.g. Blue Oxford Shirt" value={form.name} onChange={handleChange} />
      <Select label="Category" name="category" options={CATEGORIES} value={form.category} onChange={handleChange} />
      <Input label="Colors (comma separated)" name="colors" placeholder="e.g. Navy, White" value={form.colors} onChange={handleChange} />
      <Input label="Style" name="style" placeholder="e.g. Casual" value={form.style} onChange={handleChange} />
      <Input label="Occasions (comma separated)" name="occasions" placeholder="e.g. Office, Casual" value={form.occasions} onChange={handleChange} />
      <Input label="Brand" name="brand" placeholder="e.g. Levi's" value={form.brand} onChange={handleChange} />
      <div className="field">
        <label className="field__label">Notes</label>
        <textarea name="notes" rows={3} placeholder="Any additional notes..." value={form.notes} onChange={handleChange} className="input" />
      </div>
      {formError && <div className="alert alert--error">{formError}</div>}
    </form>
  );
}
