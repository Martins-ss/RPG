import { useState } from 'react';
import { TabId } from './types';
import { useGameStore } from './store';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import PlayersPanel from './components/PlayersPanel';
import PhasesPanel from './components/PhasesPanel';
import BossesPanel from './components/BossesPanel';
import RewardsPanel from './components/RewardsPanel';
import LogPanel from './components/LogPanel';
import TabuleiroPanel from './components/TabuleiroPanel';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const store = useGameStore();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-dark-gradient">
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          playerCount={store.players.length}
        />
        <main className="max-w-2xl mx-auto px-4 py-4 pb-8">
          {activeTab === 'dashboard' && (
            <Dashboard
              players={store.players}
              logs={store.logs}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'players' && (
            <PlayersPanel
              players={store.players}
              addPlayer={store.addPlayer}
              removePlayer={store.removePlayer}
              adjustHealth={store.adjustHealth}
              addXP={store.addXP}
              setLevel={store.setLevel}
            />
          )}
          {activeTab === 'phases' && (
            <PhasesPanel
              players={store.players}
              addLog={store.addLog}
            />
          )}
          {activeTab === 'bosses' && (
            <BossesPanel
              players={store.players}
              addLog={store.addLog}
              adjustHealth={store.adjustHealth}
              bossHealths={store.bossHealths}
              adjustBossHealth={store.adjustBossHealth}
              resetBossHealth={store.resetBossHealth}
            />
          )}
          {activeTab === 'rewards' && (
            <RewardsPanel
              players={store.players}
              addItemToPlayer={store.addItemToPlayer}
              removeItemFromPlayer={store.removeItemFromPlayer}
            />
          )}
          {activeTab === 'log' && (
            <LogPanel
              logs={store.logs}
              clearLogs={store.clearLogs}
            />
          )}
          {activeTab === 'tabuleiro' && (
            <TabuleiroPanel />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
