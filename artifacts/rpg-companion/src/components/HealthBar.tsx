import { Heart } from 'lucide-react';
import React from 'react';

interface HealthBarProps {
  current: number;
  max: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onDecrease?: () => void;
  onIncrease?: () => void;
}

export default function HealthBar({ current, max, showLabel = true, size = 'md', onDecrease, onIncrease }: HealthBarProps) {
  const pct = max > 0 ? (current / max) * 100 : 0;
  const heightClass = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-5' : 'h-3';
  const color = pct > 60 ? '#22c55e' : pct > 30 ? '#eab308' : '#ef4444';
  const isClickable = !!(onDecrease || onIncrease);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isClickable) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      onDecrease?.();
    } else {
      onIncrease?.();
    }
  };

  return (
    <div
      className={`flex items-center gap-2 w-full ${isClickable ? 'cursor-pointer select-none' : ''}`}
      onClick={isClickable ? handleClick : undefined}
      title={isClickable ? 'Toque na metade esquerda para -1 vida, direita para +1 vida' : undefined}
    >
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
  onDecrease?: () => void;
  onIncrease?: () => void;
}

export function HeartDisplay({ current, max, onDecrease, onIncrease }: HeartDisplayProps) {
  const isClickable = !!(onDecrease || onIncrease);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isClickable) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      onDecrease?.();
    } else {
      onIncrease?.();
    }
  };

  return (
    <div
      className={`flex items-center gap-1 ${isClickable ? 'cursor-pointer select-none' : ''}`}
      onClick={isClickable ? handleClick : undefined}
      title={isClickable ? 'Toque na metade esquerda para -1 vida, direita para +1 vida' : undefined}
    >
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
