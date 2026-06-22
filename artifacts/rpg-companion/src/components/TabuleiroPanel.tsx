import { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, User, Trash2, Swords } from 'lucide-react';
import { PhaseName, BoardCellType, Player, PlayerClass, BossDefeat } from '../types';
import Modal from './Modal';
import { CLASS_INFO, CLASS_CARDS, BOSSES } from '../gameData';
import { v4 as uuidv4 } from 'uuid';

// ─── Storage ────────────────────────────────────────────────────────────────

const BOARD_V2_KEY = 'reino-rei-sombrio-tabuleiro-v2';
const HISTORY_KEY_LEGACY = 'reino-rei-sombrio-tabuleiro-historico';

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
  bossName?: string;
  timestamp: number;
}

interface PlayerBoardData {
  visitedCells: Record<number, CellEvent>;
  bossCells: Record<string, number>;
}

type BoardStorage = Record<string, PlayerBoardData>;

// ─── Phase definitions ───────────────────────────────────────────────────────

const PHASE_DEFS: { name: PhaseName; emoji: string; color: string; cells: number; range: [number, number] }[] = [
  { name: 'Floresta das Sombras',   emoji: '🌲', color: '#16a34a', cells: 24, range: [1, 24] },
  { name: 'Cidade Abandonada',      emoji: '🏚️', color: '#d97706', cells: 17, range: [25, 41] },
  { name: 'Castelo do Rei Sombrio', emoji: '🏰', color: '#dc2626', cells: 27, range: [42, 68] },
];

// ─── Event pools ─────────────────────────────────────────────────────────────

const CELL_CONTENT: Record<PhaseName, Record<Exclude<BoardCellType,'boss'>, { content: string; description: string; reward?: string; penalty?: string }[]>> = {
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

const TYPE_POOL: Record<PhaseName, Exclude<BoardCellType,'boss'>[]> = {
  'Floresta das Sombras':   ['vazia','vazia','armadilha','armadilha','armadilha','monstro','monstro','ouro','ouro','carta','carta','tesouro','cristal','especial'],
  'Cidade Abandonada':      ['vazia','armadilha','armadilha','armadilha','monstro','monstro','ouro','ouro','carta','carta','tesouro','cristal','especial'],
  'Castelo do Rei Sombrio': ['armadilha','armadilha','armadilha','armadilha','monstro','monstro','monstro','ouro','ouro','carta','carta','tesouro','cristal','especial','vazia'],
};

const CELL_TYPE_ICON: Record<BoardCellType, string> = {
  vazia:'⬜', armadilha:'⚠️', carta:'🃏', tesouro:'💎', ouro:'💰', cristal:'🔮', monstro:'👹', especial:'🌟', boss:'💀',
};

const CELL_TYPE_COLOR: Record<BoardCellType, string> = {
  vazia:'#4b5563', armadilha:'#f59e0b', carta:'#8b5cf6', tesouro:'#3b82f6',
  ouro:'#eab308', cristal:'#ec4899', monstro:'#ef4444', especial:'#f97316', boss:'#dc2626',
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
    const cards = CLASS_CARDS[playerClass];
    const card = cards[Math.floor(Math.random() * cards.length)];
    content = card.name;
    description = card.description;
    reward = `🃏 Carta de ${playerClass}: "${card.name}"`;
  } else {
    const options = CELL_CONTENT[phase][type as Exclude<BoardCellType,'boss'>];
    const pick = options[Math.floor(Math.random() * options.length)];
    content = pick.content;
    description = pick.description;
    reward = pick.reward;
    penalty = pick.penalty;
  }

  return { id: uuidv4(), cellId, phase, type, content, description, reward, penalty, timestamp: Date.now() };
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadBoardStorage(): BoardStorage {
  try {
    const saved = localStorage.getItem(BOARD_V2_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed as BoardStorage;
    }
  } catch {}

  // Migrate from legacy format
  try {
    const legacy = localStorage.getItem(HISTORY_KEY_LEGACY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as Record<string, { playerId: string; playerName: string; events: CellEvent[] }>;
      const migrated: BoardStorage = {};
      for (const [pid, ph] of Object.entries(parsed)) {
        const visitedCells: Record<number, CellEvent> = {};
        const sorted = [...ph.events].sort((a, b) => a.timestamp - b.timestamp);
        for (const ev of sorted) {
          visitedCells[ev.cellId] = ev;
        }
        migrated[pid] = { visitedCells, bossCells: {} };
      }
      return migrated;
    }
  } catch {}

  return {};
}

function saveBoardStorage(storage: BoardStorage) {
  try { localStorage.setItem(BOARD_V2_KEY, JSON.stringify(storage)); } catch {}
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Boss cell assignment ─────────────────────────────────────────────────────

function assignBossCells(
  playerData: PlayerBoardData,
  bossDefeats: Record<string, BossDefeat>
): Record<string, number> {
  const newBossCells: Record<string, number> = {};

  for (const boss of BOSSES) {
    if (bossDefeats[boss.name]) continue;

    const phaseDef = PHASE_DEFS.find(p => p.name === boss.phase);
    if (!phaseDef) continue;

    const visitedIds = new Set(
      Object.keys(playerData.visitedCells).map(k => Number(k))
    );
    const prevCell = playerData.bossCells[boss.name];

    const available: number[] = [];
    for (let i = phaseDef.range[0]; i <= phaseDef.range[1]; i++) {
      if (!visitedIds.has(i) && i !== prevCell) {
        available.push(i);
      }
    }

    if (available.length > 0) {
      newBossCells[boss.name] = available[Math.floor(Math.random() * available.length)];
    } else {
      // Fallback: try without excluding prev cell
      const fallback: number[] = [];
      for (let i = phaseDef.range[0]; i <= phaseDef.range[1]; i++) {
        if (!visitedIds.has(i)) fallback.push(i);
      }
      if (fallback.length > 0) {
        newBossCells[boss.name] = fallback[Math.floor(Math.random() * fallback.length)];
      }
      // else all cells visited — boss has nowhere to go, not assigned
    }
  }

  return newBossCells;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface TabuleiroProps {
  players: Player[];
  bossHealths: Record<string, number>;
  bossDefeats: Record<string, BossDefeat>;
}

export default function TabuleiroPanel({ players, bossHealths, bossDefeats }: TabuleiroProps) {
  const [activePlayerId, setActivePlayerId] = useState<string | null>(
    players.length > 0 ? players[0].id : null
  );
  const [boardStorage, setBoardStorage] = useState<BoardStorage>(loadBoardStorage);
  const [openEvent, setOpenEvent] = useState<CellEvent | null>(null);
  const [openBossName, setOpenBossName] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyFor, setHistoryFor] = useState<string | null>(null);

  const activePlayer = players.find(p => p.id === activePlayerId) ?? null;

  // Track previous player to detect switches vs. first mount
  const prevPlayerRef = useRef<string | null>(null);

  // Reassign boss cells whenever active player changes (or on first mount)
  useEffect(() => {
    if (!activePlayerId) return;

    setBoardStorage(prev => {
      const playerData: PlayerBoardData = prev[activePlayerId] ?? { visitedCells: {}, bossCells: {} };
      const newBossCells = assignBossCells(playerData, bossDefeats);

      const updated: BoardStorage = {
        ...prev,
        [activePlayerId]: {
          ...playerData,
          bossCells: newBossCells,
        },
      };
      saveBoardStorage(updated);
      return updated;
    });

    prevPlayerRef.current = activePlayerId;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlayerId]);

  const activePlayerData = activePlayerId ? (boardStorage[activePlayerId] ?? { visitedCells: {}, bossCells: {} }) : null;

  // Which boss (if any) is hiding in this cell for the active player?
  function getBossAtCell(cellId: number): typeof BOSSES[number] | null {
    if (!activePlayerData) return null;
    for (const boss of BOSSES) {
      if (bossDefeats[boss.name]) continue;
      if (activePlayerData.bossCells[boss.name] === cellId) return boss;
    }
    return null;
  }

  const handleCellClick = useCallback((cellId: number, phase: PhaseName) => {
    if (!activePlayerId || !activePlayer) return;

    const playerData: PlayerBoardData = boardStorage[activePlayerId] ?? { visitedCells: {}, bossCells: {} };

    // Already visited — show the stored event
    if (playerData.visitedCells[cellId]) {
      setOpenEvent(playerData.visitedCells[cellId]);
      return;
    }

    // Check if this is a boss cell
    const bossHere = getBossAtCell(cellId);
    if (bossHere) {
      // Create a boss event and mark cell as visited
      const bossEvent: CellEvent = {
        id: uuidv4(),
        cellId,
        phase,
        type: 'boss',
        content: bossHere.name,
        description: bossHere.story,
        bossName: bossHere.name,
        timestamp: Date.now(),
      };

      setBoardStorage(prev => {
        const pData = prev[activePlayerId] ?? { visitedCells: {}, bossCells: {} };
        const updated: BoardStorage = {
          ...prev,
          [activePlayerId]: {
            ...pData,
            visitedCells: { ...pData.visitedCells, [cellId]: bossEvent },
          },
        };
        saveBoardStorage(updated);
        return updated;
      });

      setOpenBossName(bossHere.name);
      return;
    }

    // Normal unvisited cell — generate event and mark visited
    const event = generateEvent(cellId, phase, activePlayer.playerClass as PlayerClass);

    setBoardStorage(prev => {
      const pData = prev[activePlayerId] ?? { visitedCells: {}, bossCells: {} };
      const updated: BoardStorage = {
        ...prev,
        [activePlayerId]: {
          ...pData,
          visitedCells: { ...pData.visitedCells, [cellId]: event },
        },
      };
      saveBoardStorage(updated);
      return updated;
    });

    setOpenEvent(event);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlayerId, activePlayer, boardStorage]);

  const handleClearHistory = useCallback((playerId: string) => {
    setBoardStorage(prev => {
      const updated: BoardStorage = {
        ...prev,
        [playerId]: { visitedCells: {}, bossCells: {} },
      };
      saveBoardStorage(updated);
      return updated;
    });
  }, []);

  const displayCells = PHASE_DEFS.flatMap(phase =>
    Array.from({ length: phase.cells }, (_, i) => ({
      id: phase.range[0] + i,
      phase: phase.name as PhaseName,
    }))
  );

  // Visited events sorted newest first for history
  function getVisitedEventsForPlayer(playerId: string): CellEvent[] {
    const data = boardStorage[playerId];
    if (!data) return [];
    return Object.values(data.visitedCells).sort((a, b) => b.timestamp - a.timestamp);
  }

  const visitedCount = activePlayerId
    ? Object.keys(boardStorage[activePlayerId]?.visitedCells ?? {}).length
    : 0;

  return (
    <div className="space-y-4 animate-fadeIn">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-red-400" style={{ fontFamily: 'Cinzel, serif' }}>
            🗺️ Tabuleiro de Exploração
          </h2>
          {activePlayer && (
            <p className="text-[10px] text-gray-600 mt-0.5">
              {activePlayer.name}: {visitedCount} casa{visitedCount !== 1 ? 's' : ''} explorada{visitedCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
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
          <User size={10} /> Quem está explorando?
        </label>
        {players.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum jogador cadastrado. Adicione jogadores na aba "Jogadores".</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {players.map(p => {
              const info = CLASS_INFO[p.playerClass] || { emoji: '❓', color: '#9ca3af' };
              const isActive = activePlayerId === p.id;
              const pVisited = Object.keys(boardStorage[p.id]?.visitedCells ?? {}).length;
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
                  {pVisited > 0 && (
                    <span className="text-[9px] px-1 rounded" style={{ background: `${info.color}25` }}>
                      {pVisited}✔
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {activePlayer && (
          <p className="text-[10px] text-gray-600 mt-2">
            Toque em uma casa para explorá-la.{' '}
            <span style={{ color: CLASS_INFO[activePlayer.playerClass]?.color ?? '#9ca3af' }}>
              {activePlayer.name}
            </span>{' '}
            tem progresso salvo neste tabuleiro.
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
                {phaseCells.map(cell => {
                  const visitedEvent = activePlayerData?.visitedCells[cell.id];
                  const bossHere = !visitedEvent ? getBossAtCell(cell.id) : null;

                  let cellIcon: string;
                  let cellBg: string;
                  let cellBorder: string;
                  let cellColor: string;

                  if (visitedEvent) {
                    if (visitedEvent.type === 'boss') {
                      cellIcon = BOSSES.find(b => b.name === visitedEvent.bossName)?.emoji ?? '💀';
                    } else {
                      cellIcon = CELL_TYPE_ICON[visitedEvent.type];
                    }
                    cellBg = `${CELL_TYPE_COLOR[visitedEvent.type]}18`;
                    cellBorder = `1px solid ${CELL_TYPE_COLOR[visitedEvent.type]}45`;
                    cellColor = CELL_TYPE_COLOR[visitedEvent.type];
                  } else if (bossHere) {
                    cellIcon = bossHere.emoji;
                    cellBg = 'rgba(220,38,38,0.18)';
                    cellBorder = '1px solid rgba(220,38,38,0.5)';
                    cellColor = '#dc2626';
                  } else {
                    cellIcon = '❓';
                    cellBg = 'rgba(0,0,0,0.4)';
                    cellBorder = '1px solid rgba(255,255,255,0.06)';
                    cellColor = '#4b5563';
                  }

                  return (
                    <button
                      key={cell.id}
                      onClick={() => handleCellClick(cell.id, cell.phase)}
                      className="relative aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-opacity active:opacity-70"
                      style={{ background: cellBg, border: cellBorder }}
                    >
                      <span className="text-base leading-none">{cellIcon}</span>
                      <span className="text-[9px] font-bold" style={{ color: cellColor }}>{cell.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="card-dark rounded-xl p-3">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Legenda</h4>
        <div className="grid grid-cols-3 gap-x-3 gap-y-1.5">
          {(Object.entries(CELL_TYPE_ICON) as [BoardCellType, string][]).map(([type, icon]) => (
            <div key={type} className="flex items-center gap-1.5 text-[10px]">
              <span>{icon}</span>
              <span style={{ color: CELL_TYPE_COLOR[type] }}>
                {type === 'boss' ? 'Boss' : type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-[10px]">
            <span>❓</span>
            <span className="text-gray-500">Inexplorada</span>
          </div>
        </div>
      </div>

      {/* ─── Event Modal ─── */}
      <Modal isOpen={!!openEvent} onClose={() => setOpenEvent(null)} title={openEvent ? `Casa #${openEvent.cellId}` : ''} size="sm">
        {openEvent && (
          <div className="space-y-4">
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{
                background: `${PHASE_DEFS.find(p => p.name === openEvent.phase)?.color ?? '#dc2626'}15`,
                border: `1px solid ${PHASE_DEFS.find(p => p.name === openEvent.phase)?.color ?? '#dc2626'}30`,
              }}
            >
              <span className="text-3xl">
                {openEvent.type === 'boss'
                  ? (BOSSES.find(b => b.name === openEvent.bossName)?.emoji ?? '💀')
                  : CELL_TYPE_ICON[openEvent.type]}
              </span>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">
                  {PHASE_DEFS.find(p => p.name === openEvent.phase)?.emoji} {openEvent.phase}
                </div>
                <div className="text-base font-bold text-gray-100">{openEvent.content}</div>
                <div
                  className="text-[10px] px-1.5 py-0.5 rounded inline-block mt-1 font-medium"
                  style={{ color: CELL_TYPE_COLOR[openEvent.type], background: `${CELL_TYPE_COLOR[openEvent.type]}18` }}
                >
                  {openEvent.type === 'boss' ? 'Boss' : openEvent.type.charAt(0).toUpperCase() + openEvent.type.slice(1)}
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

            <button onClick={() => setOpenEvent(null)}
              className="w-full btn-dark px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-300">
              Fechar
            </button>
          </div>
        )}
      </Modal>

      {/* ─── Boss Encounter Modal ─── */}
      <Modal isOpen={!!openBossName} onClose={() => setOpenBossName(null)} title="👹 Boss Encontrado!" size="sm">
        {openBossName && (() => {
          const boss = BOSSES.find(b => b.name === openBossName);
          if (!boss) return null;
          const hp = bossHealths[boss.name] ?? boss.maxHealth;
          const hpPct = Math.round((hp / boss.maxHealth) * 100);
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-900/15 border border-red-800/40">
                <span className="text-4xl">{boss.emoji}</span>
                <div>
                  <div className="text-base font-bold text-red-300">{boss.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{boss.phase}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="text-xs font-bold text-red-400">❤️ {hp}/{boss.maxHealth}</div>
                    <div className="flex-1 h-2 rounded-full bg-black/40 overflow-hidden" style={{ minWidth: 60 }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${hpPct}%`, background: hpPct > 50 ? '#ef4444' : hpPct > 25 ? '#f97316' : '#dc2626' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed">{boss.story}</p>

              <div className="p-3 rounded-lg bg-orange-900/10 border border-orange-800/30">
                <p className="text-xs font-bold text-orange-400 mb-1">⚡ Habilidade Especial</p>
                <p className="text-sm text-gray-300">{boss.ability}</p>
              </div>

              <div className="p-3 rounded-lg bg-blue-900/10 border border-blue-800/30">
                <p className="text-xs font-bold text-blue-400 mb-1">
                  <Swords size={11} className="inline mr-1" />
                  O Boss se moverá na próxima vez que você voltar ao tabuleiro
                </p>
                <p className="text-[11px] text-gray-500">
                  Esta casa ficou marcada. O combate completo acontece na aba <strong>Bosses</strong>.
                </p>
              </div>

              <button onClick={() => setOpenBossName(null)}
                className="w-full btn-dark px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-300">
                Fechar
              </button>
            </div>
          );
        })()}
      </Modal>

      {/* ─── History Modal ─── */}
      <Modal isOpen={showHistory} onClose={() => setShowHistory(false)} title="📜 Histórico de Exploração" size="md">
        <div className="space-y-4">
          {players.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {players.map(p => {
                const info = CLASS_INFO[p.playerClass] || { emoji: '❓', color: '#9ca3af' };
                const isSelected = historyFor === p.id;
                const count = getVisitedEventsForPlayer(p.id).length;
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

          {(() => {
            if (!historyFor) {
              return (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">👆</div>
                  <p className="text-gray-500 text-sm">Selecione um jogador acima para ver seu histórico.</p>
                </div>
              );
            }

            const events = getVisitedEventsForPlayer(historyFor);
            const player = players.find(p => p.id === historyFor);
            const info = player ? CLASS_INFO[player.playerClass] : null;

            if (events.length === 0) {
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
                    {info?.emoji} {player?.name} — {events.length} casa{events.length !== 1 ? 's' : ''} explorada{events.length !== 1 ? 's' : ''}
                  </span>
                  <button onClick={() => handleClearHistory(historyFor)}
                    className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-red-400 transition-colors px-2 py-1 rounded">
                    <Trash2 size={10} /> Limpar
                  </button>
                </div>
                {events.map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-black/20">
                    <span className="text-lg shrink-0">
                      {entry.type === 'boss'
                        ? (BOSSES.find(b => b.name === entry.bossName)?.emoji ?? '💀')
                        : CELL_TYPE_ICON[entry.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-200">Casa #{entry.cellId}</span>
                        <span className="text-[10px] px-1 py-0.5 rounded"
                          style={{ color: CELL_TYPE_COLOR[entry.type], background: `${CELL_TYPE_COLOR[entry.type]}15` }}>
                          {entry.type === 'boss' ? 'Boss' : entry.type}
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
