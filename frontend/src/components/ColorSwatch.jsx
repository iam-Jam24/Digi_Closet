const COLOR_MAP = {
  black: '#1a1a1a', white: '#f5f5f5', navy: '#1e2a4a', grey: '#8a8a8a', gray: '#8a8a8a',
  beige: '#d4c5a9', brown: '#6b4a2f', red: '#dc2626', blue: '#3b82f6', green: '#22c55e',
  pink: '#ec4899', maroon: '#800020', olive: '#6b7f23', yellow: '#eab308', orange: '#f97316',
  purple: '#8b5cf6', multi: 'linear-gradient(135deg, #f87171, #facc15, #4ade80, #60a5fa)',
};

function resolveColor(name) {
  return COLOR_MAP[name?.toLowerCase()] || '#9ca3af';
}

export function ColorSwatch({ color, showLabel = true }) {
  return (
    <span className="color-swatch">
      <span className="color-swatch__dot" style={{ background: resolveColor(color) }} />
      {showLabel && <span className="color-swatch__label">{color}</span>}
    </span>
  );
}

export function ColorSwatchGrid({ colors = [] }) {
  return (
    <div className="color-swatch-grid">
      {colors.map((c, i) => (
        <span key={i} className="color-chip">
          <span className="color-swatch__dot" style={{ width: '1rem', height: '1rem', background: resolveColor(c) }} />
          {c}
        </span>
      ))}
    </div>
  );
}
