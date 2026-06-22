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
import CampaignScreen from './components/CampaignScreen';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [campaignPhase, setCampaignPhase] = useState<'menu' | 'playing'>('menu');
  const store = useGameStore();

  // Campaign start screen — always shown on fresh load
  if (campaignPhase === 'menu') {
    return (
      <ErrorBoundary>
        <CampaignScreen
          hasSavedData={store.players.length > 0 || store.logs.length > 0}
          playerCount={store.players.length}
          defeatedBossCount={Object.keys(store.bossDefeats).length}
          onContinue={() => setCampaignPhase('playing')}
          onNewCampaign={() => { store.resetAll(); setCampaignPhase('playing'); }}
        />
      </ErrorBoundary>
    );
  }

  // Single switch render — avoids multiple consecutive `condition && <Component>`
  // siblings causing React reconciliation errors on mobile browsers.
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
            adjustGold={store.adjustGold}
            adjustCrystals={store.adjustCrystals}
            toggleArmorPiece={store.toggleArmorPiece}
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
            bossDefeats={store.bossDefeats}
            adjustBossHealth={store.adjustBossHealth}
            resetBossHealth={store.resetBossHealth}
            defeatBoss={store.defeatBoss}
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
        return (
          <TabuleiroPanel
            players={store.players}
            bossHealths={store.bossHealths}
            bossDefeats={store.bossDefeats}
          />
        );
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
        <main className="max-w-2xl mx-auto px-4 py-4 pb-24">
          {renderPanel()}
        </main>
      </div>
    </ErrorBoundary>
  );
}
