import { useState, useCallback, useEffect } from 'react';
import { Player, GameLog, InventoryItem } from './types';
import { xpForLevel, BOSSES } from './gameData';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'reino-rei-sombrio';
const BOSS_STORAGE_KEY = 'reino-rei-sombrio-bosses';

interface GameState {
  players: Player[];
  logs: GameLog[];
}

interface BossHealthState {
  [bossName: string]: number;
}

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

function loadState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object') {
        console.warn('[Store] Dados inválidos no localStorage, resetando...');
        return { players: [], logs: [] };
      }
      const players: Player[] = Array.isArray(parsed.players)
        ? parsed.players.filter(isValidPlayer).map((p: Player) => ({
            ...p,
            maxHealth: p.maxHealth || 5,
            inventory: Array.isArray(p.inventory) ? p.inventory : [],
            health: Math.min(Math.max(0, p.health || 0), 5),
            level: Math.min(Math.max(1, p.level || 1), 68),
          }))
        : [];
      const logs: GameLog[] = Array.isArray(parsed.logs)
        ? parsed.logs.filter(isValidLog).slice(0, 200)
        : [];
      console.log(`[Store] Carregado: ${players.length} jogadores, ${logs.length} logs`);
      return { players, logs };
    }
  } catch (error) {
    console.error('[Store] Erro ao carregar localStorage:', error);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
  return { players: [], logs: [] };
}

function saveState(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[Store] Erro ao salvar localStorage:', error);
  }
}

function loadBossHealths(): BossHealthState {
  try {
    const saved = localStorage.getItem(BOSS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (error) {
    console.error('[Store] Erro ao carregar boss health:', error);
  }
  return Object.fromEntries(BOSSES.map(b => [b.name, b.maxHealth]));
}

function saveBossHealths(healths: BossHealthState) {
  try {
    localStorage.setItem(BOSS_STORAGE_KEY, JSON.stringify(healths));
  } catch (error) {
    console.error('[Store] Erro ao salvar boss health:', error);
  }
}

export function useGameStore() {
  const [state, setState] = useState<GameState>(loadState);
  const [bossHealths, setBossHealths] = useState<BossHealthState>(loadBossHealths);

  useEffect(() => {
    saveBossHealths(bossHealths);
  }, [bossHealths]);

  const updateState = useCallback((updater: (prev: GameState) => GameState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const addLog = useCallback((message: string, type: GameLog['type'] = 'info') => {
    const log: GameLog = { id: uuidv4(), timestamp: Date.now(), message, type };
    updateState(prev => ({
      ...prev,
      logs: [log, ...prev.logs].slice(0, 200),
    }));
  }, [updateState]);

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
        logs: player ? [{ id: uuidv4(), timestamp: Date.now(), message: `💀 ${player.name} foi removido da aventura.`, type: 'death' as const }, ...prev.logs].slice(0, 200) : prev.logs,
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
      const newHealth = Math.max(0, Math.min(5, player.health + amount));
      const msg = amount > 0
        ? `💚 ${player.name} recuperou ${amount} de vida (${newHealth}/5)`
        : `❤️‍🩹 ${player.name} perdeu ${Math.abs(amount)} de vida (${newHealth}/5)`;
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

      if (newLevel >= 68) {
        newLevel = 68;
        newXP = 0;
        newXpToNext = 0;
      }

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

  const getBossHealth = useCallback((bossName: string, maxHealth: number): number => {
    return bossHealths[bossName] ?? maxHealth;
  }, [bossHealths]);

  const clearLogs = useCallback(() => {
    updateState(prev => ({ ...prev, logs: [] }));
  }, [updateState]);

  const resetAll = useCallback(() => {
    updateState(() => ({ players: [], logs: [] }));
    setBossHealths(Object.fromEntries(BOSSES.map(b => [b.name, b.maxHealth])));
    try {
      localStorage.removeItem(BOSS_STORAGE_KEY);
      localStorage.removeItem('reino-rei-sombrio-tabuleiro');
    } catch {}
  }, [updateState]);

  return {
    players: state.players,
    logs: state.logs,
    bossHealths,
    addPlayer,
    removePlayer,
    updatePlayer,
    adjustHealth,
    addXP,
    setLevel,
    addItemToPlayer,
    removeItemFromPlayer,
    addLog,
    clearLogs,
    resetAll,
    adjustBossHealth,
    resetBossHealth,
    getBossHealth,
  };
}
