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

  // Single switch render — avoids multiple consecutive `condition && <Component>`
  // siblings in the JSX tree. Multiple `&&` conditionals produce a series of
  // `false | ReactElement` nodes that can confuse React's DOM reconciler on
  // mobile browsers, causing "insertBefore: node is not a child" errors when
  // rapid tab switches cause nodes to shift positions in the fiber tree.
  const renderPanel = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            players={store.players}
            logs={store.logs}
            onNavigate={setActiveTab}
          />
        );
      case 'players':
        return (
          <PlayersPanel
            players={store.players}
            addPlayer={store.addPlayer}
            removePlayer={store.removePlayer}
            adjustHealth={store.adjustHealth}
            addXP={store.addXP}
            setLevel={store.setLevel}
          />
        );
      case 'phases':
        return (
          <PhasesPanel
            players={store.players}
            addLog={store.addLog}
          />
        );
      case 'bosses':
        return (
          <BossesPanel
            players={store.players}
            addLog={store.addLog}
            adjustHealth={store.adjustHealth}
            bossHealths={store.bossHealths}
            adjustBossHealth={store.adjustBossHealth}
            resetBossHealth={store.resetBossHealth}
          />
        );
      case 'rewards':
        return (
          <RewardsPanel
            players={store.players}
            addItemToPlayer={store.addItemToPlayer}
            removeItemFromPlayer={store.removeItemFromPlayer}
          />
        );
      case 'log':
        return (
          <LogPanel
            logs={store.logs}
            clearLogs={store.clearLogs}
          />
        );
      case 'tabuleiro':
        return <TabuleiroPanel />;
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-dark-gradient">
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          playerCount={store.players.length}
        />
        <main className="max-w-2xl mx-auto px-4 py-4 pb-8">
          {renderPanel()}
        </main>
      </div>
    </ErrorBoundary>
  );
}
