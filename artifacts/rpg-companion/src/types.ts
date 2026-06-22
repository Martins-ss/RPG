export type PlayerClass = 'Guerreiro' | 'Arqueiro' | 'Mago' | 'Paladino' | 'Assassino';

export type ItemRarity = 'Comum' | 'Raro' | 'Épico' | 'Lendário' | 'Mítico';

export type PhaseName = 'Floresta das Sombras' | 'Cidade Abandonada' | 'Castelo do Rei Sombrio';

export type ArmorPieceId = 'escudo' | 'elmo' | 'peitoral' | 'manoplas' | 'botas' | 'arma';

export const ARMOR_PIECES: { id: ArmorPieceId; label: string; emoji: string }[] = [
  { id: 'escudo',   label: 'Escudo',   emoji: '🛡️' },
  { id: 'elmo',     label: 'Elmo',     emoji: '⛑️' },
  { id: 'peitoral', label: 'Peitoral', emoji: '🧥' },
  { id: 'manoplas', label: 'Manoplas', emoji: '🧤' },
  { id: 'botas',    label: 'Botas',    emoji: '🥾' },
  { id: 'arma',     label: 'Arma',     emoji: '⚔️' },
];

export type ArmorProgress = Record<ArmorPieceId, boolean>;

export const DEFAULT_ARMOR: ArmorProgress = {
  escudo: false, elmo: false, peitoral: false,
  manoplas: false, botas: false, arma: false,
};

export interface BossDefeat {
  defeatedBy: string;
  defeatedAt: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'ouro' | 'cristal' | 'carta' | 'item';
  rarity: ItemRarity;
  quantity: number;
  description: string;
  phase: PhaseName;
}

export interface Player {
  id: string;
  name: string;
  playerClass: PlayerClass;
  health: number;
  maxHealth: number;
  level: number;
  xp: number;
  xpToNext: number;
  inventory: InventoryItem[];
  gold: number;
  crystals: number;
  armor: ArmorProgress;
  createdAt: number;
}

export interface Boss {
  name: string;
  phase: PhaseName;
  health: number;
  maxHealth: number;
  ability: string;
  story: string;
  reward: InventoryItem;
  emoji: string;
}

export interface Monster {
  name: string;
  phase: PhaseName;
  emoji: string;
  description: string;
}

export interface Phase {
  name: PhaseName;
  emoji: string;
  levelRange: [number, number];
  monster: Monster;
  boss: Boss;
  traps: string[];
  description: string;
  color: string;
}

export interface GameLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'combat' | 'reward' | 'level' | 'death' | 'boss' | 'trap';
}

export type TabId = 'dashboard' | 'players' | 'phases' | 'bosses' | 'rewards' | 'log' | 'tabuleiro';

export type BoardCellType =
  | 'vazia'
  | 'armadilha'
  | 'carta'
  | 'tesouro'
  | 'ouro'
  | 'cristal'
  | 'monstro'
  | 'especial'
  | 'boss';

export interface BoardCell {
  id: number;
  phase: PhaseName;
  type: BoardCellType;
  content: string;
  description: string;
  reward?: string;
  penalty?: string;
  visited: boolean;
}

export interface BoardExplorationLog {
  id: string;
  cellId: number;
  phase: PhaseName;
  event: string;
  timestamp: number;
}

export interface BoardState {
  cells: BoardCell[];
  explorationLog: BoardExplorationLog[];
  campaignId: string;
}
