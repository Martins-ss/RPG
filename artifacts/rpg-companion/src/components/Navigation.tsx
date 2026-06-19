import { LayoutDashboard, Users, Map, Skull, Gift, ScrollText, LayoutGrid } from 'lucide-react';
import { TabId } from '../types';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  playerCount: number;
}

const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
  { id: 'players', label: 'Jogadores', icon: Users },
  { id: 'phases', label: 'Fases', icon: Map },
  { id: 'bosses', label: 'Chefes', icon: Skull },
  { id: 'rewards', label: 'Recompensas', icon: Gift },
  { id: 'log', label: 'Registro', icon: ScrollText },
  { id: 'tabuleiro', label: 'Tabuleiro', icon: LayoutGrid },
];

export default function Navigation({ activeTab, onTabChange, playerCount }: NavigationProps) {
  return (
    <nav className="sticky top-0 z-40 border-b border-red-900/20" style={{ background: 'rgba(10,10,15,0.98)' }}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">💎</div>
          <div>
            <h1 className="text-lg font-bold text-red-400 text-glow-red leading-tight" style={{ fontFamily: 'Cinzel, serif' }}>
              O Reino do Rei Sombrio
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">RPG Físico Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Users size={14} />
          <span>{playerCount} jogador{playerCount !== 1 ? 'es' : ''}</span>
        </div>
      </div>

      <div className="flex overflow-x-auto no-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`nav-item flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all
                ${isActive ? 'active text-red-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
