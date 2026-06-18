import { useState } from 'react';
import { Lock, Unlock, AlertTriangle, Skull, Users } from 'lucide-react';
import { Player } from '../types';
import { PHASES, getPhaseForLevel } from '../gameData';
import Modal from './Modal';

interface PhasesPanelProps {
  players: Player[];
  addLog: (message: string, type: 'info' | 'combat' | 'reward' | 'level' | 'death' | 'boss' | 'trap') => void;
}

export default function PhasesPanel({ players, addLog }: PhasesPanelProps) {
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);
  const [showTrapModal, setShowTrapModal] = useState<{ phaseIdx: number; trapIdx: number } | null>(null);
  const [selectedPlayersForTrap, setSelectedPlayersForTrap] = useState<string[]>([]);

  const handleTrapApply = () => {
    if (!showTrapModal) return;
    const phase = PHASES[showTrapModal.phaseIdx];
    if (!phase) { console.error('[PhasesPanel] Fase não encontrada:', showTrapModal.phaseIdx); return; }
    const trap = phase.traps[showTrapModal.trapIdx];
    if (!trap) { console.error('[PhasesPanel] Armadilha não encontrada:', showTrapModal.trapIdx); return; }
    console.log(`[PhasesPanel] Aplicando armadilha: ${trap} em ${selectedPlayersForTrap.length} jogadores`);
    selectedPlayersForTrap.forEach(pid => {
      const player = players.find(p => p.id === pid);
      if (player) addLog(`⚠️ ${player.name} ativou armadilha: ${trap} (${phase.emoji} ${phase.name})`, 'trap');
    });
    setShowTrapModal(null);
    setSelectedPlayersForTrap([]);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <h2 className="text-xl font-bold text-red-400" style={{ fontFamily: 'Cinzel, serif' }}>
        🗺️ Fases do Reino
      </h2>

      <div className="space-y-4">
        {PHASES.map((phase, idx) => {
          const playersInPhase = players.filter(p => {
            const pp = getPhaseForLevel(p.level);
            return pp?.name === phase.name;
          });
          const isExpanded = selectedPhase === idx;

          return (
            <div key={phase.name} className="card-dark rounded-xl overflow-hidden">
              <button
                onClick={() => setSelectedPhase(isExpanded ? null : idx)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
                    style={{ background: `${phase.color}15`, border: `1px solid ${phase.color}30` }}>
                    {phase.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold" style={{ color: phase.color, fontFamily: 'Cinzel, serif' }}>
                        {phase.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500">Níveis {phase.levelRange[0]}–{phase.levelRange[1]}</span>
                      <span className="text-xs flex items-center gap-1" style={{ color: phase.color }}>
                        <Users size={12} /> {playersInPhase.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{phase.description}</p>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 animate-slideIn">
                  <div className="p-3 rounded-lg bg-black/20">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{phase.monster.emoji}</span>
                      <h4 className="text-sm font-bold text-gray-200">Monstro: {phase.monster.name}</h4>
                    </div>
                    <p className="text-xs text-gray-500">{phase.monster.description}</p>
                  </div>

                  <div className="p-3 rounded-lg" style={{ background: `${phase.color}10`, border: `1px solid ${phase.color}20` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Skull size={16} style={{ color: phase.color }} />
                      <h4 className="text-sm font-bold" style={{ color: phase.color }}>Boss: {phase.boss.name}</h4>
                    </div>
                    <p className="text-xs text-gray-500">Vida: {phase.boss.maxHealth} | {phase.boss.ability}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <AlertTriangle size={12} /> Armadilhas
                    </h4>
                    <div className="space-y-1.5">
                      {phase.traps.map((trap, trapIdx) => (
                        <button
                          key={trapIdx}
                          onClick={() => { setShowTrapModal({ phaseIdx: idx, trapIdx }); setSelectedPlayersForTrap([]); }}
                          className="w-full text-left p-2.5 rounded-lg bg-black/20 hover:bg-black/30 transition-colors flex items-center gap-2"
                        >
                          <span className="text-amber-500">⚠️</span>
                          <span className="text-xs text-gray-400 flex-1">{trap}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {playersInPhase.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Users size={12} /> Jogadores nesta fase
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {playersInPhase.map(p => (
                          <span key={p.id} className="text-xs px-2 py-1 rounded-lg bg-black/30 text-gray-300">
                            {p.name} (Nv.{p.level})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-black/20 text-xs text-gray-500">
                    {idx === 0 ? (
                      <><Unlock size={14} className="text-green-500" /><span>Fase inicial — acesso livre a partir do nível 1</span></>
                    ) : (
                      <><Lock size={14} className="text-amber-500" /><span>Desbloqueada no nível {phase.levelRange[0]}</span></>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal isOpen={!!showTrapModal} onClose={() => setShowTrapModal(null)} title="⚠️ Aplicar Armadilha" size="sm">
        {showTrapModal && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-900/10 border border-amber-800/20">
              <p className="text-sm text-amber-300">{PHASES[showTrapModal.phaseIdx].traps[showTrapModal.trapIdx]}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Selecionar jogadores afetados:</label>
              <div className="space-y-1.5">
                {players.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlayersForTrap(prev =>
                      prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                    )}
                    className={`w-full text-left p-2 rounded-lg text-sm transition-colors flex items-center gap-2
                      ${selectedPlayersForTrap.includes(p.id) ? 'bg-amber-900/20 text-amber-300' : 'bg-black/20 text-gray-400'}`}
                  >
                    <span>{selectedPlayersForTrap.includes(p.id) ? '☑️' : '⬜'}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleTrapApply}
              disabled={selectedPlayersForTrap.length === 0}
              className="w-full btn-red px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40"
            >
              Registrar Armadilha
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
