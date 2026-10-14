import { useState } from 'react';
import { Wand2, RefreshCw } from 'lucide-react';
import useOutfits from '../hooks/useOutfits';
import useWardrobe from '../hooks/useWardrobe';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import OutfitCard from '../components/OutfitCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

const OCCASIONS = ['Casual', 'College', 'Office', 'Interview', 'Date', 'Wedding', 'Party', 'Travel'];
const STYLES = ['Minimalist', 'Casual', 'Classic', 'Formal', 'Sporty', 'Gen Z Streetwear'];

export default function OutfitRecommendations() {
  const { items, loading: wardrobeLoading } = useWardrobe();
  const { recommend, recommending, saveOutfit, error } = useOutfits();
  const { showToast } = useToast();
  const [form, setForm] = useState({ occasion: '', style: '', city: '', budget: '' });
  const [result, setResult] = useState(null);
  const [savedIds, setSavedIds] = useState([]);

  const resolveItems = (itemIds) => items.filter((i) => itemIds.includes(String(i._id)));

  const handleGenerate = async (e) => {
    e?.preventDefault();
    try {
      const data = await recommend(form);
      setResult(data);
    } catch {
      showToast('Failed to generate recommendations.', 'error');
    }
  };

  const handleSave = async (outfit, idx) => {
    try {
      await saveOutfit({
        title: outfit.title,
        itemIds: outfit.itemIds,
        occasion: form.occasion,
        explanation: outfit.explanation,
        styleTips: outfit.styleTips,
        missingItems: outfit.missingItems,
        source: 'outfit-recommendation',
      });
      setSavedIds((prev) => [...prev, idx]);
      showToast('Outfit saved to your favorites.', 'success');
    } catch {
      showToast('Failed to save outfit.', 'error');
    }
  };

  if (wardrobeLoading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="AI Outfit Recommendations" subtitle="Get outfit ideas built from your actual wardrobe." />

      {items.length === 0 && (
        <EmptyState
          icon={Wand2}
          title="Add wardrobe items first"
          description="Outfit recommendations are built from clothes you own. Add a few items to your wardrobe to get started."
        />
      )}

      <Card className="section">
        <form onSubmit={handleGenerate} className="form-grid form-grid--2">
          <Select label="Occasion" options={OCCASIONS} value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} />
          <Select label="Preferred Style" options={STYLES} value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} />
          <Input label="City (for weather)" placeholder="e.g. Mumbai" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="Budget for missing items (₹)" type="number" placeholder="Optional" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          <div style={{ gridColumn: '1 / -1' }}>
            <Button type="submit" loading={recommending} disabled={items.length === 0}>
              <Wand2 size={16} /> Generate Recommendations
            </Button>
          </div>
        </form>
      </Card>

      {error && <div className="alert alert--error section">{error}</div>}

      {result && (
        <div className="section">
          {result.weather && (
            <p className="text-muted" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
              Current weather: {result.weather}
            </p>
          )}
          {result.mode === 'offline-fallback' && (
            <div className="alert alert--info section">
              Showing an offline heuristic suggestion — configure GEMINI_API_KEY for full AI-generated styling explanations.
            </div>
          )}
          {result.outfits?.length === 0 ? (
            <EmptyState title="No complete outfit could be built" description={result.note || 'Try adding more wardrobe items across different categories.'} />
          ) : (
            <div className="grid grid--2-lg">
              {result.outfits?.map((outfit, idx) => (
                <OutfitCard
                  key={idx}
                  outfit={{ ...outfit, items: resolveItems(outfit.itemIds) }}
                  onSave={() => handleSave(outfit, idx)}
                  saved={savedIds.includes(idx)}
                />
              ))}
            </div>
          )}
          <Button variant="outline" onClick={handleGenerate} loading={recommending} style={{ marginTop: 'var(--space-4)' }}>
            <RefreshCw size={16} /> Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}
