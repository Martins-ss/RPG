import { useState } from 'react';
import { Campaign } from '../types';
import {
  loadCampaigns,
  createCampaign,
  deleteCampaignData,
  setLastCampaignId,
  getLastCampaignId,
} from '../campaignManager';
import Modal from './Modal';

interface CampaignScreenProps {
  onSelectCampaign: (id: string) => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function CampaignScreen({ onSelectCampaign }: CampaignScreenProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() =>
    [...loadCampaigns()].sort((a, b) => b.updatedAt - a.updatedAt)
  );
  const [creating, setCreating]           = useState(campaigns.length === 0);
  const [newName, setNewName]             = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const lastId = getLastCampaignId();

  const reload = () =>
    setCampaigns([...loadCampaigns()].sort((a, b) => b.updatedAt - a.updatedAt));

  const handleCreate = () => {
    const campaign = createCampaign(newName || 'Nova Campanha');
    reload();
    setCreating(false);
    setNewName('');
    onSelectCampaign(campaign.id);
  };

  const handleSelect = (id: string) => {
    setLastCampaignId(id);
    onSelectCampaign(id);
  };

  const handleDelete = (id: string) => {
    deleteCampaignData(id);
    reload();
    setConfirmDeleteId(null);
    if (campaigns.length <= 1) setCreating(true);
  };

  return (
    <div className="min-h-screen bg-dark-gradient flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs space-y-5">

        {/* Title */}
        <div className="text-center space-y-3">
          <div className="text-7xl">👑</div>
          <div>
            <h1
              className="text-2xl font-bold text-red-400"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              O Reino do Rei Sombrio
            </h1>
            <p className="text-[10px] text-gray-600 tracking-[0.25em] uppercase mt-1">
              RPG Físico Companion
            </p>
          </div>
        </div>

        {/* Continue last campaign (prominent) */}
        {lastId && campaigns.some(c => c.id === lastId) && (
          <button
            onClick={() => handleSelect(lastId)}
            className="w-full btn-red px-6 py-3.5 rounded-xl text-base font-bold"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            ▶ Continuar Campanha
          </button>
        )}

        {/* Campaign list */}
        {campaigns.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              📖 Campanhas Salvas
            </p>
            {campaigns.map(c => (
              <div
                key={c.id}
                className="card-dark rounded-xl p-3 flex items-center gap-2"
                style={{ border: c.id === lastId ? '1px solid rgba(239,68,68,0.25)' : undefined }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-200 truncate">{c.name}</p>
                  <p className="text-[10px] text-gray-600">
                    {formatDate(c.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleSelect(c.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0"
                  style={{
                    background: c.id === lastId ? 'rgba(220,38,38,0.25)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${c.id === lastId ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: c.id === lastId ? '#fca5a5' : '#9ca3af',
                  }}
                >
                  Jogar
                </button>
                <button
                  onClick={() => setConfirmDeleteId(c.id)}
                  className="px-2 py-1.5 rounded-lg text-xs text-red-900/70 hover:text-red-500 transition-colors"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create campaign form / button */}
        {creating ? (
          <div className="card-dark rounded-xl p-3 space-y-3">
            <p className="text-xs text-gray-400 font-semibold">
              {campaigns.length === 0 ? '⚔️ Iniciar Aventura' : '➕ Nova Campanha'}
            </p>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Nome da campanha..."
              maxLength={40}
              className="w-full rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none"
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            <div className="flex gap-2">
              {campaigns.length > 0 && (
                <button
                  onClick={() => { setCreating(false); setNewName(''); }}
                  className="flex-1 btn-dark px-3 py-2 rounded-lg text-xs text-gray-400"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={handleCreate}
                className="flex-1 btn-red px-3 py-2 rounded-lg text-xs font-bold"
              >
                {campaigns.length === 0 ? 'Iniciar' : 'Criar'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full btn-dark px-6 py-3 rounded-xl text-sm font-medium text-gray-300"
          >
            ➕ Nova Campanha
          </button>
        )}

        <p className="text-center text-[10px] text-gray-700">
          Todo o progresso é salvo automaticamente
        </p>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="🗑️ Apagar Campanha"
        size="sm"
      >
        {confirmDeleteId && (() => {
          const camp = campaigns.find(c => c.id === confirmDeleteId);
          return (
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-300 leading-relaxed">
                Apagar{' '}
                <strong className="text-red-400">"{camp?.name}"</strong>?
                <br />
                <span className="text-xs text-gray-500">
                  Todo o progresso será perdido permanentemente.
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 btn-dark px-4 py-2.5 rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-red-300 transition-colors"
                  style={{
                    background: 'rgba(127,29,29,0.5)',
                    border: '1px solid rgba(239,68,68,0.3)',
                  }}
                >
                  Apagar
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
