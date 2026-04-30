import { Star } from 'lucide-react';

export default function Stars({ value = 0, size = 14, showNumber = false, count }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const full = Math.floor(v);
  const half = v - full >= 0.5;
  const items = [];
  for (let i = 0; i < 5; i++) {
    const filled = i < full || (i === full && half);
    items.push(
      <Star
        key={i}
        size={size}
        className={filled ? 'text-accent-500 fill-accent-500' : 'text-gray-300'}
        strokeWidth={filled ? 1 : 1.5}
      />
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5">
      {items}
      {showNumber && (
        <span className="ml-1 text-xs font-medium" style={{ color: 'var(--color-text)' }}>
          {v.toFixed(1)}
        </span>
      )}
      {count != null && (
        <span className="ml-1 text-xs" style={{ color: 'var(--color-muted)' }}>({count})</span>
      )}
    </span>
  );
}
