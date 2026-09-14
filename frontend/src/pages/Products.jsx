import { useState, useEffect } from 'react';
import { Star, ImageIcon, Filter } from 'lucide-react';
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
    fetchProducts(empty);
  };

  const hasFilters = Object.values(filters).some((v) => v !== '');

  // Apply filters when changed (debounced via button)
  useEffect(() => {
    // Apply on category and style change immediately
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
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
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

      {/* Product Grid */}
      {products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try adjusting your filters to discover more products."
          actionLabel="Clear Filters"
          onAction={clearFilters}
        />
      ) : (
        <>
          <p className="text-sm text-brand-400 mb-4">
            {products.length} {products.length === 1 ? 'product' : 'products'} found
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
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
                <div className="p-3">
                  <p className="text-sm font-medium text-brand-900 truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-brand-400 mt-0.5">{product.brand}</p>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-brand-900">
                      {formatPrice(product.price)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium text-brand-600">
                        {product.rating}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2">
                    <Badge>{product.style}</Badge>
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
