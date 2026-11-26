import { useState } from 'react';
import { Wallet } from 'lucide-react';
import useShoppingList from '../hooks/useShoppingList';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import ShoppingPlanCard from '../components/ShoppingPlanCard';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { CATEGORIES, STYLES } from '../constants/wardrobe';
import '../styles/shopping.css';

export default function BudgetPlanner() {
  const { lists, loading, planning, error, plan, deleteList } = useShoppingList();
  const { showToast } = useToast();
  const [form, setForm] = useState({ budget: '', goal: '', style: '', priorities: '' });
  const [categories, setCategories] = useState([]);
  const [formError, setFormError] = useState('');
  const [latestId, setLatestId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };

  const toggleCategory = (category) => {
    setCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const budget = Number(form.budget);
    if (!budget || budget < 200) {
      setFormError('Enter a total budget of at least ₹200.');
      return;
    }
    try {
      const result = await plan({ ...form, budget, categories });
      setLatestId(result.shoppingList._id);
    } catch {
      // the hook exposes the error message
    }
  };

  const handleDelete = async () => {
    try {
      await deleteList(deleteTarget._id);
      if (deleteTarget._id === latestId) setLatestId(null);
      showToast('Shopping plan deleted.', 'success');
    } catch {
      showToast('Could not delete the plan.', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const latest = lists.find((l) => l._id === latestId);
  const previous = lists.filter((l) => l._id !== latestId);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Discover"
        title="Shop with a plan."
        subtitle="Tell us your budget and what you need. We'll look at what you already own and suggest what's worth buying."
        image="/images/editorial/knits-on-divider.jpg"
        variant="reverse"
      />

      <div className="bp-layout">
        <Card className="bp-form-card">
          <form onSubmit={handleSubmit} className="bp-form">
            <Input label="Total budget (₹)" name="budget" type="number" min="200" step="100" placeholder="5000" value={form.budget} onChange={update} />
            <Input label="What are you shopping for?" name="goal" placeholder="e.g. College outfits" value={form.goal} onChange={update} maxLength={120} />

            <div className="field">
              <span className="field__label">Categories (optional)</span>
              <div className="bp-chips">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`filter-chip ${categories.includes(category) ? 'filter-chip--active' : ''}`}
                    onClick={() => toggleCategory(category)}
                    aria-pressed={categories.includes(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <Select label="Preferred style" name="style" options={STYLES} placeholder="Any style" value={form.style} onChange={update} />
            <Input label="Priorities (optional)" name="priorities" placeholder="e.g. comfortable shoes first, versatile basics" value={form.priorities} onChange={update} maxLength={200} />

            {(formError || error) && <div className="alert alert--error">{formError || error}</div>}

            <Button type="submit" loading={planning} fullWidth>
              <Wallet size={16} /> {planning ? 'Planning…' : 'Build my shopping list'}
            </Button>
          </form>
        </Card>

        <div className="bp-results">
          {planning && (
            <Card className="bp-placeholder">
              <LoadingSpinner size="md" />
              <p>Checking your wardrobe and splitting the budget…</p>
            </Card>
          )}
          {!planning && latest && <ShoppingPlanCard list={latest} />}
          {!planning && !latest && (
            <Card className="bp-placeholder">
              <p>Your shopping list will appear here. The total always stays within your budget.</p>
            </Card>
          )}
        </div>
      </div>

      <section className="section">
        <h2 className="section__title">Previous plans</h2>
        {loading ? (
          <LoadingSpinner />
        ) : previous.length === 0 ? (
          <p className="text-muted">No earlier plans yet.</p>
        ) : (
          <div className="bp-previous">
            {previous.map((list) => <ShoppingPlanCard key={list._id} list={list} compact onDelete={setDeleteTarget} />)}
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this plan?"
        message={`"${deleteTarget?.title}" will be removed permanently.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
