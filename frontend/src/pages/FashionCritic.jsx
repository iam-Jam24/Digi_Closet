import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Select from '../components/Select';
import Button from '../components/Button';
import UploadDropzone from '../components/UploadDropzone';
import Badge from '../components/Badge';

const OCCASIONS = ['Casual', 'Formal', 'Office', 'Party', 'Date', 'Wedding'];

export default function FashionCritic() {
  const { showToast } = useToast();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [occasion, setOccasion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!imageFile) {
      showToast('Please upload an outfit photo first.', 'error');
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', imageFile);
      if (occasion) formData.append('occasion', occasion);
      const { data } = await api.post('/fashion/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to analyze outfit.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="AI Fashion Critic" subtitle="Upload an outfit photo for constructive, respectful styling feedback." />

      <Card className="section">
        <UploadDropzone onFileSelect={handleFileSelect} preview={imagePreview} onRemove={() => { setImageFile(null); setImagePreview(''); }} label="Upload a full outfit photo" />
        <div style={{ marginTop: 'var(--space-4)', maxWidth: '16rem' }}>
          <Select label="Occasion (optional)" options={OCCASIONS} value={occasion} onChange={(e) => setOccasion(e.target.value)} />
        </div>
        <Button onClick={handleAnalyze} loading={loading} style={{ marginTop: 'var(--space-4)' }}>
          <MessageSquare size={16} /> Analyze Outfit
        </Button>
      </Card>

      {result && (
        <Card className="section">
          {result.mode === 'offline-fallback' && (
            <div className="alert alert--info section">Offline heuristic review — configure GEMINI_API_KEY for a full AI critique.</div>
          )}
          <h3 className="section__title">Overall Assessment</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>{result.overallAssessment}</p>

          {result.strengths?.length > 0 && (
            <div className="section">
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Strengths</h4>
              {result.strengths.map((s, i) => <p key={i} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>• {s}</p>)}
            </div>
          )}
          {result.improvements?.length > 0 && (
            <div className="section">
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Areas to Improve</h4>
              {result.improvements.map((s, i) => <p key={i} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>• {s}</p>)}
            </div>
          )}
          <div className="form-grid form-grid--2 section">
            <div><Badge variant="info">Color Coordination</Badge><p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>{result.colorCoordination}</p></div>
            <div><Badge variant="info">Occasion Suitability</Badge><p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>{result.occasionSuitability}</p></div>
          </div>
          {result.rating && (
            <p style={{ fontWeight: 600 }}>Rating: {result.rating.score}/{result.rating.outOf}</p>
          )}
        </Card>
      )}
    </div>
  );
}
