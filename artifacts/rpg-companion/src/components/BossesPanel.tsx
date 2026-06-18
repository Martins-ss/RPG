import { useState } from 'react';
import { Skull, Swords, Heart, Gift, BookOpen, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Player } from '../types';
import { BOSSES, PHASES, getRarityColor, getRarityBg } from '../gameData';
import HealthBar from './HealthBar';
import Modal from './Modal';

interface BossHealthState {
  [bossName: string]: number;
}

interface BossesPanelProps {
  players: Player[];
  addLog: (message: string, type: 'info' | 'combat' | 'reward' | 'level' | 'death' | 'boss' | 'trap') => void;
  adjustHealth: (id: string, amount: number) => void;
  bossHealths: BossHealthState;
  adjustBossHealth: (bossName: string, amount: number, maxHealth: number) => void;
  resetBossHealth: (bossName: string, maxHealth: number) => void;
}

export default function BossesPanel({ players, addLog, adjustHealth, bossHealths, adjustBossHealth, resetBossHealth }: BossesPanelProps) {
  const [selectedBoss, setSelectedBoss] = useState<number | null>(null);
  const [showStory, setShowStory] = useState<number | null>(null);

  const bossAttackAll = (bossName: string) => {
    if (players.length === 0) return;
    players.forEach(p => adjustHealth(p.id, -1));
    addLog(`👑 ${bossName} atacou todos os jogadores! (-1 vida cada)`, 'boss');
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <h2 className="text-xl font-bold text-red-400" style={{ fontFamily: 'Cinzel, serif' }}>
        💀 Chefes do Reino
      </h2>

      <div className="space-y-4">
        {BOSSES.map((boss, idx) => {
          const phase = PHASES.find(p => p.name === boss.phase);
          if (!phase) return null;

          const currentHealth = bossHealths[boss.name] ?? boss.maxHealth;
          const isExpanded = selectedBoss === idx;
          const isDead = currentHealth === 0;

          return (
            <div
              key={boss.name}
              className="card-dark rounded-xl"
              style={{ borderColor: isDead ? 'rgba(34,197,94,0.3)' : `${phase.color}20` }}
            >
              {/* ─── Header: tap here to expand/collapse ─── */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedBoss(isExpanded ? null : idx)}
                onKeyDown={e => e.key === 'Enter' && setSelectedBoss(isExpanded ? null : idx)}
                className="w-full p-4 text-left cursor-pointer flex items-center gap-3 select-none"
              >
                {/* Boss avatar — NO grayscale filter, use opacity only */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0"
                  style={{
                    background: `${phase.color}15`,
                    border: `1px solid ${phase.color}30`,
                    opacity: isDead ? 0.3 : 1,
                  }}
                >
                  {boss.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className={`text-base font-bold ${isDead ? 'line-through text-gray-600' : ''}`}
                      style={{ color: isDead ? undefined : phase.color, fontFamily: 'Cinzel, serif' }}
                    >
                      {boss.name}
                    </h3>
                    {isDead && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/30 text-green-400">
                        DERROTADO
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {phase.emoji} {phase.name} — Níveis {phase.levelRange[0]}–{phase.levelRange[1]}
                  </div>
                </div>

                <div className="text-gray-600 shrink-0">
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {/* ─── Health bar: completely separate from the toggle area ─── */}
              <div
                className="px-4 pb-3"
                onClick={e => e.stopPropagation()}
              >
                <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wider">
                  ← Toque para reduzir / aumentar →
                </p>
                <HealthBar
                  current={currentHealth}
                  max={boss.maxHealth}
                  size="md"
                  onDecrease={() => adjustBossHealth(boss.name, -1, boss.maxHealth)}
                  onIncrease={() => adjustBossHealth(boss.name, 1, boss.maxHealth)}
                />
              </div>

              {/* ─── Expanded content ─── */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">

                  {/* Ability */}
                  <div className="p-3 rounded-lg bg-black/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={14} style={{ color: phase.color }} />
                      <h4 className="text-xs font-bold text-gray-300">Habilidade Especial</h4>
                    </div>
                    <p className="text-xs text-gray-400">{boss.ability}</p>
                  </div>

                  {/* Story button */}
                  <button
                    onClick={e => { e.stopPropagation(); setShowStory(idx); }}
                    className="w-full text-left p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen size={14} className="text-amber-400" />
                      <h4 className="text-xs font-bold text-amber-400">Ver História</h4>
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2">{boss.story}</p>
                  </button>

                  {/* Controls */}
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Swords size={10} /> Controles do Boss
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); adjustBossHealth(boss.name, -1, boss.maxHealth); }}
                        className="btn-dark px-3 py-2 rounded-lg text-xs text-red-400 flex items-center justify-center gap-1"
                      >
                        <Heart size={12} /> -1 Vida
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); adjustBossHealth(boss.name, -3, boss.maxHealth); }}
                        className="btn-dark px-3 py-2 rounded-lg text-xs text-red-400 flex items-center justify-center gap-1"
                      >
                        <Heart size={12} /> -3 Vida
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); adjustBossHealth(boss.name, 1, boss.maxHealth); }}
                        className="btn-dark px-3 py-2 rounded-lg text-xs text-green-400 flex items-center justify-center gap-1"
                      >
                        <Heart size={12} /> +1 Vida
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); adjustBossHealth(boss.name, 3, boss.maxHealth); }}
                        className="btn-dark px-3 py-2 rounded-lg text-xs text-green-400 flex items-center justify-center gap-1"
                      >
                        <Heart size={12} /> +3 Vida
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={e => { e.stopPropagation(); resetBossHealth(boss.name, boss.maxHealth); }}
                        className="btn-dark px-3 py-2 rounded-lg text-xs text-blue-400 flex items-center justify-center gap-1"
                      >
                        🔄 Restaurar
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); bossAttackAll(boss.name); }}
                        disabled={players.length === 0}
                        className="btn-dark px-3 py-2 rounded-lg text-xs text-amber-400 flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Skull size={12} /> Atacar Todos
                      </button>
                    </div>
                  </div>

                  {/* Reward */}
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      background: getRarityBg(boss.reward.rarity),
                      border: `1px solid ${getRarityColor(boss.reward.rarity)}30`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Gift size={14} style={{ color: getRarityColor(boss.reward.rarity) }} />
                      <h4 className="text-xs font-bold" style={{ color: getRarityColor(boss.reward.rarity) }}>
                        Recompensa Única
                      </h4>
                    </div>
                    <div className="text-sm font-medium text-gray-200">{boss.reward.name}</div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{boss.reward.description}</p>
                    <span
                      className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        color: getRarityColor(boss.reward.rarity),
                        background: getRarityBg(boss.reward.rarity),
                      }}
                    >
                      {boss.reward.rarity}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Story modal */}
      <Modal
        isOpen={showStory !== null}
        onClose={() => setShowStory(null)}
        title={showStory !== null ? `📖 ${BOSSES[showStory].name}` : ''}
      >
        {showStory !== null && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-5xl mb-3">{BOSSES[showStory].emoji}</div>
              <h3 className="text-xl font-bold text-red-400" style={{ fontFamily: 'Cinzel, serif' }}>
                {BOSSES[showStory].name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {PHASES.find(p => p.name === BOSSES[showStory].phase)?.emoji} {BOSSES[showStory].phase}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-black/20 text-sm text-gray-300 leading-relaxed" style={{ fontFamily: 'serif' }}>
              {BOSSES[showStory].story}
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-lg bg-black/20">
                <div className="text-lg font-bold text-red-400">{BOSSES[showStory].maxHealth}</div>
                <div className="text-[10px] text-gray-500">Vida Máxima</div>
              </div>
              <div className="p-3 rounded-lg bg-black/20">
                <div className="text-xs text-purple-400 font-medium">
                  {BOSSES[showStory].ability.split('—')[0]}
                </div>
                <div className="text-[10px] text-gray-500">Habilidade</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
