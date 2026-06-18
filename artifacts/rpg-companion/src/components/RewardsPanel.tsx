import { useState } from 'react';
import { Send, ChevronDown, Trash2 } from 'lucide-react';
import { Player, PhaseName, InventoryItem } from '../types';
import { PHASES, REWARD_TEMPLATES, getRarityColor, getRarityBg, getItemEmoji } from '../gameData';
import Modal from './Modal';

interface RewardsPanelProps {
  players: Player[];
  addItemToPlayer: (playerId: string, item: Omit<InventoryItem, 'id'>) => void;
  removeItemFromPlayer: (playerId: string, itemId: string) => void;
}

export default function RewardsPanel({ players, addItemToPlayer, removeItemFromPlayer }: RewardsPanelProps) {
  const [selectedPhase, setSelectedPhase] = useState<PhaseName>('Floresta das Sombras');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [showGiveModal, setShowGiveModal] = useState<Omit<InventoryItem, 'id'> | null>(null);
  const [showInventory, setShowInventory] = useState<string | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customItem, setCustomItem] = useState({
    name: '',
    type: 'item' as InventoryItem['type'],
    rarity: 'Comum' as InventoryItem['rarity'],
    quantity: 1,
    description: '',
  });

  const handleGiveReward = (item: Omit<InventoryItem, 'id'>) => {
    console.log(`[RewardsPanel] Dando item: ${item.name} para ${selectedPlayers.length} jogadores`);
    if (selectedPlayers.length === 0) {
      if (players.length === 0) { console.warn('[RewardsPanel] Não há jogadores para dar recompensas'); return; }
      setShowGiveModal(item);
      return;
    }
    selectedPlayers.forEach(pid => addItemToPlayer(pid, item));
    setSelectedPlayers([]);
  };

  const handleGiveToSelected = () => {
    if (!showGiveModal) return;
    selectedPlayers.forEach(pid => addItemToPlayer(pid, showGiveModal));
    setShowGiveModal(null);
    setSelectedPlayers([]);
  };

  const handleGiveCustom = () => {
    if (!customItem.name.trim() || selectedPlayers.length === 0) return;
    const item: Omit<InventoryItem, 'id'> = { ...customItem, phase: selectedPhase };
    selectedPlayers.forEach(pid => addItemToPlayer(pid, item));
    setCustomItem({ name: '', type: 'item', rarity: 'Comum', quantity: 1, description: '' });
    setShowCustomModal(false);
    setSelectedPlayers([]);
  };

  const togglePlayer = (id: string) => {
    setSelectedPlayers(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedPlayers.length === players.length) setSelectedPlayers([]);
    else setSelectedPlayers(players.map(p => p.id));
  };

  const rewards = REWARD_TEMPLATES[selectedPhase] || [];

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-red-400" style={{ fontFamily: 'Cinzel, serif' }}>🎁 Recompensas</h2>
        <button onClick={() => setShowCustomModal(true)} className="btn-red px-3 py-1.5 rounded-lg text-xs font-medium">
          + Item Custom
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {PHASES.map(phase => (
          <button
            key={phase.name}
            onClick={() => setSelectedPhase(phase.name)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0
              ${selectedPhase === phase.name ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            style={{
              background: selectedPhase === phase.name ? `${phase.color}25` : 'rgba(0,0,0,0.2)',
              border: `1px solid ${selectedPhase === phase.name ? phase.color + '50' : 'rgba(255,255,255,0.05)'}`,
            }}
          >
            {phase.emoji} {phase.name}
          </button>
        ))}
      </div>

      {players.length === 0 ? (
        <div className="card-dark rounded-xl p-4 text-center">
          <div className="text-2xl mb-2">👥</div>
          <p className="text-sm text-gray-500">Adicione jogadores na aba "Jogadores" para distribuir recompensas.</p>
        </div>
      ) : (
        <div className="card-dark rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Selecionar jogadores para dar recompensa:</span>
            <button onClick={selectAll} className="text-[10px] text-red-400 hover:text-red-300">
              {selectedPlayers.length === players.length ? 'Deselecionar' : 'Selecionar Todos'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {players.map(p => {
              const isSelected = selectedPlayers.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlayer(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5
                    ${isSelected ? 'bg-red-900/30 text-red-300 border border-red-800/50' : 'bg-black/20 text-gray-500 border border-transparent hover:text-gray-300'}`}
                >
                  <span>{isSelected ? '✓' : '○'}</span>
                  {p.name}
                </button>
              );
            })}
          </div>
          {selectedPlayers.length > 0 && (
            <p className="text-[10px] text-green-400 mt-2">
              ✓ {selectedPlayers.length} jogador{selectedPlayers.length > 1 ? 'es' : ''} selecionado{selectedPlayers.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {rewards.map((item, idx) => (
          <div key={idx} className="card-dark rounded-xl p-3 flex items-center gap-3">
            <span className="text-xl">{getItemEmoji(item.type)}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-200">{item.name}</div>
              <p className="text-[10px] text-gray-500 mt-0.5">{item.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: getRarityColor(item.rarity), background: getRarityBg(item.rarity) }}>
                  {item.rarity}
                </span>
                <span className="text-[10px] text-gray-600">x{item.quantity}</span>
              </div>
            </div>
            <button onClick={() => handleGiveReward(item)} className="btn-red px-3 py-2 rounded-lg text-xs flex items-center gap-1 shrink-0">
              <Send size={12} /> Dar
            </button>
          </div>
        ))}
      </div>

      {players.length > 0 && (
        <div className="card-dark rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-300 mb-3" style={{ fontFamily: 'Cinzel, serif' }}>🎒 Inventários dos Jogadores</h3>
          <div className="space-y-2">
            {players.map(player => (
              <div key={player.id}>
                <button
                  onClick={() => setShowInventory(showInventory === player.id ? null : player.id)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-300">{player.name}</span>
                    <span className="text-[10px] text-gray-500">({player.inventory.length} itens)</span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-500 transition-transform ${showInventory === player.id ? 'rotate-180' : ''}`} />
                </button>
                {showInventory === player.id && (
                  <div className="mt-1 space-y-1 pl-2 animate-slideIn">
                    {player.inventory.length === 0 ? (
                      <p className="text-xs text-gray-600 py-2 pl-2">Inventário vazio</p>
                    ) : (
                      player.inventory.map(item => (
                        <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-black/10">
                          <span>{getItemEmoji(item.type)}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-gray-300">{item.name}</span>
                            <span className="text-[10px] ml-1" style={{ color: getRarityColor(item.rarity) }}>({item.rarity})</span>
                            <span className="text-[10px] text-gray-600 ml-1">x{item.quantity}</span>
                          </div>
                          <button onClick={() => removeItemFromPlayer(player.id, item.id)}
                            className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={!!showGiveModal} onClose={() => setShowGiveModal(null)} title="🎁 Dar Recompensa" size="sm">
        {showGiveModal && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-black/20 text-center">
              <span className="text-2xl">{getItemEmoji(showGiveModal.type)}</span>
              <div className="text-sm font-medium text-gray-200 mt-1">{showGiveModal.name}</div>
              <span className="text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block" style={{ color: getRarityColor(showGiveModal.rarity), background: getRarityBg(showGiveModal.rarity) }}>
                {showGiveModal.rarity}
              </span>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Selecionar jogadores:</label>
              <div className="space-y-1.5">
                {players.map(p => (
                  <button
                    key={p.id}
                    onClick={() => togglePlayer(p.id)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition-colors flex items-center gap-2
                      ${selectedPlayers.includes(p.id) ? 'bg-red-900/20 text-red-300' : 'bg-black/20 text-gray-400'}`}
                  >
                    <span>{selectedPlayers.includes(p.id) ? '☑️' : '⬜'}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleGiveToSelected} disabled={selectedPlayers.length === 0}
              className="w-full btn-red px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40">
              Dar para {selectedPlayers.length} jogador{selectedPlayers.length !== 1 ? 'es' : ''}
            </button>
          </div>
        )}
      </Modal>

      <Modal isOpen={showCustomModal} onClose={() => setShowCustomModal(false)} title="✨ Criar Item Personalizado">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nome do Item</label>
            <input
              type="text"
              value={customItem.name}
              onChange={e => setCustomItem(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do item..."
              className="w-full px-3 py-2 rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
              <select
                value={customItem.type}
                onChange={e => setCustomItem(prev => ({ ...prev, type: e.target.value as InventoryItem['type'] }))}
                className="w-full px-3 py-2 rounded-lg text-sm"
              >
                <option value="item">Item</option>
                <option value="ouro">Ouro</option>
                <option value="cristal">Cristal</option>
                <option value="carta">Carta</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Raridade</label>
              <select
                value={customItem.rarity}
                onChange={e => setCustomItem(prev => ({ ...prev, rarity: e.target.value as InventoryItem['rarity'] }))}
                className="w-full px-3 py-2 rounded-lg text-sm"
              >
                <option value="Comum">Comum</option>
                <option value="Raro">Raro</option>
                <option value="Épico">Épico</option>
                <option value="Lendário">Lendário</option>
                <option value="Mítico">Mítico</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Quantidade</label>
            <input
              type="number"
              value={customItem.quantity}
              onChange={e => setCustomItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 rounded-lg text-sm"
              min="1"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
            <textarea
              value={customItem.description}
              onChange={e => setCustomItem(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição do item..."
              className="w-full px-3 py-2 rounded-lg text-sm h-20 resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Dar para:</label>
            <div className="space-y-1.5">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => togglePlayer(p.id)}
                  className={`w-full text-left p-2 rounded-lg text-sm transition-colors flex items-center gap-2
                    ${selectedPlayers.includes(p.id) ? 'bg-red-900/20 text-red-300' : 'bg-black/20 text-gray-400'}`}
                >
                  <span>{selectedPlayers.includes(p.id) ? '☑️' : '⬜'}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleGiveCustom}
            disabled={!customItem.name.trim() || selectedPlayers.length === 0}
            className="w-full btn-red px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40">
            Criar e Dar Item
          </button>
        </div>
      </Modal>
    </div>
  );
}
