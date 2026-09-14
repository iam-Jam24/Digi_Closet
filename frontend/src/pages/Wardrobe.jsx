import { useState } from 'react';
import { Plus, Trash2, Shirt, ImageIcon } from 'lucide-react';
import useWardrobe from '../hooks/useWardrobe';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';

const CATEGORIES = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'];

const initialForm = {
  name: '',
  category: '',
  color: '',
  brand: '',
  imageUrl: '',
  notes: '',
};

export default function Wardrobe() {
  const { items, loading, error, adding, addItem, deleteItem, fetchItems } = useWardrobe();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category) {
      setFormError('Name and category are required.');
      return;
    }

    try {
      await addItem(form);
      setForm(initialForm);
      setShowModal(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add item.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item from your wardrobe?')) return;
    try {
      setDeletingId(id);
      await deleteItem(id);
    } catch {
      // error state handled by hook
    } finally {
      setDeletingId(null);
    }
  };

  const handleFilter = (category) => {
    const newFilter = category === activeFilter ? '' : category;
    setActiveFilter(newFilter);
    fetchItems(newFilter || undefined);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => fetchItems()} />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Wardrobe"
        subtitle="Manage your clothing collection."
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        }
      />

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleFilter('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
            !activeFilter
              ? 'bg-brand-900 text-white border-brand-900'
              : 'bg-white text-brand-600 border-brand-200 hover:border-brand-300'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
              activeFilter === cat
                ? 'bg-brand-900 text-white border-brand-900'
                : 'bg-white text-brand-600 border-brand-200 hover:border-brand-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <EmptyState
          icon={Shirt}
          title="Your wardrobe is empty"
          description="Start building your digital wardrobe by adding your clothing items."
          actionLabel="Add Your First Item"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <Card key={item.id} padding={false} hover className="overflow-hidden group">
              {/* Image */}
              <div className="aspect-[3/4] bg-brand-50 flex items-center justify-center relative">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`${item.imageUrl ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}
                >
                  <ImageIcon className="w-10 h-10 text-brand-200" />
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-brand-400 hover:text-red-500 hover:bg-white opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-medium text-brand-900 truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge>{item.category}</Badge>
                  {item.color && (
                    <span className="text-xs text-brand-400">{item.color}</span>
                  )}
                </div>
                {item.brand && (
                  <p className="text-xs text-brand-400 mt-1">{item.brand}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setForm(initialForm);
          setFormError('');
        }}
        title="Add Wardrobe Item"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={adding}>
              Add Item
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Item Name"
            name="name"
            placeholder="e.g. Blue Oxford Shirt"
            value={form.name}
            onChange={handleChange}
          />
          <Select
            label="Category"
            name="category"
            options={CATEGORIES}
            value={form.category}
            onChange={handleChange}
          />
          <Input
            label="Color"
            name="color"
            placeholder="e.g. Navy Blue"
            value={form.color}
            onChange={handleChange}
          />
          <Input
            label="Brand"
            name="brand"
            placeholder="e.g. Levi's"
            value={form.brand}
            onChange={handleChange}
          />
          <Input
            label="Image URL"
            name="imageUrl"
            placeholder="https://example.com/image.jpg"
            value={form.imageUrl}
            onChange={handleChange}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-brand-700">Notes</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm bg-white border border-brand-200 rounded-lg text-brand-900 placeholder:text-brand-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-900/10 focus:border-brand-400 hover:border-brand-300 resize-none"
            />
          </div>

          {formError && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
