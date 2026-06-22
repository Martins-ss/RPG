import { useState } from 'react';
import { TabId } from './types';
import { useGameStore } from './store';
import { migrateOldDataIfNeeded, getLastCampaignId, loadCampaigns } from './campaignManager';
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

// ─── Inner game component — remounts entirely when campaignId changes ─────────

function GameApp({
  campaignId,
  onBackToMenu,
}: {
  campaignId: string;
  onBackToMenu: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const store = useGameStore(campaignId);

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
            campaignId={campaignId}
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
    <div className="min-h-screen bg-dark-gradient">
      {/* Slim campaign bar */}
      <div
        className="flex items-center justify-between px-4 py-1"
        style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <button
          onClick={onBackToMenu}
          className="text-[10px] text-gray-700 hover:text-gray-400 transition-colors flex items-center gap-1"
        >
          ← Campanhas
        </button>
        <span className="text-[10px] text-gray-800">
          {campaignId === 'legacy' ? 'Campanha Salva' : ''}
        </span>
      </div>
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        playerCount={store.players.length}
      />
      <main className="max-w-2xl mx-auto px-4 py-4 pb-24">
        {renderPanel()}
      </main>
    </div>
  );
}

// ─── Root app ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(() => {
    // Migrate old single-campaign data once on startup
    migrateOldDataIfNeeded();
    // If there's exactly one campaign and a last-campaign saved, auto-select it
    // (to avoid breaking existing users who just had one campaign)
    const campaigns = loadCampaigns();
    const lastId = getLastCampaignId();
    if (campaigns.length === 1 && lastId && campaigns[0].id === lastId) {
      return null; // still show menu so user sees the new campaigns UI
    }
    return null;
  });

  if (!activeCampaignId) {
    return (
      <ErrorBoundary>
        <CampaignScreen onSelectCampaign={setActiveCampaignId} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <GameApp
        key={activeCampaignId}
        campaignId={activeCampaignId}
        onBackToMenu={() => setActiveCampaignId(null)}
      />
    </ErrorBoundary>
  );
}
