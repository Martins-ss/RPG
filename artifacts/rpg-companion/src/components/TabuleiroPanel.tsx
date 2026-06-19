import { useState, useCallback } from 'react';
import { RotateCcw, BookOpen, User, Trash2 } from 'lucide-react';
import { PhaseName, BoardCellType, Player, PlayerClass } from '../types';
import Modal from './Modal';
import { CLASS_INFO, CLASS_CARDS } from '../gameData';
import { v4 as uuidv4 } from 'uuid';

// ─── Storage ────────────────────────────────────────────────────────────────

const HISTORY_KEY = 'reino-rei-sombrio-tabuleiro-historico';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CellEvent {
  id: string;
  cellId: number;
  phase: PhaseName;
  type: BoardCellType;
  content: string;
  description: string;
  reward?: string;
  penalty?: string;
  timestamp: number;
}

interface PlayerHistory {
  playerId: string;
  playerName: string;
  playerClass: string;
  events: CellEvent[];
}

type PlayerHistories = Record<string, PlayerHistory>;

// ─── Phase definitions ───────────────────────────────────────────────────────

const PHASE_DEFS: { name: PhaseName; emoji: string; color: string; cells: number; range: [number, number] }[] = [
  { name: 'Floresta das Sombras',   emoji: '🌲', color: '#16a34a', cells: 24, range: [1, 24] },
  { name: 'Cidade Abandonada',      emoji: '🏚️', color: '#d97706', cells: 17, range: [25, 41] },
  { name: 'Castelo do Rei Sombrio', emoji: '🏰', color: '#dc2626', cells: 27, range: [42, 68] },
];

// ─── Event pools ─────────────────────────────────────────────────────────────

const CELL_CONTENT: Record<PhaseName, Record<BoardCellType, { content: string; description: string; reward?: string; penalty?: string }[]>> = {
  'Floresta das Sombras': {
    vazia:     [{ content: 'Caminho Livre', description: 'O caminho está limpo. Avance sem perigos.' },
                { content: 'Clareira Segura', description: 'Uma clareira tranquila na floresta sombria.' }],
    armadilha: [{ content: 'Teia de Aranha', description: 'Uma imensa teia cobre o caminho!', penalty: '-1 vida ao jogador que pisar' },
                { content: 'Raízes Vivas', description: 'As raízes se movem e tentam prender os pés.', penalty: 'Perde 1 turno' },
                { content: 'Esporos Tóxicos', description: 'Cogumelos liberam esporos venenosos.', penalty: '-1 vida a todos' }],
    carta:     [{ content: 'Carta da Floresta', description: 'Uma carta mágica encontrada numa árvore oca.', reward: 'Carta x1' }],
    tesouro:   [{ content: 'Baú Sombrio', description: 'Um baú escondido sob uma raiz.', reward: 'Item Raro + 20 Ouro' },
                { content: 'Ninho de Aranha', description: 'Um ninho abandonado com brilhos de cristal.', reward: 'Cristal x2' }],
    ouro:      [{ content: 'Moedas Escondidas', description: 'Moedas antigas escondidas entre folhas.', reward: '+15 Ouro' },
                { content: 'Bolsa Perdida', description: 'Uma bolsa de aventureiro caído.', reward: '+25 Ouro' }],
    cristal:   [{ content: 'Cristal Vermelho', description: 'Pulsa com energia sombria nas raízes.', reward: 'Cristal Pequeno x1' }],
    monstro:   [{ content: 'Aranha Sombria', description: 'Uma aranha enorme bloqueia o caminho!', penalty: 'Combate! -1 vida (pode ser evitado)' },
                { content: 'Enxame de Besouros', description: 'Besouros negros cobrem tudo ao redor!', penalty: '-1 vida a todos os jogadores adjacentes' }],
    especial:  [{ content: '🌟 Portal Mágico', description: 'Um portal brilhante abre caminho para uma área secreta!', reward: 'Avance 2 casas + Item Épico' },
                { content: '🌿 Fonte Sagrada', description: 'Uma fonte de água cristalina restaura as forças.', reward: '+2 vida ao grupo inteiro' }],
  },
  'Cidade Abandonada': {
    vazia:     [{ content: 'Rua Vazia', description: 'As ruas da cidade estão desertas e silenciosas.' },
                { content: 'Prédio em Ruínas', description: 'Apenas escombros restaram do que foi um dia glorioso.' }],
    armadilha: [{ content: 'Piso Desmoronante', description: 'O piso cede sob o peso dos aventureiros!', penalty: '-1 vida ao jogador da frente' },
                { content: 'Emboscada de Escorpiões', description: '🦂 Escorpiões saem das sombras!', penalty: '-1 vida + veneno (1 dano/rodada)' },
                { content: 'Portão Selado', description: 'Um portão mágico bloqueia a passagem.', penalty: 'Perde 2 turnos para abrir' },
                { content: 'Veneno no Ar', description: 'O ar cheira a enxofre e podridão.', penalty: '-1 vida a todos' }],
    carta:     [{ content: 'Carta Antiga', description: 'Uma carta encontrada nas ruínas da cidade.', reward: 'Carta x1' }],
    tesouro:   [{ content: 'Cofre do Mercador', description: 'O cofre de um rico mercador que tentou fugir.', reward: 'Item Épico + 50 Ouro' },
                { content: 'Armaria Saqueada', description: 'Ainda restam armas de qualidade.', reward: 'Item Raro x2' }],
    ouro:      [{ content: 'Saque das Ruínas', description: 'Ouro espalhado entre os escombros.', reward: '+30 Ouro' },
                { content: 'Cofre Arrombado', description: 'Alguém chegou antes, mas deixou algumas moedas.', reward: '+40 Ouro' }],
    cristal:   [{ content: 'Cristal Médio', description: 'Cristais vermelhos incrustados nas paredes.', reward: 'Cristal Médio x2' }],
    monstro:   [{ content: '🦂 Escorpião Gigante', description: 'Um escorpião do tamanho de um cavalo aparece!', penalty: 'Combate! -1 vida' },
                { content: 'Patrulha Sombria', description: 'Soldados corrompidos patrulham a área.', penalty: '-2 vida ao grupo ou recuar 1 casa' }],
    especial:  [{ content: '🏛️ Biblioteca Secreta', description: 'Uma biblioteca escondida com conhecimentos proibidos!', reward: 'Carta Lendária x1 + XP extra' },
                { content: '⚗️ Laboratório do Alquimista', description: 'Poções e ingredientes mágicos ainda intactos.', reward: 'Poção de Cura x2 + Cristal x1' }],
  },
  'Castelo do Rei Sombrio': {
    vazia:     [{ content: 'Corredor Sombrio', description: 'Um corredor infinito com tochas que nunca se apagam.' },
                { content: 'Sala Vazia', description: 'Ecos dos passos do Rei Sombrio ainda ressoam aqui.' }],
    armadilha: [{ content: 'Cristal Explosivo', description: 'Um cristal instável no chão!', penalty: '-2 vida a todos ao redor' },
                { content: 'Selo do Rei', description: 'Um sigilo mágico drena a energia vital.', penalty: '-1 vida por turno enquanto na sala' },
                { content: 'Espelhos da Ilusão', description: 'Os espelhos criam cópias dos inimigos!', penalty: 'Combate duplo: -2 vida total' },
                { content: 'Trono Amaldiçoado', description: 'Uma força invisível empurra para o trono.', penalty: '-2 vida ao jogador mais próximo' },
                { content: 'Corredor Final', description: 'O último teste antes do Boss!', penalty: '-3 vida possível (role dado)' }],
    carta:     [{ content: 'Carta do Castelo', description: 'Uma carta rara encontrada nos aposentos do Rei.', reward: 'Carta x1' }],
    tesouro:   [{ content: 'Tesouro do Rei', description: 'O tesouro pessoal do Rei Sombrio!', reward: 'Item Mítico + 100 Ouro + Cristal x5' },
                { content: 'Câmara Secreta', description: 'Uma câmara oculta atrás de um espelho.', reward: 'Item Lendário x1 + Cristal Grande x3' }],
    ouro:      [{ content: 'Câmara do Tesouro', description: 'Pilhas de ouro negro do reino corrompido.', reward: '+75 Ouro' },
                { content: 'Oferendas ao Rei', description: 'Tributos acumulados por séculos.', reward: '+100 Ouro' }],
    cristal:   [{ content: 'Cristal Grande', description: 'Cristais imensos pulsando com poder infinito.', reward: 'Cristal Grande x5' }],
    monstro:   [{ content: 'Servo do Rei Sombrio', description: 'Um servo incorruptível defende o castelo!', penalty: 'Combate intenso! -2 vida ou fuga com -3 turnos' },
                { content: 'Guarda da Torre', description: 'O mais temido dos guardas do Rei!', penalty: '-3 vida ao grupo ou custo alto para passar' }],
    especial:  [{ content: '👑 Sala do Trono', description: 'A sala do trono do Rei Sombrio aguarda...', reward: 'Desafio especial: vencer = Item Mítico!' },
                { content: '🔮 Orbe do Destino', description: 'O orbe do Rei revela os segredos do reino.', reward: 'Revelar 3 casas + XP enorme' }],
  },
};

// Type weights per phase
const TYPE_POOL: Record<PhaseName, BoardCellType[]> = {
  'Floresta das Sombras':   ['vazia','vazia','armadilha','armadilha','armadilha','monstro','monstro','ouro','ouro','carta','carta','tesouro','cristal','especial'],
  'Cidade Abandonada':      ['vazia','armadilha','armadilha','armadilha','monstro','monstro','ouro','ouro','carta','carta','tesouro','cristal','especial'],
  'Castelo do Rei Sombrio': ['armadilha','armadilha','armadilha','armadilha','monstro','monstro','monstro','ouro','ouro','carta','carta','tesouro','cristal','especial','vazia'],
};

const CELL_TYPE_ICON: Record<BoardCellType, string> = {
  vazia:'⬜', armadilha:'⚠️', carta:'🃏', tesouro:'💎', ouro:'💰', cristal:'🔮', monstro:'👹', especial:'🌟',
};

const CELL_TYPE_COLOR: Record<BoardCellType, string> = {
  vazia:'#4b5563', armadilha:'#f59e0b', carta:'#8b5cf6', tesouro:'#3b82f6',
  ouro:'#eab308', cristal:'#ec4899', monstro:'#ef4444', especial:'#f97316',
};

// ─── Event generator ─────────────────────────────────────────────────────────

function generateEvent(cellId: number, phase: PhaseName, playerClass?: PlayerClass): CellEvent {
  const pool = TYPE_POOL[phase];
  const type = pool[Math.floor(Math.random() * pool.length)];

  let content: string;
  let description: string;
  let reward: string | undefined;
  let penalty: string | undefined;

  if (type === 'carta' && playerClass && CLASS_CARDS[playerClass]) {
    // Draw a class-specific card for the active player
    const cards = CLASS_CARDS[playerClass];
    const card = cards[Math.floor(Math.random() * cards.length)];
    content = card.name;
    description = card.description;
    reward = `🃏 Carta de ${playerClass}: "${card.name}"`;
  } else {
    const options = CELL_CONTENT[phase][type];
    const pick = options[Math.floor(Math.random() * options.length)];
    content = pick.content;
    description = pick.description;
    reward = pick.reward;
    penalty = pick.penalty;
  }

  return { id: uuidv4(), cellId, phase, type, content, description, reward, penalty, timestamp: Date.now() };
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadHistories(): PlayerHistories {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return {};
}

function saveHistories(h: PlayerHistories) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch {}
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Component ───────────────────────────────────────────────────────────────

interface TabuleiroProps {
  players: Player[];
}

export default function TabuleiroPanel({ players }: TabuleiroProps) {
  const [activePlayerId, setActivePlayerId] = useState<string | null>(
    players.length > 0 ? players[0].id : null
  );
  const [openEvent, setOpenEvent] = useState<CellEvent | null>(null);
  const [playerHistories, setPlayerHistories] = useState<PlayerHistories>(loadHistories);
  const [showHistory, setShowHistory] = useState(false);
  const [historyFor, setHistoryFor] = useState<string | null>(null);

  const activePlayer = players.find(p => p.id === activePlayerId);

  const handleCellClick = useCallback((cellId: number, phase: PhaseName) => {
    // Generate a new random event, optionally using the player's class for carta events
    const event = generateEvent(cellId, phase, activePlayer?.playerClass as PlayerClass | undefined);

    // Save to the active player's history
    if (activePlayerId && activePlayer) {
      setPlayerHistories(prev => {
        const existing = prev[activePlayerId] ?? {
          playerId: activePlayerId,
          playerName: activePlayer.name,
          playerClass: activePlayer.playerClass,
          events: [],
        };
        const updated: PlayerHistory = {
          ...existing,
          events: [event, ...existing.events].slice(0, 200),
        };
        const next = { ...prev, [activePlayerId]: updated };
        saveHistories(next);
        return next;
      });
    }

    setOpenEvent(event);
  }, [activePlayerId, activePlayer]);

  const handleCloseEvent = useCallback(() => {
    // Discard the current event — cell returns to ❓
    setOpenEvent(null);
  }, []);

  const handleClearHistory = useCallback((playerId: string) => {
    setPlayerHistories(prev => {
      const next = { ...prev };
      if (next[playerId]) next[playerId] = { ...next[playerId], events: [] };
      saveHistories(next);
      return next;
    });
  }, []);

  // Build display cells from phase definitions
  const displayCells = PHASE_DEFS.flatMap(phase =>
    Array.from({ length: phase.cells }, (_, i) => ({
      id: phase.range[0] + i,
      phase: phase.name,
    }))
  );

  return (
    <div className="space-y-4 animate-fadeIn">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-red-400" style={{ fontFamily: 'Cinzel, serif' }}>
          🗺️ Tabuleiro de Exploração
        </h2>
        <button
          onClick={() => { setShowHistory(true); setHistoryFor(activePlayerId); }}
          className="btn-dark px-3 py-1.5 rounded-lg text-xs text-amber-400 flex items-center gap-1"
        >
          <BookOpen size={13} /> Histórico
        </button>
      </div>

      {/* Player selector */}
      <div className="card-dark rounded-xl p-3">
        <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <User size={10} /> Quem está abrindo as casas?
        </label>
        {players.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum jogador cadastrado. Adicione jogadores na aba "Jogadores".</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {players.map(p => {
              const info = CLASS_INFO[p.playerClass] || { emoji: '❓', color: '#9ca3af' };
              const isActive = activePlayerId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePlayerId(p.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: isActive ? `${info.color}20` : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${isActive ? info.color + '60' : 'rgba(255,255,255,0.08)'}`,
                    color: isActive ? info.color : '#9ca3af',
                  }}
                >
                  <span>{info.emoji}</span>
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        )}
        {activePlayer && (
          <p className="text-[10px] text-gray-600 mt-2">
            Toque em qualquer casa para sortear um evento para{' '}
            <span style={{ color: CLASS_INFO[activePlayer.playerClass]?.color ?? '#9ca3af' }}>
              {activePlayer.name}
            </span>{' '}
            ({activePlayer.playerClass}). Cartas serão da classe do jogador.
          </p>
        )}
      </div>

      {/* Board grid */}
      <div className="space-y-5">
        {PHASE_DEFS.map(phase => {
          const phaseCells = displayCells.filter(c => c.phase === phase.name);
          return (
            <div key={phase.name} className="card-dark rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <span className="text-2xl">{phase.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-sm font-bold" style={{ color: phase.color, fontFamily: 'Cinzel, serif' }}>
                    {phase.name}
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    {phase.cells} casas — Níveis {phase.range[0]}–{phase.range[1]}
                  </p>
                </div>
              </div>

              <div className="p-3 grid grid-cols-6 gap-2">
                {phaseCells.map(cell => (
                  <button
                    key={cell.id}
                    onClick={() => handleCellClick(cell.id, cell.phase as PhaseName)}
                    className="relative aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-opacity active:opacity-70"
                    style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span className="text-base leading-none">❓</span>
                    <span className="text-[9px] font-bold text-gray-600">{cell.id}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="card-dark rounded-xl p-3">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Legenda de Eventos</h4>
        <div className="grid grid-cols-4 gap-x-3 gap-y-1.5">
          {(Object.entries(CELL_TYPE_ICON) as [BoardCellType, string][]).map(([type, icon]) => (
            <div key={type} className="flex items-center gap-1.5 text-[10px]">
              <span>{icon}</span>
              <span style={{ color: CELL_TYPE_COLOR[type] }}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Event Modal ─── */}
      <Modal isOpen={!!openEvent} onClose={handleCloseEvent} title={openEvent ? `Casa #${openEvent.cellId}` : ''} size="sm">
        {openEvent && (
          <div className="space-y-4">
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{
                background: `${PHASE_DEFS.find(p => p.name === openEvent.phase)?.color ?? '#dc2626'}15`,
                border: `1px solid ${PHASE_DEFS.find(p => p.name === openEvent.phase)?.color ?? '#dc2626'}30`,
              }}
            >
              <span className="text-3xl">{CELL_TYPE_ICON[openEvent.type]}</span>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">
                  {PHASE_DEFS.find(p => p.name === openEvent.phase)?.emoji} {openEvent.phase}
                </div>
                <div className="text-base font-bold text-gray-100">{openEvent.content}</div>
                <div
                  className="text-[10px] px-1.5 py-0.5 rounded inline-block mt-1 font-medium"
                  style={{ color: CELL_TYPE_COLOR[openEvent.type], background: `${CELL_TYPE_COLOR[openEvent.type]}18` }}
                >
                  {openEvent.type.charAt(0).toUpperCase() + openEvent.type.slice(1)}
                  {openEvent.type === 'carta' && activePlayer ? ` — ${activePlayer.playerClass}` : ''}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">{openEvent.description}</p>

            {openEvent.reward && (
              <div className="p-3 rounded-lg bg-yellow-900/10 border border-yellow-800/30">
                <p className="text-xs font-bold text-yellow-400 mb-1">✨ Recompensa</p>
                <p className="text-sm text-gray-300">{openEvent.reward}</p>
              </div>
            )}

            {openEvent.penalty && (
              <div className="p-3 rounded-lg bg-red-900/10 border border-red-800/30">
                <p className="text-xs font-bold text-red-400 mb-1">⚠️ Penalidade</p>
                <p className="text-sm text-gray-300">{openEvent.penalty}</p>
              </div>
            )}

            {activePlayer && (
              <p className="text-[10px] text-gray-600 text-center">
                Registrado no histórico de {activePlayer.name}
              </p>
            )}

            <button onClick={handleCloseEvent}
              className="w-full btn-dark px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-300">
              Fechar — A casa volta a ficar oculta
            </button>
          </div>
        )}
      </Modal>

      {/* ─── History Modal ─── */}
      <Modal isOpen={showHistory} onClose={() => setShowHistory(false)} title="📜 Histórico de Exploração" size="md">
        <div className="space-y-4">
          {/* Player tabs */}
          {players.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {players.map(p => {
                const info = CLASS_INFO[p.playerClass] || { emoji: '❓', color: '#9ca3af' };
                const isSelected = historyFor === p.id;
                const count = playerHistories[p.id]?.events.length ?? 0;
                return (
                  <button key={p.id} onClick={() => setHistoryFor(p.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: isSelected ? `${info.color}20` : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${isSelected ? info.color + '60' : 'rgba(255,255,255,0.08)'}`,
                      color: isSelected ? info.color : '#9ca3af',
                    }}>
                    {info.emoji} {p.name}
                    {count > 0 && (
                      <span className="ml-1 px-1 py-0.5 rounded text-[9px]" style={{ background: `${info.color}30` }}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* History list */}
          {(() => {
            if (!historyFor) {
              return (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">👆</div>
                  <p className="text-gray-500 text-sm">Selecione um jogador acima para ver seu histórico.</p>
                </div>
              );
            }
            const history = playerHistories[historyFor];
            const player = players.find(p => p.id === historyFor);
            const info = player ? CLASS_INFO[player.playerClass] : null;

            if (!history || history.events.length === 0) {
              return (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🗺️</div>
                  <p className="text-gray-500 text-sm">
                    {player?.name ?? 'Este jogador'} ainda não explorou nenhuma casa.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">
                    {info?.emoji} {history.playerName} — {history.events.length} evento{history.events.length !== 1 ? 's' : ''}
                  </span>
                  <button onClick={() => handleClearHistory(historyFor)}
                    className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-red-400 transition-colors px-2 py-1 rounded">
                    <Trash2 size={10} /> Limpar
                  </button>
                </div>
                {history.events.map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-black/20">
                    <span className="text-lg shrink-0">{CELL_TYPE_ICON[entry.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-200">Casa #{entry.cellId}</span>
                        <span className="text-[10px] px-1 py-0.5 rounded"
                          style={{ color: CELL_TYPE_COLOR[entry.type], background: `${CELL_TYPE_COLOR[entry.type]}15` }}>
                          {entry.type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300 mt-0.5">{entry.content}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5">
                        {PHASE_DEFS.find(p => p.name === entry.phase)?.emoji} {entry.phase} · {formatTime(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </Modal>
    </div>
  );
}
