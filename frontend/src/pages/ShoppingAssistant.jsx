import { useState } from 'react';
import { Wallet, Trash2 } from 'lucide-react';
import useShoppingList from '../hooks/useShoppingList';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const CATEGORIES = ['T-Shirts', 'Shirts', 'Jeans', 'Trousers', 'Dresses', 'Jackets', 'Sneakers', 'Loafers', 'Accessories'];
const STYLES = ['Casual', 'Classic', 'Formal', 'Minimalist', 'Gen Z Streetwear', 'Sporty'];

const formatPrice = (price) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

export default function ShoppingAssistant() {
  const { lists, loading, planning, plan, deleteList } = useShoppingList();
  const { showToast } = useToast();
  const [form, setForm] = useState({ budget: '', categories: [], style: '', occasion: '' });
  const [latestResult, setLatestResult] = useState(null);

  const toggleCategory = (c) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(c) ? prev.categories.filter((x) => x !== c) : [...prev.categories, c],
    }));
  };

  const handlePlan = async (e) => {
    e.preventDefault();
    if (!form.budget || Number(form.budget) <= 0) {
      showToast('Please enter a valid budget.', 'error');
      return;
    }
    try {
      const data = await plan({ ...form, budget: Number(form.budget) });
      setLatestResult(data);
    } catch {
      showToast('Failed to build shopping plan.', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Budget Shopping Assistant" subtitle="Build a shopping list that respects your budget." />

      <Card className="section">
        <form onSubmit={handlePlan} className="form-grid form-grid--2">
          <Input label="Total Budget (₹)" type="number" placeholder="e.g. 5000" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          <Input label="Occasion (optional)" placeholder="e.g. Office" value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} />
          <Select label="Preferred Style" options={STYLES} value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} />
          <div>
            <label className="field__label">Categories</label>
            <div className="tag-toggle-group" style={{ marginTop: 'var(--space-2)' }}>
              {CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => toggleCategory(c)} className={`filter-chip ${form.categories.includes(c) ? 'filter-chip--active' : ''}`}>{c}</button>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Button type="submit" loading={planning}><Wallet size={16} /> Build Shopping Plan</Button>
          </div>
        </form>
      </Card>

      {latestResult?.warning && <div className="alert alert--warning section">{latestResult.warning}</div>}

      <div className="section">
        <h2 className="section__title">Your Shopping Lists</h2>
        {lists.length === 0 ? (
          <EmptyState icon={Wallet} title="No shopping lists yet" description="Create a budget-based shopping plan above." />
        ) : (
          lists.map((list) => (
            <Card key={list._id} className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <div>
                  <h3 style={{ fontWeight: 600 }}>{list.title}</h3>
                  <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                    Budget: {formatPrice(list.budget)} — Estimated total: {formatPrice(list.estimatedTotal)}
                  </p>
                </div>
                <button onClick={() => deleteList(list._id)} aria-label="Delete list" style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
              {list.items.length === 0 ? (
                <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>No items matched this plan's filters within budget.</p>
              ) : (
                <div className="grid grid--cards">
                  {list.items.map((item, i) => (
                    <div key={i} className="card card--padded" style={{ padding: 'var(--space-3)' }}>
                      <p style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{item.snapshot.name}</p>
                      <p className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>{item.snapshot.brand}</p>
                      <p style={{ fontWeight: 700, marginTop: 'var(--space-1)' }}>{formatPrice(item.snapshot.price)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
