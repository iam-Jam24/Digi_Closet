import { useState, useEffect } from 'react';
import { Star, ImageIcon, Search, Info, Heart } from 'lucide-react';
import useProducts from '../hooks/useProducts';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Select from '../components/Select';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';

const CATEGORIES = ['T-Shirts', 'Shirts', 'Jeans', 'Trousers', 'Dresses', 'Jackets', 'Sneakers', 'Loafers', 'Accessories'];
const STYLES = ['Casual', 'Classic', 'Formal', 'Minimalist', 'Gen Z Streetwear', 'Sporty'];

const formatPrice = (price) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

export default function Products() {
  const { products, isDevCatalog, loading, error, fetchProducts, saveProduct } = useProducts();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ category: '', style: '', minPrice: '', maxPrice: '' });

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const applyFilters = () => fetchProducts({ ...filters, query: searchQuery });

  const clearFilters = () => {
    const empty = { category: '', style: '', minPrice: '', maxPrice: '' };
    setFilters(empty);
    setSearchQuery('');
    fetchProducts(empty);
  };

  useEffect(() => {
    if (filters.category || filters.style) applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.style]);

  const handleSave = async (productId) => {
    try {
      await saveProduct(productId);
      showToast('Product saved.', 'success');
    } catch {
      showToast('Failed to save product.', 'error');
    }
  };

  if (loading && products.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => fetchProducts()} />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Smart Clothes Finder" subtitle="Discover clothing items for every style and budget." />

      {isDevCatalog && (
        <div className="dev-catalog-banner">
          <Info size={16} />
          Development Catalog — these are seeded sample products, not a live shopping feed.
          Configure a product search API to connect a real catalog.
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); applyFilters(); }}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}
      >
        <Input placeholder="Search products..." icon={Search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, minWidth: '14rem', marginBottom: 0 }} />
        <Select options={CATEGORIES} name="category" value={filters.category} onChange={handleFilterChange} placeholder="Category" style={{ minWidth: '9rem', marginBottom: 0 }} />
        <Select options={STYLES} name="style" value={filters.style} onChange={handleFilterChange} placeholder="Style" style={{ minWidth: '9rem', marginBottom: 0 }} />
        <Input type="number" name="minPrice" placeholder="Min ₹" value={filters.minPrice} onChange={handleFilterChange} style={{ width: '6rem', marginBottom: 0 }} />
        <Input type="number" name="maxPrice" placeholder="Max ₹" value={filters.maxPrice} onChange={handleFilterChange} style={{ width: '6rem', marginBottom: 0 }} />
      </form>

      {(filters.category || filters.style || filters.minPrice || filters.maxPrice || searchQuery) && (
        <button onClick={clearFilters} className="filter-chip" style={{ marginBottom: 'var(--space-4)' }}>Clear all filters</button>
      )}

      {products.length === 0 ? (
        <EmptyState title="No products found" description="Try adjusting your search query or filters." actionLabel="Clear Filters" onAction={clearFilters} />
      ) : (
        <>
          <p className="text-muted" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {products.length} {products.length === 1 ? 'product' : 'products'} found
          </p>
          <div className="grid grid--cards">
            {products.map((product) => (
              <Card key={product._id} padding={false} hover className="product-card" style={{ overflow: 'hidden' }}>
                <div className="product-card__image-wrap">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="product-card__image" />
                  ) : (
                    <ImageIcon size={32} color="var(--text-muted)" />
                  )}
                </div>
                <div className="product-card__body">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="product-card__brand">{product.brand}</span>
                    {product.rating > 0 && (
                      <span className="product-card__rating"><Star size={10} fill="currentColor" /> {product.rating}</span>
                    )}
                  </div>
                  <h3 className="product-card__name">{product.name}</h3>
                  <div className="product-card__footer">
                    <span className="product-card__price">{formatPrice(product.price)}</span>
                    <button onClick={() => handleSave(product._id)} aria-label="Save product" style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                      <Heart size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
