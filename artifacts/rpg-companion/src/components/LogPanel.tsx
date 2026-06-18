import { Trash2, ScrollText } from 'lucide-react';
import { GameLog } from '../types';

interface LogPanelProps {
  logs: GameLog[];
  clearLogs: () => void;
}

function getLogTypeStyle(type: GameLog['type']) {
  switch (type) {
    case 'death': return { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'MORTE' };
    case 'combat': return { color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'COMBATE' };
    case 'reward': return { color: '#eab308', bg: 'rgba(234,179,8,0.08)', label: 'RECOMPENSA' };
    case 'level': return { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', label: 'NÍVEL' };
    case 'boss': return { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', label: 'BOSS' };
    case 'trap': return { color: '#d97706', bg: 'rgba(217,119,6,0.08)', label: 'ARMADILHA' };
    case 'info': default: return { color: '#6b7280', bg: 'rgba(107,114,128,0.05)', label: 'INFO' };
  }
}

export default function LogPanel({ logs, clearLogs }: LogPanelProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-red-400 flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
          <ScrollText size={20} /> Registro de Eventos
        </h2>
        {logs.length > 0 && (
          <button onClick={clearLogs}
            className="btn-dark px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-red-400 flex items-center gap-1">
            <Trash2 size={12} /> Limpar
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="card-dark rounded-xl p-8 text-center">
          <div className="text-3xl mb-2">📜</div>
          <p className="text-gray-500 text-sm">Nenhum evento registrado ainda.</p>
          <p className="text-gray-600 text-xs mt-1">As ações do jogo aparecerão aqui automaticamente.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((log, idx) => {
            const style = getLogTypeStyle(log.type);
            return (
              <div
                key={log.id}
                className="flex items-start gap-2 p-2.5 rounded-lg transition-colors hover:brightness-110"
                style={{ background: style.bg, animationDelay: `${idx * 30}ms` }}
              >
                <span className="text-[10px] text-gray-600 min-w-[50px] pt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded min-w-[65px] text-center shrink-0"
                  style={{ color: style.color, background: `${style.color}15` }}>
                  {style.label}
                </span>
                <span className="text-xs flex-1" style={{ color: style.color === '#6b7280' ? '#9ca3af' : style.color }}>
                  {log.message}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
