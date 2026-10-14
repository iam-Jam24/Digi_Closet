import { Heart, ImageIcon } from 'lucide-react';
import Card from './Card';
import Badge from './Badge';
import Button from './Button';

export default function OutfitCard({ outfit, onSave, onFavoriteToggle, onDelete, saved = false }) {
  const items = outfit.items || outfit.clothingItems || [];

  return (
    <Card className="outfit-card">
      <div className="outfit-card__header">
        <h3 className="outfit-card__title">{outfit.title}</h3>
        {onFavoriteToggle && (
          <button
            className={`outfit-card__favorite ${outfit.favorite ? 'outfit-card__favorite--active' : ''}`}
            onClick={() => onFavoriteToggle(outfit)}
            aria-label="Toggle favorite"
          >
            <Heart size={18} fill={outfit.favorite ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="outfit-card__items">
          {items.map((item) => (
            <div key={item._id || item.id} className="outfit-card__item-thumb">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <ImageIcon size={20} color="var(--text-muted)" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {outfit.explanation && <p className="outfit-card__explanation">{outfit.explanation}</p>}

      {outfit.styleTips?.length > 0 && (
        <div className="outfit-card__tips">
          {outfit.styleTips.map((tip, i) => <p key={i} className="outfit-card__tip">• {tip}</p>)}
        </div>
      )}

      {outfit.missingItems?.length > 0 && (
        <div className="outfit-card__missing">
          {outfit.missingItems.map((m, i) => <Badge key={i} variant="warning" size="sm">Missing: {m}</Badge>)}
        </div>
      )}

      {(onSave || onDelete) && (
        <div className="outfit-card__footer">
          {onSave && !saved && <Button size="sm" onClick={() => onSave(outfit)}>Save Outfit</Button>}
          {onDelete && <Button size="sm" variant="ghost" onClick={() => onDelete(outfit)}>Remove</Button>}
        </div>
      )}
    </Card>
  );
}
