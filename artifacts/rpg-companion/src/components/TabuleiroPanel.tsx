import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, RotateCcw, BookOpen } from 'lucide-react';
import { BoardCell, BoardCellType, BoardState, PhaseName } from '../types';
import Modal from './Modal';
import { v4 as uuidv4 } from 'uuid';

const BOARD_STORAGE_KEY = 'reino-rei-sombrio-tabuleiro';

const PHASE_DEFS: { name: PhaseName; emoji: string; color: string; cells: number; range: [number, number] }[] = [
  { name: 'Floresta das Sombras',    emoji: '🌲', color: '#16a34a', cells: 24, range: [1,  24] },
  { name: 'Cidade Abandonada',       emoji: '🏚️', color: '#d97706', cells: 17, range: [25, 41] },
  { name: 'Castelo do Rei Sombrio',  emoji: '🏰', color: '#dc2626', cells: 27, range: [42, 68] },
];

const CELL_CONTENT: Record<PhaseName, Record<BoardCellType, { content: string; description: string; reward?: string; penalty?: string }[]>> = {
  'Floresta das Sombras': {
    vazia: [
      { content: 'Caminho Livre', description: 'O caminho está limpo. Avance sem perigos.' },
      { content: 'Clareira Segura', description: 'Uma clareira tranquila na floresta sombria.' },
    ],
    armadilha: [
      { content: 'Teia de Aranha', description: 'Uma imensa teia cobre o caminho!', penalty: '-1 vida ao jogador que pisar' },
      { content: 'Raízes Vivas', description: 'As raízes se movem e tentam prender os pés.', penalty: 'Perde 1 turno' },
      { content: 'Esporos Tóxicos', description: 'Cogumelos liberam esporos venenosos.', penalty: '-1 vida a todos' },
    ],
    carta: [
      { content: 'Carta da Floresta', description: 'Uma carta mágica encontrada numa árvore oca.', reward: 'Carta Comum x1' },
      { content: 'Carta do Druida', description: 'Pertencia a um druida que habitava a floresta.', reward: 'Carta Rara x1' },
    ],
    tesouro: [
      { content: 'Baú Sombrio', description: 'Um baú escondido sob uma raiz.', reward: 'Item Raro + 20 Ouro' },
      { content: 'Ninho de Aranha', description: 'Um ninho abandonado com brilhos de cristal.', reward: 'Cristal x2' },
    ],
    ouro: [
      { content: 'Moedas Escondidas', description: 'Moedas antigas escondidas entre folhas.', reward: '+15 Ouro' },
      { content: 'Bolsa Perdida', description: 'Uma bolsa de aventureiro caído.', reward: '+25 Ouro' },
    ],
    cristal: [
      { content: 'Cristal Vermelho', description: 'Pulsa com energia sombria nas raízes.', reward: 'Cristal Pequeno x1' },
    ],
    monstro: [
      { content: 'Aranha Sombria', description: 'Uma aranha enorme bloqueia o caminho!', penalty: 'Combate! -1 vida (pode ser evitado)' },
      { content: 'Enxame de Besouros', description: 'Besouros negros cobrem tudo ao redor!', penalty: '-1 vida a todos os jogadores adjacentes' },
    ],
    especial: [
      { content: '🌟 Portal Mágico', description: 'Um portal brilhante abre caminho para uma área secreta!', reward: 'Avance 2 casas + Item Épico' },
      { content: '🌿 Fonte Sagrada', description: 'Uma fonte de água cristalina restaura as forças.', reward: '+2 vida ao grupo inteiro' },
    ],
  },
  'Cidade Abandonada': {
    vazia: [
      { content: 'Rua Vazia', description: 'As ruas da cidade estão desertas e silenciosas.' },
      { content: 'Prédio em Ruínas', description: 'Apenas escombros restaram do que foi um dia glorioso.' },
    ],
    armadilha: [
      { content: 'Piso Desmoronante', description: 'O piso cede sob o peso dos aventureiros!', penalty: '-1 vida ao jogador da frente' },
      { content: 'Emboscada de Escorpiões', description: 'Escorpiões saem das sombras!', penalty: '-1 vida + veneno (1 dano/rodada)' },
      { content: 'Portão Selado', description: 'Um portão mágico bloqueia a passagem.', penalty: 'Perde 2 turnos para abrir' },
      { content: 'Veneno no Ar', description: 'O ar cheira a enxofre e podridão.', penalty: '-1 vida a todos' },
    ],
    carta: [
      { content: 'Diário do General', description: 'O diário do general Skorrath antes da queda.', reward: 'Carta Épica x1' },
      { content: 'Pergaminho Antigo', description: 'Contém feitiços da cidade dourada.', reward: 'Carta Rara x2' },
    ],
    tesouro: [
      { content: 'Cofre do Mercador', description: 'O cofre de um rico mercador que tentou fugir.', reward: 'Item Épico + 50 Ouro' },
      { content: 'Armaria Saqueada', description: 'Ainda restam armas de qualidade.', reward: 'Item Raro x2' },
    ],
    ouro: [
      { content: 'Saque das Ruínas', description: 'Ouro espalhado entre os escombros.', reward: '+30 Ouro' },
      { content: 'Cofre Arrombado', description: 'Alguém chegou antes, mas deixou algumas moedas.', reward: '+40 Ouro' },
    ],
    cristal: [
      { content: 'Cristal Médio', description: 'Cristais vermelhos incrustados nas paredes.', reward: 'Cristal Médio x2' },
    ],
    monstro: [
      { content: 'Escorpião Gigante', description: 'Um escorpião do tamanho de um cavalo aparece!', penalty: 'Combate! -1 vida (pode ser evitado com -2 turnos)' },
      { content: 'Patrulha Sombria', description: 'Soldados corrompidos patrulham a área.', penalty: '-2 vida ao grupo ou recuar 1 casa' },
    ],
    especial: [
      { content: '🏛️ Biblioteca Secreta', description: 'Uma biblioteca escondida com conhecimentos proibidos!', reward: 'Carta Lendária x1 + XP extra' },
      { content: '⚗️ Laboratório do Alquimista', description: 'Poções e ingredientes mágicos ainda intactos.', reward: 'Poção de Cura x2 + Cristal x1' },
    ],
  },
  'Castelo do Rei Sombrio': {
    vazia: [
      { content: 'Corredor Sombrio', description: 'Um corredor infinito com tochas que nunca se apagam.' },
      { content: 'Sala Vazia', description: 'Ecos dos passos do Rei Sombrio ainda ressoam aqui.' },
    ],
    armadilha: [
      { content: 'Cristal Explosivo', description: 'Um cristal instável no chão!', penalty: '-2 vida a todos ao redor' },
      { content: 'Selo do Rei', description: 'Um sigilo mágico drena a energia vital.', penalty: '-1 vida por turno enquanto na sala' },
      { content: 'Espelhos da Ilusão', description: 'Os espelhos criam cópias dos inimigos!', penalty: 'Combate duplo: -2 vida total' },
      { content: 'Trono Amaldiçoado', description: 'Uma força invisível empurra para o trono.', penalty: '-2 vida ao jogador mais próximo' },
      { content: 'Corredor Final', description: 'O último teste antes do Boss!', penalty: '-3 vida possível (role dado)' },
    ],
    carta: [
      { content: 'Carta do Rei Sombrio', description: 'A mais poderosa de todas as cartas do reino.', reward: 'Carta Mítica x1' },
      { content: 'Carta da Sombra', description: 'Invoca a escuridão absoluta para proteger.', reward: 'Carta Lendária x1' },
    ],
    tesouro: [
      { content: 'Tesouro do Rei', description: 'O tesouro pessoal do Rei Sombrio!', reward: 'Item Mítico + 100 Ouro + Cristal x5' },
      { content: 'Câmara Secreta', description: 'Uma câmara oculta atrás de um espelho.', reward: 'Item Lendário x1 + Cristal Grande x3' },
    ],
    ouro: [
      { content: 'Câmara do Tesouro', description: 'Pilhas de ouro negro do reino corrompido.', reward: '+75 Ouro' },
      { content: 'Oferendas ao Rei', description: 'Tributos acumulados por séculos.', reward: '+100 Ouro' },
    ],
    cristal: [
      { content: 'Cristal Grande', description: 'Cristais imensos pulsando com poder infinito.', reward: 'Cristal Grande x5' },
    ],
    monstro: [
      { content: 'Servo do Rei Sombrio', description: 'Um servo incorruptível defende o castelo!', penalty: 'Combate intenso! -2 vida ou fuga com -3 turnos' },
      { content: 'Guarda da Torre', description: 'O mais temido dos guardas do Rei!', penalty: '-3 vida ao grupo ou custo alto para passar' },
    ],
    especial: [
      { content: '👑 Sala do Trono', description: 'A sala do trono do Rei Sombrio aguarda...', reward: 'Desafio especial: vencer = Item Mítico + vitória!' },
      { content: '🔮 Orbe do Destino', description: 'O orbe do Rei revela os segredos do reino.', reward: 'Revelar 3 casas aleatórias + XP enorme' },
    ],
  },
};

function generateCell(id: number, phase: PhaseName, typeDistrib: BoardCellType[]): BoardCell {
  const type = typeDistrib[id % typeDistrib.length];
  const options = CELL_CONTENT[phase][type];
  const pick = options[Math.floor(Math.random() * options.length)];
  return {
    id,
    phase,
    type,
    content: pick.content,
    description: pick.description,
    reward: pick.reward,
    penalty: pick.penalty,
    visited: false,
  };
}

function buildDistribution(phase: PhaseName): BoardCellType[] {
  if (phase === 'Floresta das Sombras') {
    // 24 casas: níveis 1-24
    return [
      'vazia',    'armadilha', 'ouro',     'carta',
      'vazia',    'monstro',   'cristal',  'armadilha',
      'ouro',     'vazia',     'carta',    'tesouro',
      'armadilha','monstro',   'vazia',    'ouro',
      'armadilha','cristal',   'vazia',    'monstro',
      'carta',    'armadilha', 'tesouro',  'especial',
    ];
  } else if (phase === 'Cidade Abandonada') {
    // 17 casas: níveis 25-41
    return [
      'vazia',    'monstro',   'ouro',     'armadilha',
      'carta',    'tesouro',   'armadilha','cristal',
      'monstro',  'vazia',     'armadilha','ouro',
      'monstro',  'carta',     'armadilha','vazia',
      'especial',
    ];
  } else {
    // 27 casas: níveis 42-68
    return [
      'monstro',  'armadilha', 'ouro',     'carta',
      'armadilha','monstro',   'cristal',  'armadilha',
      'tesouro',  'monstro',   'armadilha','ouro',
      'armadilha','monstro',   'cristal',  'vazia',
      'armadilha','monstro',   'carta',    'armadilha',
      'monstro',  'cristal',   'armadilha','tesouro',
      'monstro',  'armadilha', 'especial',
    ];
  }
}

function generateNewBoard(): BoardState {
  const cells: BoardCell[] = [];
  let cellId = 1;
  for (const phase of PHASE_DEFS) {
    const distrib = buildDistribution(phase.name);
    for (let i = 0; i < phase.cells; i++) {
      cells.push(generateCell(i, phase.name, distrib));
      cells[cells.length - 1].id = cellId++;
    }
  }
  return { cells, explorationLog: [], campaignId: uuidv4() };
}

function loadBoard(): BoardState {
  try {
    const saved = localStorage.getItem(BOARD_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.cells) && parsed.cells.length === 68) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('[TabuleiroPanel] Erro ao carregar tabuleiro:', e);
  }
  return generateNewBoard();
}

function saveBoard(state: BoardState) {
  try {
    localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[TabuleiroPanel] Erro ao salvar tabuleiro:', e);
  }
}

const CELL_TYPE_ICON: Record<BoardCellType, string> = {
  vazia: '⬜',
  armadilha: '⚠️',
  carta: '🃏',
  tesouro: '💎',
  ouro: '💰',
  cristal: '🔮',
  monstro: '👹',
  especial: '🌟',
};

const CELL_TYPE_COLOR: Record<BoardCellType, string> = {
  vazia: '#4b5563',
  armadilha: '#f59e0b',
  carta: '#8b5cf6',
  tesouro: '#3b82f6',
  ouro: '#eab308',
  cristal: '#ec4899',
  monstro: '#ef4444',
  especial: '#f97316',
};

export default function TabuleiroPanel() {
  const [board, setBoard] = useState<BoardState>(loadBoard);
  const [selectedCell, setSelectedCell] = useState<BoardCell | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    saveBoard(board);
  }, [board]);

  const handleCellClick = useCallback((cell: BoardCell) => {
    console.log(`[TabuleiroPanel] Casa clicada: #${cell.id} (${cell.phase})`);
    setSelectedCell(cell);
  }, []);

  const handleMarkVisited = useCallback(() => {
    if (!selectedCell) return;
    setBoard(prev => {
      const newLog = {
        id: uuidv4(),
        cellId: selectedCell.id,
        phase: selectedCell.phase,
        event: selectedCell.content,
        timestamp: Date.now(),
      };
      return {
        ...prev,
        cells: prev.cells.map(c =>
          c.id === selectedCell.id ? { ...c, visited: true } : c
        ),
        explorationLog: [newLog, ...prev.explorationLog].slice(0, 100),
      };
    });
    setSelectedCell(prev => prev ? { ...prev, visited: true } : null);
  }, [selectedCell]);

  const handleMarkUnvisited = useCallback(() => {
    if (!selectedCell) return;
    setBoard(prev => ({
      ...prev,
      cells: prev.cells.map(c =>
        c.id === selectedCell.id ? { ...c, visited: false } : c
      ),
    }));
    setSelectedCell(prev => prev ? { ...prev, visited: false } : null);
  }, [selectedCell]);

  const handleReset = useCallback(() => {
    const newBoard = generateNewBoard();
    setBoard(newBoard);
    setShowResetConfirm(false);
    setSelectedCell(null);
    console.log('[TabuleiroPanel] Tabuleiro resetado com nova campanha:', newBoard.campaignId);
  }, []);

  const visitedCount = board.cells.filter(c => c.visited).length;
  const totalCells = 68;
  const progress = Math.round((visitedCount / totalCells) * 100);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-red-400" style={{ fontFamily: 'Cinzel, serif' }}>
          🗺️ Tabuleiro de Exploração
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLog(true)}
            className="btn-dark px-3 py-1.5 rounded-lg text-xs text-amber-400 flex items-center gap-1"
          >
            <BookOpen size={13} /> Histórico
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn-dark px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-red-400 flex items-center gap-1"
          >
            <RotateCcw size={13} /> Nova Campanha
          </button>
        </div>
      </div>

      <div className="card-dark rounded-xl p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400">Progresso da Campanha</span>
          <span className="text-xs text-red-400 font-medium">{visitedCount}/{totalCells} casas ({progress}%)</span>
        </div>
        <div className="h-2 rounded-full bg-black/40 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #7f1d1d, #dc2626)',
              boxShadow: '0 0 8px rgba(220,38,38,0.5)',
            }}
          />
        </div>
      </div>

      <div className="space-y-5">
        {PHASE_DEFS.map(phase => {
          const phaseCells = board.cells.filter(c => c.phase === phase.name);
          const phaseVisited = phaseCells.filter(c => c.visited).length;

          return (
            <div key={phase.name} className="card-dark rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <span className="text-2xl">{phase.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-sm font-bold" style={{ color: phase.color, fontFamily: 'Cinzel, serif' }}>
                    {phase.name}
                  </h3>
                  <p className="text-[10px] text-gray-500">{phaseVisited}/{phase.cells} casas exploradas (níveis {phase.range[0]}–{phase.range[1]})</p>
                </div>
                <div className="w-16 h-1.5 rounded-full bg-black/40 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(phaseVisited / phase.cells) * 100}%`,
                      background: phase.color,
                      boxShadow: `0 0 6px ${phase.color}80`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3 grid grid-cols-6 gap-2">
                {phaseCells.map(cell => (
                  <button
                    key={cell.id}
                    onClick={() => handleCellClick(cell)}
                    className="relative aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-opacity active:opacity-70"
                    style={{
                      background: cell.visited
                        ? `${CELL_TYPE_COLOR[cell.type]}18`
                        : 'rgba(0,0,0,0.4)',
                      border: `1px solid ${cell.visited ? CELL_TYPE_COLOR[cell.type] + '50' : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: cell.visited ? `0 0 8px ${CELL_TYPE_COLOR[cell.type]}30` : 'none',
                    }}
                  >
                    <span className="text-base leading-none">
                      {cell.visited ? CELL_TYPE_ICON[cell.type] : '❓'}
                    </span>
                    <span
                      className="text-[9px] font-bold"
                      style={{ color: cell.visited ? CELL_TYPE_COLOR[cell.type] : '#4b5563' }}
                    >
                      {cell.id}
                    </span>
                    {cell.visited && (
                      <div
                        className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
                        style={{ background: phase.color }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-dark rounded-xl p-3">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Legenda</h4>
        <div className="grid grid-cols-4 gap-x-3 gap-y-1.5">
          {(Object.entries(CELL_TYPE_ICON) as [BoardCellType, string][]).map(([type, icon]) => (
            <div key={type} className="flex items-center gap-1.5 text-[10px]">
              <span>{icon}</span>
              <span style={{ color: CELL_TYPE_COLOR[type] }}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={!!selectedCell}
        onClose={() => setSelectedCell(null)}
        title={selectedCell ? `Casa #${selectedCell.id}` : ''}
        size="sm"
      >
        {selectedCell && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{
              background: `${PHASE_DEFS.find(p => p.name === selectedCell.phase)?.color ?? '#dc2626'}15`,
              border: `1px solid ${PHASE_DEFS.find(p => p.name === selectedCell.phase)?.color ?? '#dc2626'}30`,
            }}>
              <span className="text-3xl">{CELL_TYPE_ICON[selectedCell.type]}</span>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">
                  {PHASE_DEFS.find(p => p.name === selectedCell.phase)?.emoji} {selectedCell.phase}
                </div>
                <div className="text-base font-bold text-gray-100">{selectedCell.content}</div>
                <div
                  className="text-[10px] px-1.5 py-0.5 rounded inline-block mt-1 font-medium"
                  style={{
                    color: CELL_TYPE_COLOR[selectedCell.type],
                    background: `${CELL_TYPE_COLOR[selectedCell.type]}18`,
                  }}
                >
                  {selectedCell.type.charAt(0).toUpperCase() + selectedCell.type.slice(1)}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">{selectedCell.description}</p>

            {selectedCell.reward && (
              <div className="p-3 rounded-lg bg-yellow-900/10 border border-yellow-800/30">
                <p className="text-xs font-bold text-yellow-400 mb-1">✨ Recompensa</p>
                <p className="text-sm text-gray-300">{selectedCell.reward}</p>
              </div>
            )}

            {selectedCell.penalty && (
              <div className="p-3 rounded-lg bg-red-900/10 border border-red-800/30">
                <p className="text-xs font-bold text-red-400 mb-1">⚠️ Penalidade</p>
                <p className="text-sm text-gray-300">{selectedCell.penalty}</p>
              </div>
            )}

            <div className="flex gap-2">
              {!selectedCell.visited ? (
                <button
                  onClick={handleMarkVisited}
                  className="flex-1 btn-red px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} /> Marcar como Visitada
                </button>
              ) : (
                <button
                  onClick={handleMarkUnvisited}
                  className="flex-1 btn-dark px-4 py-2.5 rounded-lg text-sm text-gray-400 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={14} /> Desmarcar
                </button>
              )}
            </div>

            {selectedCell.visited && (
              <p className="text-center text-xs text-green-400">✓ Casa já explorada</p>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="⚠️ Nova Campanha"
        size="sm"
      >
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-400">
            Isso irá <strong className="text-red-400">gerar um novo tabuleiro</strong> com casas e eventos diferentes. O progresso atual será perdido.
          </p>
          <p className="text-xs text-gray-600">Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowResetConfirm(false)} className="flex-1 btn-dark px-4 py-2 rounded-lg text-sm">
              Cancelar
            </button>
            <button
              onClick={handleReset}
              className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-300 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-red-800/50"
            >
              🗺️ Nova Campanha
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showLog}
        onClose={() => setShowLog(false)}
        title="📜 Histórico de Exploração"
        size="md"
      >
        <div className="space-y-2">
          {board.explorationLog.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🗺️</div>
              <p className="text-gray-500 text-sm">Nenhuma casa explorada ainda.</p>
            </div>
          ) : (
            board.explorationLog.map(entry => {
              const phaseInfo = PHASE_DEFS.find(p => p.name === entry.phase);
              return (
                <div key={entry.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-black/20">
                  <span className="text-lg shrink-0">{phaseInfo?.emoji ?? '🗺️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-200">Casa #{entry.cellId}</span>
                      <span className="text-[10px]" style={{ color: phaseInfo?.color ?? '#9ca3af' }}>
                        {entry.phase}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{entry.event}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {new Date(entry.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </div>
  );
}
