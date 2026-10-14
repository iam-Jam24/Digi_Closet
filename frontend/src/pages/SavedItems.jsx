import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ListChecks, Trash2, Tag } from 'lucide-react';
import api from '../services/api';
import useOutfits from '../hooks/useOutfits';
import useShoppingList from '../hooks/useShoppingList';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import OutfitCard from '../components/OutfitCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price || 0);

export default function SavedItems() {
  const navigate = useNavigate();
  const { saved: outfits, loading: outfitsLoading, toggleFavorite, deleteOutfit } = useOutfits();
  const { lists, loading: listsLoading, deleteList } = useShoppingList();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [tab, setTab] = useState('outfits');

  useEffect(() => {
    api
      .get('/products/saved')
      .then(({ data }) => setProducts(data.data.saved))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  const handleUnsaveProduct = async (id) => {
    try {
      await api.delete(`/products/saved/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      showToast('Removed from saved products.', 'success');
    } catch {
      showToast('Failed to remove product.', 'error');
    }
  };

  const handleDeleteList = async (id) => {
    try {
      await deleteList(id);
      showToast('Shopping list deleted.', 'success');
    } catch {
      showToast('Failed to delete shopping list.', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Saved Collections"
        subtitle="Your curated outfits, bookmarked products, and planned shopping lists in one place."
      />

      <div className="filter-bar">
        <button
          className={`filter-chip ${tab === 'outfits' ? 'filter-chip--active' : ''}`}
          onClick={() => setTab('outfits')}
        >
          <Heart size={14} style={{ marginRight: '0.25rem' }} /> Outfits ({outfits.length})
        </button>
        <button
          className={`filter-chip ${tab === 'products' ? 'filter-chip--active' : ''}`}
          onClick={() => setTab('products')}
        >
          <ShoppingBag size={14} style={{ marginRight: '0.25rem' }} /> Products ({products.length})
        </button>
        <button
          className={`filter-chip ${tab === 'lists' ? 'filter-chip--active' : ''}`}
          onClick={() => setTab('lists')}
        >
          <ListChecks size={14} style={{ marginRight: '0.25rem' }} /> Shopping Lists ({lists.length})
        </button>
      </div>

      {/* Outfits Tab */}
      {tab === 'outfits' && (
        outfitsLoading ? (
          <LoadingSpinner />
        ) : outfits.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No saved outfits yet"
            description="Build your style by bookmarking looks from Outfit Recommendations or Occasion Styling."
            actionLabel="Discover Outfits"
            onAction={() => navigate('/outfits')}
          />
        ) : (
          <div className="grid grid--2-lg">
            {outfits.map((outfit) => (
              <OutfitCard
                key={outfit._id}
                outfit={{ ...outfit, items: outfit.clothingItems }}
                onFavoriteToggle={() => toggleFavorite(outfit._id)}
                onDelete={() => deleteOutfit(outfit._id)}
              />
            ))}
          </div>
        )
      )}

      {/* Products Tab */}
      {tab === 'products' && (
        productsLoading ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No saved products yet"
            description="Explore our smart clothes catalog and save items to buy later."
            actionLabel="Browse Products"
            onAction={() => navigate('/products')}
          />
        ) : (
          <div className="grid grid--cards">
            {products.map((p) => (
              <Card key={p._id} padding={false} style={{ overflow: 'hidden' }}>
                <div className="product-card__image-wrap">
                  {p.snapshot?.imageUrl ? (
                    <img src={p.snapshot.imageUrl} alt={p.snapshot.name} className="product-card__image" />
                  ) : (
                    <ShoppingBag size={32} color="var(--text-muted)" />
                  )}
                </div>
                <div className="product-card__body">
                  {p.snapshot?.brand && <p className="product-card__brand">{p.snapshot.brand}</p>}
                  <p className="product-card__name">{p.snapshot?.name || 'Saved Item'}</p>
                  <div className="product-card__footer">
                    <span className="product-card__price">{formatPrice(p.snapshot?.price)}</span>
                    <button
                      onClick={() => handleUnsaveProduct(p._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-danger)',
                        fontSize: 'var(--text-xs)',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Shopping Lists Tab */}
      {tab === 'lists' && (
        listsLoading ? (
          <LoadingSpinner />
        ) : lists.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No shopping lists yet"
            description="Plan your next wardrobe upgrade with AI budget assistant to generate tailored shopping lists."
            actionLabel="Create Shopping Plan"
            onAction={() => navigate('/shopping')}
          />
        ) : (
          <div>
            {lists.map((list) => (
              <div key={list._id} className="saved-list-card">
                <div className="saved-list-card__header">
                  <div>
                    <h3 className="saved-list-card__title">{list.title || 'Shopping Plan'}</h3>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 4 }}>
                      {list.occasion && (
                        <span className="analytics-color-chip" style={{ fontSize: '0.7rem' }}>
                          <Tag size={10} /> {list.occasion}
                        </span>
                      )}
                      <span className="saved-list-card__budget">
                        Est: {formatPrice(list.estimatedTotal)} / Budget: {formatPrice(list.budget)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteList(list._id)}
                    style={{ color: 'var(--color-danger)' }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <div className="saved-list-card__items">
                  {(list.items || []).map((item, idx) => (
                    <div key={idx} className="saved-list-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        {item.snapshot?.imageUrl ? (
                          <img
                            src={item.snapshot.imageUrl}
                            alt={item.snapshot.name}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 'var(--radius-sm)',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <ShoppingBag size={20} color="var(--text-muted)" />
                        )}
                        <div>
                          <strong>{item.snapshot?.name}</strong>
                          {item.snapshot?.brand && (
                            <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                              by {item.snapshot.brand}
                            </span>
                          )}
                          {item.reason && (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: 2 }}>
                              {item.reason}
                            </div>
                          )}
                        </div>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatPrice(item.snapshot?.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
