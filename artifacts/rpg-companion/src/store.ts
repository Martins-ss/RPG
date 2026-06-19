import { useState, useCallback, useEffect } from 'react';
import { Player, GameLog, InventoryItem, ArmorPieceId, ArmorProgress, BossDefeat, DEFAULT_ARMOR } from './types';
import { xpForLevel, BOSSES } from './gameData';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY         = 'reino-rei-sombrio';
const BOSS_STORAGE_KEY    = 'reino-rei-sombrio-bosses';
const BOSS_DEFEATS_KEY    = 'reino-rei-sombrio-boss-derrotas';
const TABULEIRO_HIST_KEY  = 'reino-rei-sombrio-tabuleiro-historico';

interface GameState {
  players: Player[];
  logs: GameLog[];
}

interface BossHealthState {
  [bossName: string]: number;
}

type BossDefeatsState = Record<string, BossDefeat>;

// ─── Validators ───────────────────────────────────────────────────────────────

function isValidPlayer(p: unknown): p is Player {
  if (!p || typeof p !== 'object') return false;
  const obj = p as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.playerClass === 'string' &&
    typeof obj.health === 'number' &&
    typeof obj.maxHealth === 'number' &&
    typeof obj.level === 'number' &&
    typeof obj.xp === 'number' &&
    typeof obj.xpToNext === 'number' &&
    Array.isArray(obj.inventory)
  );
}

function isValidLog(log: unknown): log is GameLog {
  if (!log || typeof log !== 'object') return false;
  const obj = log as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.timestamp === 'number' &&
    typeof obj.message === 'string' &&
    typeof obj.type === 'string'
  );
}

// ─── Load / Save ─────────────────────────────────────────────────────────────

function migratePlayer(p: Player): Player {
  return {
    ...p,
    maxHealth: p.maxHealth || 5,
    inventory: Array.isArray(p.inventory) ? p.inventory : [],
    health: Math.min(Math.max(0, p.health || 0), p.maxHealth || 5),
    level: Math.min(Math.max(1, p.level || 1), 68),
    gold: typeof p.gold === 'number' ? Math.max(0, p.gold) : 0,
    crystals: typeof p.crystals === 'number' ? Math.max(0, p.crystals) : 0,
    armor: (p.armor && typeof p.armor === 'object') ? { ...DEFAULT_ARMOR, ...p.armor } : { ...DEFAULT_ARMOR },
  };
}

function loadState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object') return { players: [], logs: [] };
      const players: Player[] = Array.isArray(parsed.players)
        ? parsed.players.filter(isValidPlayer).map(migratePlayer)
        : [];
      const logs: GameLog[] = Array.isArray(parsed.logs)
        ? parsed.logs.filter(isValidLog).slice(0, 200)
        : [];
      return { players, logs };
    }
  } catch (error) {
    console.error('[Store] Erro ao carregar localStorage:', error);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }
  return { players: [], logs: [] };
}

function saveState(state: GameState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function loadBossHealths(): BossHealthState {
  const defaults: BossHealthState = Object.fromEntries(BOSSES.map(b => [b.name, b.maxHealth]));
  try {
    const saved = localStorage.getItem(BOSS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const merged: BossHealthState = { ...defaults };
        for (const bossName of Object.keys(defaults)) {
          const savedVal = parsed[bossName];
          if (typeof savedVal === 'number' && savedVal >= 0) {
            merged[bossName] = savedVal;
          }
        }
        return merged;
      }
    }
  } catch {}
  return defaults;
}

function saveBossHealths(healths: BossHealthState) {
  try { localStorage.setItem(BOSS_STORAGE_KEY, JSON.stringify(healths)); } catch {}
}

function loadBossDefeats(): BossDefeatsState {
  try {
    const saved = localStorage.getItem(BOSS_DEFEATS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return {};
}

function saveBossDefeats(d: BossDefeatsState) {
  try { localStorage.setItem(BOSS_DEFEATS_KEY, JSON.stringify(d)); } catch {}
}

// ─── Store Hook ───────────────────────────────────────────────────────────────

export function useGameStore() {
  const [state, setState] = useState<GameState>(loadState);
  const [bossHealths, setBossHealths] = useState<BossHealthState>(loadBossHealths);
  const [bossDefeats, setBossDefeats] = useState<BossDefeatsState>(loadBossDefeats);

  useEffect(() => { saveBossHealths(bossHealths); }, [bossHealths]);

  const updateState = useCallback((updater: (prev: GameState) => GameState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  // ─── Logs ──────────────────────────────────────────────────────────────────

  const addLog = useCallback((message: string, type: GameLog['type'] = 'info') => {
    const log: GameLog = { id: uuidv4(), timestamp: Date.now(), message, type };
    updateState(prev => ({ ...prev, logs: [log, ...prev.logs].slice(0, 200) }));
  }, [updateState]);

  const clearLogs = useCallback(() => {
    updateState(prev => ({ ...prev, logs: [] }));
  }, [updateState]);

  // ─── Players ───────────────────────────────────────────────────────────────

  const addPlayer = useCallback((name: string, playerClass: Player['playerClass']) => {
    const player: Player = {
      id: uuidv4(),
      name,
      playerClass,
      health: 5,
      maxHealth: 5,
      level: 1,
      xp: 0,
      xpToNext: xpForLevel(1),
      inventory: [],
      gold: 0,
      crystals: 0,
      armor: { ...DEFAULT_ARMOR },
      createdAt: Date.now(),
    };
    updateState(prev => ({ ...prev, players: [...prev.players, player] }));
    addLog(`🎉 ${name} (${playerClass}) entrou na aventura!`, 'info');
    return player;
  }, [updateState, addLog]);

  const removePlayer = useCallback((id: string) => {
    updateState(prev => {
      const player = prev.players.find(p => p.id === id);
      return {
        ...prev,
        players: prev.players.filter(p => p.id !== id),
        logs: player
          ? [{ id: uuidv4(), timestamp: Date.now(), message: `💀 ${player.name} foi removido da aventura.`, type: 'death' as const }, ...prev.logs].slice(0, 200)
          : prev.logs,
      };
    });
  }, [updateState]);

  const updatePlayer = useCallback((id: string, updates: Partial<Player>) => {
    updateState(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, [updateState]);

  const adjustHealth = useCallback((id: string, amount: number) => {
    updateState(prev => {
      const player = prev.players.find(p => p.id === id);
      if (!player) return prev;
      const max = player.maxHealth || 5;
      const newHealth = Math.max(0, Math.min(max, player.health + amount));
      const msg = amount > 0
        ? `💚 ${player.name} recuperou ${amount} de vida (${newHealth}/${max})`
        : `❤️‍🩹 ${player.name} perdeu ${Math.abs(amount)} de vida (${newHealth}/${max})`;
      const logType = newHealth === 0 ? 'death' : amount > 0 ? 'info' : 'combat';
      const deathMsg = newHealth === 0 ? `💀 ${player.name} caiu em combate!` : '';
      const newLogs: GameLog[] = [
        { id: uuidv4(), timestamp: Date.now(), message: msg, type: logType as GameLog['type'] },
        ...(deathMsg ? [{ id: uuidv4(), timestamp: Date.now() + 1, message: deathMsg, type: 'death' as GameLog['type'] }] : []),
        ...prev.logs,
      ].slice(0, 200);
      return {
        ...prev,
        players: prev.players.map(p => p.id === id ? { ...p, health: newHealth } : p),
        logs: newLogs,
      };
    });
  }, [updateState]);

  const adjustGold = useCallback((id: string, amount: number) => {
    updateState(prev => {
      const player = prev.players.find(p => p.id === id);
      if (!player) return prev;
      const newGold = Math.max(0, (player.gold ?? 0) + amount);
      return {
        ...prev,
        players: prev.players.map(p => p.id === id ? { ...p, gold: newGold } : p),
        logs: amount !== 0 ? [
          { id: uuidv4(), timestamp: Date.now(), message: `💰 ${player.name} ${amount >= 0 ? 'ganhou' : 'gastou'} ${Math.abs(amount)} de ouro (total: ${newGold})`, type: 'reward' as GameLog['type'] },
          ...prev.logs,
        ].slice(0, 200) : prev.logs,
      };
    });
  }, [updateState]);

  const adjustCrystals = useCallback((id: string, amount: number) => {
    updateState(prev => {
      const player = prev.players.find(p => p.id === id);
      if (!player) return prev;
      const newCrystals = Math.max(0, (player.crystals ?? 0) + amount);
      return {
        ...prev,
        players: prev.players.map(p => p.id === id ? { ...p, crystals: newCrystals } : p),
        logs: amount !== 0 ? [
          { id: uuidv4(), timestamp: Date.now(), message: `💎 ${player.name} ${amount >= 0 ? 'ganhou' : 'gastou'} ${Math.abs(amount)} cristal${Math.abs(amount) !== 1 ? 'is' : ''} (total: ${newCrystals})`, type: 'reward' as GameLog['type'] },
          ...prev.logs,
        ].slice(0, 200) : prev.logs,
      };
    });
  }, [updateState]);

  const toggleArmorPiece = useCallback((id: string, piece: ArmorPieceId, found: boolean) => {
    updateState(prev => {
      const player = prev.players.find(p => p.id === id);
      if (!player) return prev;
      const currentArmor: ArmorProgress = player.armor ?? { ...DEFAULT_ARMOR };
      const newArmor = { ...currentArmor, [piece]: found };
      const foundCount = Object.values(newArmor).filter(Boolean).length;
      const pieceEmoji: Record<ArmorPieceId, string> = { escudo: '🛡️', elmo: '⛑️', peitoral: '🧥', manoplas: '🧤', botas: '🥾', arma: '⚔️' };
      return {
        ...prev,
        players: prev.players.map(p => p.id === id ? { ...p, armor: newArmor } : p),
        logs: [
          { id: uuidv4(), timestamp: Date.now(), message: found
            ? `${pieceEmoji[piece]} ${player.name} encontrou uma peça da Armadura Lendária! (${foundCount}/6)`
            : `${pieceEmoji[piece]} Peça de armadura removida de ${player.name}`, type: 'reward' as GameLog['type'] },
          ...prev.logs,
        ].slice(0, 200),
      };
    });
  }, [updateState]);

  const addXP = useCallback((id: string, amount: number) => {
    updateState(prev => {
      const player = prev.players.find(p => p.id === id);
      if (!player) return prev;
      let newXP = player.xp + amount;
      let newLevel = player.level;
      let newXpToNext = player.xpToNext;
      const levelUps: string[] = [];

      while (newXP >= newXpToNext && newLevel < 68) {
        newXP -= newXpToNext;
        newLevel++;
        newXpToNext = xpForLevel(newLevel);
        levelUps.push(`⬆️ ${player.name} subiu para o nível ${newLevel}!`);
      }

      if (newLevel >= 68) { newLevel = 68; newXP = 0; newXpToNext = 0; }

      const newLogs: GameLog[] = [
        { id: uuidv4(), timestamp: Date.now(), message: `✨ ${player.name} ganhou ${amount} XP!`, type: 'reward' as GameLog['type'] },
        ...levelUps.map((msg, i) => ({ id: uuidv4(), timestamp: Date.now() + i + 1, message: msg, type: 'level' as GameLog['type'] })),
        ...prev.logs,
      ].slice(0, 200);

      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === id ? { ...p, xp: newXP, level: newLevel, xpToNext: newXpToNext } : p
        ),
        logs: newLogs,
      };
    });
  }, [updateState]);

  const setLevel = useCallback((id: string, level: number) => {
    const clampedLevel = Math.max(1, Math.min(68, level));
    updateState(prev => {
      const player = prev.players.find(p => p.id === id);
      if (!player) return prev;
      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === id ? { ...p, level: clampedLevel, xp: 0, xpToNext: xpForLevel(clampedLevel) } : p
        ),
        logs: [
          { id: uuidv4(), timestamp: Date.now(), message: `📊 ${player.name} foi ajustado para nível ${clampedLevel}`, type: 'info' as GameLog['type'] },
          ...prev.logs,
        ].slice(0, 200),
      };
    });
  }, [updateState]);

  const addItemToPlayer = useCallback((playerId: string, item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = { ...item, id: uuidv4() };
    updateState(prev => {
      const player = prev.players.find(p => p.id === playerId);
      if (!player) return prev;

      const existingIdx = player.inventory.findIndex(
        i => i.name === newItem.name && i.phase === newItem.phase
      );

      let newInventory: InventoryItem[];
      if (existingIdx >= 0 && (newItem.type === 'ouro' || newItem.type === 'cristal')) {
        newInventory = [...player.inventory];
        newInventory[existingIdx] = {
          ...newInventory[existingIdx],
          quantity: newInventory[existingIdx].quantity + newItem.quantity,
        };
      } else {
        newInventory = [...player.inventory, newItem];
      }

      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === playerId ? { ...p, inventory: newInventory } : p
        ),
        logs: [
          { id: uuidv4(), timestamp: Date.now(), message: `🎁 ${player.name} recebeu: ${newItem.name} (x${newItem.quantity})`, type: 'reward' as GameLog['type'] },
          ...prev.logs,
        ].slice(0, 200),
      };
    });
  }, [updateState]);

  const removeItemFromPlayer = useCallback((playerId: string, itemId: string) => {
    updateState(prev => {
      const player = prev.players.find(p => p.id === playerId);
      if (!player) return prev;
      const item = player.inventory.find(i => i.id === itemId);
      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === playerId ? { ...p, inventory: p.inventory.filter(i => i.id !== itemId) } : p
        ),
        logs: item ? [
          { id: uuidv4(), timestamp: Date.now(), message: `🗑️ ${item.name} removido do inventário de ${player.name}`, type: 'info' as GameLog['type'] },
          ...prev.logs,
        ].slice(0, 200) : prev.logs,
      };
    });
  }, [updateState]);

  // ─── Bosses ────────────────────────────────────────────────────────────────

  const adjustBossHealth = useCallback((bossName: string, amount: number, maxHealth: number) => {
    setBossHealths(prev => {
      const currentHealth = prev[bossName] ?? maxHealth;
      const newHealth = Math.max(0, Math.min(maxHealth, currentHealth + amount));
      const logMsg = amount < 0
        ? `⚔️ ${bossName} recebeu ${Math.abs(amount)} de dano! (${newHealth}/${maxHealth})`
        : `💚 ${bossName} recuperou ${amount} de vida! (${newHealth}/${maxHealth})`;
      addLog(logMsg, 'boss');
      return { ...prev, [bossName]: newHealth };
    });
  }, [addLog]);

  const resetBossHealth = useCallback((bossName: string, maxHealth: number) => {
    setBossHealths(prev => ({ ...prev, [bossName]: maxHealth }));
    addLog(`🔄 ${bossName} teve sua vida restaurada!`, 'boss');
  }, [addLog]);

  const defeatBoss = useCallback((bossName: string, defeatedBy: string) => {
    const defeat: BossDefeat = { defeatedBy, defeatedAt: Date.now() };
    setBossDefeats(prev => {
      const next = { ...prev, [bossName]: defeat };
      saveBossDefeats(next);
      return next;
    });
    setBossHealths(prev => ({ ...prev, [bossName]: 0 }));
    addLog(`☠️ ${bossName} foi DERROTADO por ${defeatedBy}! A vitória é nossa!`, 'boss');
  }, [addLog]);

  const getBossHealth = useCallback((bossName: string, maxHealth: number): number => {
    return bossHealths[bossName] ?? maxHealth;
  }, [bossHealths]);

  // ─── Campaign ──────────────────────────────────────────────────────────────

  const resetAll = useCallback(() => {
    updateState(() => ({ players: [], logs: [] }));
    setBossHealths(Object.fromEntries(BOSSES.map(b => [b.name, b.maxHealth])));
    setBossDefeats({});
    try {
      localStorage.removeItem(BOSS_STORAGE_KEY);
      localStorage.removeItem(BOSS_DEFEATS_KEY);
      localStorage.removeItem('reino-rei-sombrio-tabuleiro');
      localStorage.removeItem(TABULEIRO_HIST_KEY);
    } catch {}
  }, [updateState]);

  return {
    players: state.players,
    logs: state.logs,
    bossHealths,
    bossDefeats,
    addPlayer,
    removePlayer,
    updatePlayer,
    adjustHealth,
    adjustGold,
    adjustCrystals,
    toggleArmorPiece,
    addXP,
    setLevel,
    addItemToPlayer,
    removeItemFromPlayer,
    addLog,
    clearLogs,
    resetAll,
    adjustBossHealth,
    resetBossHealth,
    defeatBoss,
    getBossHealth,
  };
}
