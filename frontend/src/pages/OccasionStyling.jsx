import { useState } from 'react';
import { CalendarHeart } from 'lucide-react';
import api from '../services/api';
import useWardrobe from '../hooks/useWardrobe';
import useOutfits from '../hooks/useOutfits';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import OutfitCard from '../components/OutfitCard';
import EmptyState from '../components/EmptyState';

const OCCASIONS = ['College / Everyday', 'Office / Interview', 'Casual Outing', 'Party / Birthday', 'Wedding / Formal', 'Date', 'Festival', 'Travel', 'Gym / Sports'];
const DRESS_CODES = ['Casual', 'Smart Casual', 'Business Formal', 'Black Tie', 'Ethnic', 'Athleisure'];

export default function OccasionStyling() {
  const { items } = useWardrobe();
  const { saveOutfit } = useOutfits();
  const { showToast } = useToast();
  const [form, setForm] = useState({ occasion: '', dressCode: '', style: '', city: '', budget: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const resolveItems = (itemIds) => items.filter((i) => itemIds.includes(String(i._id)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.occasion) {
      showToast('Please select an occasion.', 'error');
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.post('/styling/occasion', form);
      setResult(data.data);
    } catch {
      showToast('Failed to generate styling suggestions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (outfit) => {
    try {
      await saveOutfit({
        title: outfit.title, itemIds: outfit.itemIds, occasion: form.occasion,
        explanation: outfit.explanation, styleTips: outfit.styleTips, missingItems: outfit.missingItems,
        source: 'occasion-styling',
      });
      showToast('Outfit saved.', 'success');
    } catch {
      showToast('Failed to save outfit.', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Occasion-Based Styling" subtitle="Get outfit guidance tailored to a specific event." />

      <Card className="section">
        <form onSubmit={handleSubmit} className="form-grid form-grid--2">
          <Select label="Occasion" options={OCCASIONS} value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} />
          <Select label="Dress Code" options={DRESS_CODES} value={form.dressCode} onChange={(e) => setForm({ ...form, dressCode: e.target.value })} />
          <Input label="City (for weather)" placeholder="e.g. Delhi" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="Budget if shopping needed (₹)" type="number" placeholder="Optional" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          <div style={{ gridColumn: '1 / -1' }}>
            <Button type="submit" loading={loading}><CalendarHeart size={16} /> Get Styling Suggestions</Button>
          </div>
        </form>
      </Card>

      {result && (
        <div className="section">
          {result.weather && <p className="text-muted" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>Current weather: {result.weather}</p>}
          {result.mode === 'offline-fallback' && (
            <div className="alert alert--info section">Offline heuristic suggestion — configure GEMINI_API_KEY for tailored AI styling.</div>
          )}
          {result.outfits?.length === 0 ? (
            <EmptyState title="No complete outfit available" description={result.note || 'Add more wardrobe items to get occasion-specific recommendations.'} />
          ) : (
            <div className="grid grid--2-lg">
              {result.outfits?.map((outfit, idx) => (
                <OutfitCard key={idx} outfit={{ ...outfit, items: resolveItems(outfit.itemIds) }} onSave={() => handleSave(outfit)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
