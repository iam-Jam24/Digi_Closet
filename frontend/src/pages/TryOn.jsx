import { useState } from 'react';
import { Camera, Info, Sparkles, CheckCircle2, Shirt, Layers, Palette, AlertCircle } from 'lucide-react';
import useTryOn from '../hooks/useTryOn';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import UploadDropzone from '../components/UploadDropzone';

export default function TryOn() {
  const { job, submitting, submit } = useTryOn();
  const { showToast } = useToast();
  const [userPhoto, setUserPhoto] = useState(null);
  const [userPreview, setUserPreview] = useState('');
  const [garmentPhoto, setGarmentPhoto] = useState(null);
  const [garmentPreview, setGarmentPreview] = useState('');

  const handleSubmit = async () => {
    if (!userPhoto || !garmentPhoto) {
      showToast('Please upload both a personal photo and a garment photo.', 'error');
      return;
    }
    try {
      await submit(userPhoto, garmentPhoto);
      showToast('Photos analyzed by AI!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit try-on request.', 'error');
    }
  };

  const fit = job?.fitAnalysis;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '48rem' }}>
      <PageHeader
        title="Virtual Try-On & Fit Studio"
        subtitle="Upload your photo and a garment to test fit compatibility, proportions, and AI styling."
      />

      <div className="alert alert--info section" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Info size={16} />
        <span>
          AI visual fit analysis evaluates silhouette drape and color compatibility. Generated previews may vary based on photo lighting and angle.
        </span>
      </div>

      <Card className="section">
        <div className="form-grid form-grid--2">
          <div>
            <label className="field__label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
              Your Full-Body Photo
            </label>
            <UploadDropzone
              onFileSelect={(f) => {
                setUserPhoto(f);
                setUserPreview(URL.createObjectURL(f));
              }}
              preview={userPreview}
              onRemove={() => {
                setUserPhoto(null);
                setUserPreview('');
              }}
              label="Upload a clear portrait or full-body photo"
            />
          </div>
          <div>
            <label className="field__label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
              Garment Photo
            </label>
            <UploadDropzone
              onFileSelect={(f) => {
                setGarmentPhoto(f);
                setGarmentPreview(URL.createObjectURL(f));
              }}
              preview={garmentPreview}
              onRemove={() => {
                setGarmentPhoto(null);
                setGarmentPreview('');
              }}
              label="Upload the clothing item or screenshot"
            />
          </div>
        </div>
        <Button onClick={handleSubmit} loading={submitting} style={{ marginTop: 'var(--space-5)' }}>
          <Camera size={16} /> Analyze Fit & Compatibility
        </Button>
      </Card>

      {job && (
        <div className="animate-fade-in section">
          {/* Provider status notification */}
          {job.status === 'awaiting_configuration' && (
            <div
              className="alert alert--warning"
              style={{
                marginBottom: 'var(--space-5)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-2)',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>3D Generative Warp Engine Awaiting Provider API Key</strong>
                <p style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>
                  Your images were saved securely. Full pixel-warp generative rendering requires a 3D try-on provider key.
                  In the meantime, our <strong>Gemini Multimodal Vision Engine</strong> has analyzed both images below to deliver an instant Fit & Styling Assessment.
                </p>
              </div>
            </div>
          )}

          {job.status === 'failed' && (
            <div className="alert alert--error" style={{ marginBottom: 'var(--space-5)' }}>
              Try-on error: {job.errorMessage}
            </div>
          )}

          {/* AI Fit & Silhouette Assessment */}
          {fit && (
            <Card className="section" style={{ border: '1px solid var(--accent-violet-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <h2 className="section__title" style={{ margin: 0 }}>
                  <Sparkles size={20} color="var(--accent-violet)" style={{ verticalAlign: 'middle', marginRight: 'var(--space-2)' }} />
                  AI Fit & Silhouette Assessment
                </h2>
                {fit.fitScore && (
                  <span
                    style={{
                      background: 'var(--accent-gradient)',
                      color: '#fff',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    {fit.fitScore}% Match
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                {fit.silhouetteVerdict && (
                  <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>
                      <Shirt size={16} color="var(--accent-violet)" /> Silhouette & Proportion
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', lineHeight: 1.5, margin: 0 }}>
                      {fit.silhouetteVerdict}
                    </p>
                  </div>
                )}

                {fit.colorHarmony && (
                  <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>
                      <Palette size={16} color="var(--color-info)" /> Color & Tone Harmony
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', lineHeight: 1.5, margin: 0 }}>
                      {fit.colorHarmony}
                    </p>
                  </div>
                )}
              </div>

              {/* Styling Tips */}
              {fit.stylingTips && fit.stylingTips.length > 0 && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h3 className="analytics-subtitle">
                    <Layers size={14} style={{ marginRight: 'var(--space-1)' }} /> How to Style This Piece
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {fit.stylingTips.map((tip, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        <CheckCircle2 size={14} color="var(--color-success)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Pairings */}
              {fit.recommendedPairings && fit.recommendedPairings.length > 0 && (
                <div>
                  <h3 className="analytics-subtitle">Complementary Pairings</h3>
                  <div className="tag-toggle-group">
                    {fit.recommendedPairings.map((pairing, idx) => (
                      <span key={idx} className="filter-chip filter-chip--active" style={{ fontSize: '0.75rem', cursor: 'default' }}>
                        + {pairing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {job.status === 'completed' && job.resultUrl && (
            <Card className="section">
              <h3 className="section__title">Rendered 3D Preview</h3>
              <img src={job.resultUrl} alt="Try-on result" style={{ maxWidth: '100%', borderRadius: 'var(--radius-lg)' }} />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
