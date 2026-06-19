import { Users, Skull, Gem, Scroll, Swords, Shield, ChevronRight, Plus, Map, Gift } from 'lucide-react';
import { Player, GameLog, TabId } from '../types';
import { PHASES, CLASS_INFO, getPhaseForLevel } from '../gameData';
import { HeartDisplay } from './HealthBar';

interface DashboardProps {
  players: Player[];
  logs: GameLog[];
  onNavigate: (tab: TabId) => void;
}

export default function Dashboard({ players, logs, onNavigate }: DashboardProps) {
  const totalItems = players.reduce((sum, p) => sum + p.inventory.length, 0);
  const avgLevel = players.length > 0
    ? Math.round(players.reduce((sum, p) => sum + p.level, 0) / players.length)
    : 0;
  const deadPlayers = players.filter(p => p.health === 0).length;
  const recentLogs = logs.slice(0, 8);

  const phaseDistribution = PHASES.map(phase => ({
    ...phase,
    count: players.filter(p => {
      const pp = getPhaseForLevel(p.level);
      return pp?.name === phase.name;
    }).length,
  }));

  const handleStatClick = (type: string) => {
    console.log(`[Dashboard] Clicou em stat: ${type}`);
    switch (type) {
      case 'players':
      case 'dead':
        onNavigate('players');
        break;
      case 'items':
        onNavigate('rewards');
        break;
      case 'level':
        onNavigate('phases');
        break;
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="relative overflow-hidden rounded-xl" style={{
        background: 'linear-gradient(135deg, rgba(153, 27, 27, 0.3), rgba(10, 10, 15, 0.9))',
        border: '1px solid rgba(220, 38, 38, 0.2)',
      }}>
        <div className="absolute inset-0 bg-[url('/images/bg-castle.jpg')] bg-cover bg-center opacity-15 pointer-events-none" />
        <div className="relative p-6 text-center">
          <div className="text-5xl mb-3">👑</div>
          <h2 className="text-2xl md:text-3xl font-bold text-red-400 text-glow-red mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
            O Reino do Rei Sombrio
          </h2>
          <p className="text-sm text-gray-400 mb-4">Painel Central do Mestre</p>
          <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-gray-400">
            <span className="flex items-center gap-1"><Swords size={14} className="text-red-400" /> 3 Fases</span>
            <span className="flex items-center gap-1"><Skull size={14} className="text-red-400" /> 3 Bosses</span>
            <span className="flex items-center gap-1"><Shield size={14} className="text-red-400" /> 68 Níveis</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          onClick={() => { console.log('[Dashboard] Clicou em Adicionar Jogador'); onNavigate('players'); }}
          className="btn-red px-3 py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2"
        >
          <Plus size={14} /> Adicionar Jogador
        </button>
        <button
          onClick={() => { console.log('[Dashboard] Clicou em Ver Fases'); onNavigate('phases'); }}
          className="btn-dark px-3 py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2"
        >
          <Map size={14} /> Ver Fases
        </button>
        <button
          onClick={() => { console.log('[Dashboard] Clicou em Bosses'); onNavigate('bosses'); }}
          className="btn-dark px-3 py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2"
        >
          <Skull size={14} /> Bosses
        </button>
        <button
          onClick={() => { console.log('[Dashboard] Clicou em Recompensas'); onNavigate('rewards'); }}
          className="btn-dark px-3 py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2"
        >
          <Gift size={14} /> Recompensas
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Users size={20} />} label="Jogadores" value={players.length} color="#3b82f6" onClick={() => handleStatClick('players')} />
        <StatCard icon={<Skull size={20} />} label="Caídos" value={deadPlayers} color="#ef4444" onClick={() => handleStatClick('dead')} />
        <StatCard icon={<Gem size={20} />} label="Itens Totais" value={totalItems} color="#8b5cf6" onClick={() => handleStatClick('items')} />
        <StatCard icon={<Scroll size={20} />} label="Nível Médio" value={avgLevel} color="#f59e0b" onClick={() => handleStatClick('level')} />
      </div>

      <button
        onClick={() => { console.log('[Dashboard] Clicou em Distribuição por Fase'); onNavigate('phases'); }}
        className="w-full text-left card-dark rounded-xl p-4 hover:border-red-500/30 transition-all group"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
            🗺️ Distribuição por Fase
          </h3>
          <ChevronRight size={16} className="text-gray-600 group-hover:text-red-400 transition-colors" />
        </div>
        <div className="space-y-2">
          {phaseDistribution.map(phase => (
            <div key={phase.name} className="flex items-center gap-3">
              <span className="text-lg">{phase.emoji}</span>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{phase.name}</span>
                  <span style={{ color: phase.color }}>{phase.count} jogador{phase.count !== 1 ? 'es' : ''}</span>
                </div>
                <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: players.length > 0 ? `${(phase.count / players.length) * 100}%` : '0%',
                      background: phase.color,
                      boxShadow: `0 0 8px ${phase.color}66`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </button>

      {players.length > 0 && (
        <button
          onClick={() => { console.log('[Dashboard] Clicou em Visão Rápida dos Jogadores'); onNavigate('players'); }}
          className="w-full text-left card-dark rounded-xl p-4 hover:border-red-500/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-300" style={{ fontFamily: 'Cinzel, serif' }}>
              ⚔️ Visão Rápida dos Jogadores
            </h3>
            <ChevronRight size={16} className="text-gray-600 group-hover:text-red-400 transition-colors" />
          </div>
          <div className="space-y-2">
            {players.slice(0, 5).map(player => {
              const classInfo = CLASS_INFO[player.playerClass] || { emoji: '❓', color: '#9ca3af', description: 'Classe desconhecida' };
              const phase = getPhaseForLevel(player.level);
              return (
                <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors">
                  <span className="text-xl">{classInfo.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-200 truncate">{player.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${classInfo.color}22`, color: classInfo.color }}>
                        Nv.{player.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <HeartDisplay current={player.health} max={5} />
                      {phase && <span className="text-[10px] text-gray-500">{phase.emoji} {phase.name}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {players.length > 5 && (
              <p className="text-xs text-gray-500 text-center pt-1">+{players.length - 5} mais jogadores...</p>
            )}
          </div>
        </button>
      )}

      {recentLogs.length > 0 && (
        <button
          onClick={() => { console.log('[Dashboard] Clicou em Últimos Eventos'); onNavigate('log'); }}
          className="w-full text-left card-dark rounded-xl p-4 hover:border-red-500/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-300" style={{ fontFamily: 'Cinzel, serif' }}>📜 Últimos Eventos</h3>
            <ChevronRight size={16} className="text-gray-600 group-hover:text-red-400 transition-colors" />
          </div>
          <div className="space-y-1">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-start gap-2 text-xs py-1 border-b border-white/5 last:border-0">
                <span className="text-gray-600 min-w-fit">
                  {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`
                  ${log.type === 'death' ? 'text-red-400' : ''}
                  ${log.type === 'combat' ? 'text-orange-400' : ''}
                  ${log.type === 'reward' ? 'text-yellow-400' : ''}
                  ${log.type === 'level' ? 'text-purple-400' : ''}
                  ${log.type === 'boss' ? 'text-red-300' : ''}
                  ${log.type === 'trap' ? 'text-orange-300' : ''}
                  ${log.type === 'info' ? 'text-gray-400' : ''}
                `}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </button>
      )}

      {players.length === 0 && (
        <div className="card-dark rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">⚔️</div>
          <h3 className="text-lg font-bold text-gray-300 mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
            Nenhum aventureiro ainda
          </h3>
          <p className="text-sm text-gray-500 mb-4">Adicione jogadores para começar a aventura!</p>
          <button
            onClick={() => { console.log('[Dashboard] Clicou em Adicionar Primeiro Jogador'); onNavigate('players'); }}
            className="btn-red px-6 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
          >
            <Plus size={16} /> Adicionar Jogador
          </button>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  onClick: () => void;
}

function StatCard({ icon, label, value, color, onClick }: StatCardProps) {
  return (
    <button
      onClick={() => { console.log(`[StatCard] Clicou em: ${label}`); onClick(); }}
      className="card-dark rounded-xl p-3 flex flex-col items-center text-center hover:border-red-500/30 transition-colors cursor-pointer"
    >
      <div className="mb-1" style={{ color }}>{icon}</div>
      <div className="text-2xl font-bold text-gray-100">{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
    </button>
  );
}
