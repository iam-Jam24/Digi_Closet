import { useState, useEffect } from 'react';
import { Star, ImageIcon, Filter, Search, X } from 'lucide-react';
import useProducts from '../hooks/useProducts';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Select from '../components/Select';
import Input from '../components/Input';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import Button from '../components/Button';

const CATEGORIES = [
  'T-Shirts', 'Shirts', 'Jeans', 'Trousers', 'Dresses',
  'Jackets', 'Sneakers', 'Loafers', 'Accessories',
];

const STYLES = [
  'Casual', 'Classic', 'Formal', 'Minimalist',
  'Gen Z Streetwear', 'Sporty',
];

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

export default function Products() {
  const { products, loading, error, fetchProducts } = useProducts();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    style: '',
    color: '',
    minPrice: '',
    maxPrice: '',
  });

  const handleFilterChange = (e) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    fetchProducts(filters);
  };

  const clearFilters = () => {
    const empty = { category: '', style: '', color: '', minPrice: '', maxPrice: '' };
    setFilters(empty);
    setSearchQuery('');
    fetchProducts(empty);
  };

  const hasFilters = Object.values(filters).some((v) => v !== '') || searchQuery !== '';

  // Filter products by live search query
  const displayedProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.style?.toLowerCase().includes(q) ||
      p.color?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  // Apply filters when changed
  useEffect(() => {
    if (filters.category !== '' || filters.style !== '') {
      fetchProducts(filters);
    }
  }, [filters.category, filters.style]);

  if (loading && products.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => fetchProducts()} />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Products"
        subtitle="Discover curated fashion items for every style and budget."
        action={
          <div className="flex items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-brand-200 rounded-xl text-brand-900 placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-900/10 focus:border-brand-900 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        }
      />

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select
              label="Category"
              name="category"
              options={CATEGORIES}
              value={filters.category}
              onChange={handleFilterChange}
              placeholder="All categories"
            />
            <Select
              label="Style"
              name="style"
              options={STYLES}
              value={filters.style}
              onChange={handleFilterChange}
              placeholder="All styles"
            />
            <Input
              label="Color"
              name="color"
              placeholder="e.g. Black"
              value={filters.color}
              onChange={handleFilterChange}
            />
            <Input
              label="Min Price (₹)"
              name="minPrice"
              type="number"
              placeholder="0"
              value={filters.minPrice}
              onChange={handleFilterChange}
            />
            <Input
              label="Max Price (₹)"
              name="maxPrice"
              type="number"
              placeholder="10000"
              value={filters.maxPrice}
              onChange={handleFilterChange}
            />
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-brand-100">
            <Button size="sm" onClick={applyFilters}>
              Apply Filters
            </Button>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Active Filter Chips */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-medium text-brand-400">Active Filters:</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-100 rounded-full text-xs font-medium text-brand-800">
              Search: "{searchQuery}"
              <X className="w-3 h-3 cursor-pointer hover:text-brand-950" onClick={() => setSearchQuery('')} />
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-100 rounded-full text-xs font-medium text-brand-800">
              Category: {filters.category}
              <X className="w-3 h-3 cursor-pointer hover:text-brand-950" onClick={() => {
                const updated = { ...filters, category: '' };
                setFilters(updated);
                fetchProducts(updated);
              }} />
            </span>
          )}
          {filters.style && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-100 rounded-full text-xs font-medium text-brand-800">
              Style: {filters.style}
              <X className="w-3 h-3 cursor-pointer hover:text-brand-950" onClick={() => {
                const updated = { ...filters, style: '' };
                setFilters(updated);
                fetchProducts(updated);
              }} />
            </span>
          )}
          {filters.color && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-100 rounded-full text-xs font-medium text-brand-800">
              Color: {filters.color}
              <X className="w-3 h-3 cursor-pointer hover:text-brand-950" onClick={() => {
                const updated = { ...filters, color: '' };
                setFilters(updated);
                fetchProducts(updated);
              }} />
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-brand-500 hover:text-brand-900 underline ml-2">
            Reset all
          </button>
        </div>
      )}

      {/* Product Grid */}
      {displayedProducts.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try adjusting your search query or filters to discover more products."
          actionLabel="Clear Filters"
          onAction={clearFilters}
        />
      ) : (
        <>
          <p className="text-sm text-brand-400 mb-4">
            {displayedProducts.length} {displayedProducts.length === 1 ? 'product' : 'products'} found
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedProducts.map((product) => (
              <Card key={product.id} padding={false} hover className="overflow-hidden group">
                {/* Image */}
                <div className="aspect-[3/4] bg-brand-50 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`${product.imageUrl ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}
                  >
                    <ImageIcon className="w-10 h-10 text-brand-200" />
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-medium text-brand-400 uppercase tracking-wider">
                      {product.brand}
                    </span>
                    {product.rating > 0 && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{product.rating}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-brand-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-100">
                    <span className="text-sm font-bold text-brand-900">
                      {formatPrice(product.price)}
                    </span>
                    <Badge variant="secondary" size="sm">
                      {product.category}
                    </Badge>
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
