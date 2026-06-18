import { Heart } from 'lucide-react';

interface HealthBarProps {
  current: number;
  max: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function HealthBar({ current, max, showLabel = true, size = 'md' }: HealthBarProps) {
  const pct = (current / max) * 100;
  const heightClass = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-5' : 'h-3';
  const color = pct > 60 ? '#22c55e' : pct > 30 ? '#eab308' : '#ef4444';

  return (
    <div className="flex items-center gap-2 w-full">
      {showLabel && (
        <div className="flex items-center gap-1 min-w-fit">
          <Heart size={size === 'sm' ? 12 : 16} fill={color} color={color} />
          <span className="text-sm font-semibold" style={{ color }}>
            {current}/{max}
          </span>
        </div>
      )}
      <div className={`flex-1 ${heightClass} rounded-full health-bar-bg overflow-hidden`}>
        <div
          className={`${heightClass} rounded-full transition-all duration-500`}
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}

interface HeartDisplayProps {
  current: number;
  max: number;
}

export function HeartDisplay({ current, max }: HeartDisplayProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <Heart
          key={i}
          size={20}
          fill={i < current ? '#ef4444' : '#333'}
          color={i < current ? '#ef4444' : '#555'}
          className={i < current ? 'drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]' : ''}
        />
      ))}
    </div>
  );
}
