import { ImageIcon, Pencil, Trash2 } from 'lucide-react';
import Card from './Card';
import Badge from './Badge';

export default function ClothingCard({ item, onClick, onEdit, onDelete }) {
  return (
    <Card padding={false} hover className="clothing-card" onClick={() => onClick?.(item)}>
      <div className="clothing-card__image-wrap">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="clothing-card__image" />
        ) : (
          <ImageIcon className="clothing-card__placeholder" size={36} />
        )}
      </div>
      <div className="clothing-card__body">
        <p className="clothing-card__name">{item.name}</p>
        <div className="clothing-card__meta">
          <Badge size="sm">{item.category}</Badge>
          {item.colors?.[0] && <span className="clothing-card__color">{item.colors[0]}</span>}
        </div>
      </div>
      {(onEdit || onDelete) && (
        <div className="clothing-card__actions">
          {onEdit && (
            <button
              className="clothing-card__action-btn"
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              aria-label="Edit item"
            >
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              className="clothing-card__action-btn clothing-card__action-btn--danger"
              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
              aria-label="Delete item"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
