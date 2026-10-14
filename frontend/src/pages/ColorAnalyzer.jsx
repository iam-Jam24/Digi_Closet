import { useState } from 'react';
import { Palette } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Select from '../components/Select';
import Button from '../components/Button';
import { ColorSwatchGrid } from '../components/ColorSwatch';

const COLOR_OPTIONS = ['Black', 'White', 'Navy', 'Grey', 'Beige', 'Brown', 'Red', 'Blue', 'Green', 'Pink', 'Maroon', 'Olive', 'Yellow', 'Orange', 'Purple'];
const OCCASIONS = ['Casual', 'Formal', 'Festive', 'Office', 'Party'];

export default function ColorAnalyzer() {
  const { showToast } = useToast();
  const [selectedColors, setSelectedColors] = useState([]);
  const [occasion, setOccasion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleColor = (c) => {
    setSelectedColors((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const handleAnalyze = async () => {
    if (selectedColors.length === 0) {
      showToast('Select at least one color.', 'error');
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.post('/colors/analyze', { colors: selectedColors, occasion });
      setResult(data.data);
    } catch {
      showToast('Failed to analyze colors.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Color Combination Analyzer" subtitle="Understand which colors pair well together, in plain language." />

      <Card className="section">
        <h2 className="section__title">Select colors from your outfit</h2>
        <div className="tag-toggle-group">
          {COLOR_OPTIONS.map((c) => (
            <button key={c} onClick={() => toggleColor(c)} className={`filter-chip ${selectedColors.includes(c) ? 'filter-chip--active' : ''}`}>{c}</button>
          ))}
        </div>
        <div style={{ marginTop: 'var(--space-4)', maxWidth: '16rem' }}>
          <Select label="Occasion" options={OCCASIONS} value={occasion} onChange={(e) => setOccasion(e.target.value)} />
        </div>
        <Button onClick={handleAnalyze} loading={loading} style={{ marginTop: 'var(--space-4)' }}>
          <Palette size={16} /> Analyze Colors
        </Button>
      </Card>

      {result && (
        <Card className="section">
          {result.mode === 'offline-fallback' && (
            <div className="alert alert--info section">Offline heuristic — configure GEMINI_API_KEY for a tailored explanation.</div>
          )}
          <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>{result.analysis}</p>

          <div className="section">
            <h3 className="section__title" style={{ fontSize: 'var(--text-base)' }}>Complementary Colors</h3>
            <ColorSwatchGrid colors={result.complementaryColors} />
          </div>
          <div className="section">
            <h3 className="section__title" style={{ fontSize: 'var(--text-base)' }}>Neutral Pairings</h3>
            <ColorSwatchGrid colors={result.neutralPairings} />
          </div>
          <div>
            <h3 className="section__title" style={{ fontSize: 'var(--text-base)' }}>Footwear & Accessories</h3>
            <ColorSwatchGrid colors={[...(result.footwearSuggestions || []), ...(result.accessorySuggestions || [])]} />
          </div>
        </Card>
      )}
    </div>
  );
}
