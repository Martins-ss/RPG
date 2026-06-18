import { useState, useRef } from 'react';
import { Plus, Minus, Trash2, Package, ChevronUp, ChevronDown, UserPlus, Zap } from 'lucide-react';
import { Player, PlayerClass } from '../types';
import { CLASS_INFO, getPhaseForLevel } from '../gameData';
import { HeartDisplay } from './HealthBar';
import Modal from './Modal';

interface PlayersPanelProps {
  players: Player[];
  addPlayer: (name: string, playerClass: PlayerClass) => void;
  removePlayer: (id: string) => void;
  adjustHealth: (id: string, amount: number) => void;
  addXP: (id: string, amount: number) => void;
  setLevel: (id: string, level: number) => void;
}

const CLASSES: PlayerClass[] = ['Guerreiro', 'Arqueiro', 'Mago', 'Paladino', 'Assassino'];

export default function PlayersPanel({ players, addPlayer, removePlayer, adjustHealth, addXP, setLevel }: PlayersPanelProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showXPModal, setShowXPModal] = useState<string | null>(null);
  const [showLevelModal, setShowLevelModal] = useState<string | null>(null);
  const [showInventoryId, setShowInventoryId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState<PlayerClass>('Guerreiro');
  const [xpAmount, setXpAmount] = useState('50');
  const [levelValue, setLevelValue] = useState('1');
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    console.log(`[PlayersPanel] Adicionando jogador: ${newName.trim()} (${newClass})`);
    addPlayer(newName.trim(), newClass);
    setNewName('');
    setNewClass('Guerreiro');
    setShowAddModal(false);
  };

  const handleAddXP = (id: string) => {
    const amount = parseInt(xpAmount) || 0;
    if (amount > 0) {
      console.log(`[PlayersPanel] Adicionando ${amount} XP ao jogador ${id}`);
      addXP(id, amount);
      setShowXPModal(null);
      setXpAmount('50');
    }
  };

  const handleSetLevel = (id: string) => {
    const level = parseInt(levelValue) || 1;
    const clampedLevel = Math.max(1, Math.min(68, level));
    console.log(`[PlayersPanel] Definindo nível ${clampedLevel} para jogador ${id}`);
    setLevel(id, clampedLevel);
    setShowLevelModal(null);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-red-400" style={{ fontFamily: 'Cinzel, serif' }}>
          ⚔️ Jogadores ({players.length})
        </h2>
        <button onClick={() => setShowAddModal(true)} className="btn-red px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <UserPlus size={16} /> Adicionar
        </button>
      </div>

      {players.length === 0 ? (
        <div className="card-dark rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">🏰</div>
          <p className="text-gray-400">Nenhum jogador ainda. Adicione aventureiros para começar!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {players.map(player => {
            const classInfo = CLASS_INFO[player.playerClass] || { emoji: '❓', color: '#9ca3af', description: 'Classe desconhecida' };
            const phase = getPhaseForLevel(player.level);
            const isExpanded = expandedPlayer === player.id;
            const xpPct = player.xpToNext > 0 ? (player.xp / player.xpToNext) * 100 : 100;

            return (
              <div key={player.id} className="card-dark rounded-xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
                      style={{ background: `${classInfo.color}15`, border: `1px solid ${classInfo.color}30` }}>
                      {classInfo.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-base font-bold text-gray-100 truncate">{player.name}</h3>
                        {player.health === 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/50 text-red-400">CAÍDO</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${classInfo.color}20`, color: classInfo.color }}>
                          {player.playerClass}
                        </span>
                        <span className="text-xs text-gray-500">Nv. {player.level}</span>
                        {phase && <span className="text-[10px] text-gray-600">{phase.emoji} {phase.name}</span>}
                      </div>
                      <div className="mt-2">
                        <HeartDisplay
                          current={player.health}
                          max={5}
                          onDecrease={() => adjustHealth(player.id, -1)}
                          onIncrease={() => adjustHealth(player.id, 1)}
                        />
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                          <span>XP: {player.xp}/{player.xpToNext}</span>
                          <span>{Math.round(xpPct)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full xp-bar-bg overflow-hidden">
                          <div className="h-full rounded-full xp-bar" style={{ width: `${xpPct}%` }} />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setExpandedPlayer(isExpanded ? null : player.id)}
                      className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-3 space-y-3 animate-slideIn border-t border-red-900/10">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Vida</label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => adjustHealth(player.id, -1)}
                          className="btn-dark px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 text-red-400 hover:text-red-300">
                          <Minus size={14} /> Dano
                        </button>
                        <button onClick={() => adjustHealth(player.id, 1)}
                          className="btn-dark px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 text-green-400 hover:text-green-300">
                          <Plus size={14} /> Curar
                        </button>
                        <button onClick={() => adjustHealth(player.id, 5 - player.health)}
                          className="btn-dark px-3 py-1.5 rounded-lg text-sm text-blue-400 hover:text-blue-300">
                          Full
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Progressão</label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => { setXpAmount('50'); setShowXPModal(player.id); }}
                          className="btn-dark px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 text-purple-400">
                          <Zap size={14} /> Dar XP
                        </button>
                        <button onClick={() => { setLevelValue(String(player.level)); setShowLevelModal(player.id); }}
                          className="btn-dark px-3 py-1.5 rounded-lg text-sm text-yellow-400">
                          Definir Nível
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <button onClick={() => setShowInventoryId(player.id)}
                        className="btn-dark px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 text-amber-400">
                        <Package size={14} /> Inventário ({player.inventory.length})
                      </button>
                      <button onClick={() => setShowDeleteConfirm(player.id)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setNewName(''); setNewClass('Guerreiro'); }} title="Novo Aventureiro">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block">1. Escolha a Classe</label>
            <div className="grid grid-cols-1 gap-2">
              {CLASSES.map(cls => {
                const info = CLASS_INFO[cls];
                const isSelected = newClass === cls;
                return (
                  <button
                    key={cls}
                    onClick={() => {
                      setNewClass(cls);
                      setTimeout(() => nameInputRef.current?.focus(), 50);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all text-left ${isSelected ? 'ring-1' : 'hover:bg-white/5'}`}
                    style={{
                      background: isSelected ? `${info.color}15` : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${isSelected ? info.color + '50' : 'rgba(255,255,255,0.05)'}`,
                    }}
                  >
                    <span className="text-2xl">{info.emoji}</span>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: isSelected ? info.color : '#d1d5db' }}>{cls}</div>
                      <div className="text-[10px] text-gray-500">{info.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">2. Nome do Aventureiro</label>
            <input
              ref={nameInputRef}
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Digite o nome..."
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoComplete="off"
            />
          </div>
          <button onClick={handleAdd} disabled={!newName.trim()}
            className="w-full btn-red px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
            Criar Aventureiro
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!showXPModal} onClose={() => setShowXPModal(null)} title="Conceder XP" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Quantidade de XP</label>
            <input
              type="number"
              value={xpAmount}
              onChange={e => setXpAmount(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              min="1"
              autoFocus
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[25, 50, 100, 200, 500].map(v => (
              <button key={v} onClick={() => setXpAmount(String(v))}
                className="btn-dark px-3 py-1.5 rounded-lg text-xs text-purple-400">
                +{v} XP
              </button>
            ))}
          </div>
          <button onClick={() => showXPModal && handleAddXP(showXPModal)}
            className="w-full btn-red px-4 py-2.5 rounded-lg text-sm font-semibold">
            Conceder XP
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!showLevelModal} onClose={() => setShowLevelModal(null)} title="Definir Nível" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nível (1–68)</label>
            <input
              type="number"
              value={levelValue}
              onChange={e => setLevelValue(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              min="1" max="68"
              autoFocus
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[1, 10, 25, 42, 55, 68].map(v => (
              <button key={v} onClick={() => setLevelValue(String(v))}
                className="btn-dark px-3 py-1.5 rounded-lg text-xs text-yellow-400">
                Nv. {v}
              </button>
            ))}
          </div>
          <button onClick={() => showLevelModal && handleSetLevel(showLevelModal)}
            className="w-full btn-red px-4 py-2.5 rounded-lg text-sm font-semibold">
            Definir Nível
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!showInventoryId} onClose={() => setShowInventoryId(null)} title="🎒 Inventário" size="md">
        {(() => {
          const player = players.find(p => p.id === showInventoryId);
          if (!player) return null;
          if (player.inventory.length === 0) {
            return (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🎒</div>
                <p className="text-gray-500 text-sm">Inventário vazio. Dê recompensas na aba "Recompensas"!</p>
              </div>
            );
          }
          return (
            <div className="space-y-2">
              {player.inventory.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/20">
                  <span className="text-xl">
                    {item.type === 'ouro' ? '💰' : item.type === 'cristal' ? '💎' : item.type === 'carta' ? '🃏' : '✨'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-200">{item.name}</div>
                    <div className="text-[10px] text-gray-500">{item.description}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                        color: item.rarity === 'Comum' ? '#9ca3af' :
                          item.rarity === 'Raro' ? '#3b82f6' :
                          item.rarity === 'Épico' ? '#8b5cf6' :
                          item.rarity === 'Lendário' ? '#f59e0b' : '#ef4444',
                        background: item.rarity === 'Comum' ? 'rgba(156,163,175,0.1)' :
                          item.rarity === 'Raro' ? 'rgba(59,130,246,0.1)' :
                          item.rarity === 'Épico' ? 'rgba(139,92,246,0.1)' :
                          item.rarity === 'Lendário' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      }}>{item.rarity}</span>
                      <span className="text-[10px] text-gray-600">x{item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </Modal>

      <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="⚠️ Remover Jogador" size="sm">
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-400">
            Tem certeza que deseja remover <strong className="text-red-400">{players.find(p => p.id === showDeleteConfirm)?.name}</strong> da aventura?
          </p>
          <p className="text-xs text-gray-600">Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 btn-dark px-4 py-2 rounded-lg text-sm">
              Cancelar
            </button>
            <button onClick={() => { showDeleteConfirm && removePlayer(showDeleteConfirm); setShowDeleteConfirm(null); }}
              className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-300 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-red-800/50">
              Remover
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
