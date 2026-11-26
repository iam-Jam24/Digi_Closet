import { useState } from 'react';
import { RefreshCw, Bookmark, BookmarkCheck, Heart, Download } from 'lucide-react';
import { getErrorMessage } from '../services/api';
import { downloadImage, lookTitle } from '../utils/looks';
import { useToast } from './Toast';
import Card from './Card';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

/**
 * A generated look next to the original photo, with Generate again / Save /
 * Favourite / Download. While `generating`, shows a waiting state instead
 * (over the previous result, if there is one).
 */
export default function LookResult({ look, generating, onRegenerate, onUpdate, regenerateDisabled = false }) {
  const { showToast } = useToast();
  const [updating, setUpdating] = useState(false);

  if (!look && !generating) return null;

  const update = async (changes, message) => {
    try {
      setUpdating(true);
      await onUpdate(look._id, changes);
      showToast(message, 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not update this look.'), 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownload = () => downloadImage(look.resultUrl, `digicloset-${lookTitle(look)}`.replace(/[^\w-]+/g, '-').toLowerCase())
    .catch(() => showToast('Could not download the image.', 'error'));

  return (
    <Card className="look-result">
      <div className="look-result__stage">
        {look ? (
          <>
            <img src={look.resultUrl} alt={`Generated look: ${lookTitle(look)}`} className="look-result__image" />
            <figure className="look-result__original">
              <img src={look.sourceImageUrl} alt="Your original photo" />
              <figcaption>Original</figcaption>
            </figure>
          </>
        ) : (
          <div className="look-result__placeholder" />
        )}
        {generating && (
          <div className="look-result__waiting">
            <LoadingSpinner size="lg" />
            <p>Creating your look. This usually takes 15–60 seconds.</p>
          </div>
        )}
      </div>

      {look?.rating && !generating && (
        <div className="look-rating">
          <div className="look-rating__score">
            <p className="look-rating__value">{look.rating.look.toFixed(1)}<span>/10</span></p>
            {look.rating.verdict && <p className="look-rating__verdict">{look.rating.verdict}</p>}
          </div>
          <div className="look-rating__meters">
            {[['look', 'Look'], ['colour', 'Colour'], ['matching', 'Matching']].map(([key, label]) => (
              <div key={key} className="look-rating__meter">
                <span>{label}<b>{look.rating[key].toFixed(1)}</b></span>
                <span className="look-rating__track"><span style={{ width: `${look.rating[key] * 10}%` }} /></span>
              </div>
            ))}
          </div>
          {look.rating.tip && <p className="look-rating__tip">{look.rating.tip}</p>}
        </div>
      )}

      {look && (
        <div className="look-result__footer">
          <p className="look-result__title">{lookTitle(look)}</p>
          {look.providerLabel && <p className="look-result__provider">Generated with {look.providerLabel}</p>}
          <div className="look-result__actions">
            <Button variant="outline" size="sm" onClick={onRegenerate} disabled={generating || regenerateDisabled}>
              <RefreshCw size={14} /> Generate again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => update({ saved: !look.saved }, look.saved ? 'Removed from saved looks.' : 'Look saved.')}
              disabled={generating || updating}
            >
              {look.saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />} {look.saved ? 'Saved' : 'Save look'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => update({ favorite: !look.favorite }, look.favorite ? 'Removed from favourites.' : 'Added to favourites.')}
              disabled={generating || updating}
              aria-pressed={look.favorite}
            >
              <Heart size={14} fill={look.favorite ? 'currentColor' : 'none'} /> Favourite
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload} disabled={generating}>
              <Download size={14} /> Download
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
