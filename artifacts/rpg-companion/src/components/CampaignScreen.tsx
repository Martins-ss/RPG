import { useState } from 'react';
import Modal from './Modal';

interface CampaignScreenProps {
  hasSavedData: boolean;
  playerCount: number;
  defeatedBossCount: number;
  onContinue: () => void;
  onNewCampaign: () => void;
}

export default function CampaignScreen({
  hasSavedData,
  playerCount,
  defeatedBossCount,
  onContinue,
  onNewCampaign,
}: CampaignScreenProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleNewCampaign = () => {
    if (hasSavedData) {
      setShowConfirm(true);
    } else {
      onNewCampaign();
    }
  };

  return (
    <div className="min-h-screen bg-dark-gradient flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-xs w-full">

        <div className="space-y-3">
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

        {hasSavedData && (
          <div className="card-dark rounded-xl p-4 text-left space-y-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">📂 Campanha Salva</p>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{playerCount}</div>
                <div className="text-[10px] text-gray-500">
                  Aventureiro{playerCount !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{defeatedBossCount}</div>
                <div className="text-[10px] text-gray-500">
                  Boss{defeatedBossCount !== 1 ? 'es' : ''} Derrotado{defeatedBossCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {hasSavedData && (
            <button
              onClick={onContinue}
              className="w-full btn-red px-6 py-3.5 rounded-xl text-base font-bold"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              ▶ Continuar Campanha
            </button>
          )}
          <button
            onClick={handleNewCampaign}
            className="w-full btn-dark px-6 py-3.5 rounded-xl text-sm font-medium text-gray-300"
          >
            🆕 {hasSavedData ? 'Nova Campanha' : 'Iniciar Aventura'}
          </button>
        </div>

        <p className="text-[10px] text-gray-700">
          Todo o progresso é salvo automaticamente
        </p>
      </div>

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="⚠️ Nova Campanha"
        size="sm"
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-300 leading-relaxed">
            Iniciar uma nova campanha apagará <strong className="text-red-400">todo o progresso atual</strong>.
          </p>
          <div
            className="p-3 rounded-lg text-xs text-gray-500"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {playerCount} jogador{playerCount !== 1 ? 'es' : ''}, todos os inventários,
            histórico do tabuleiro e progresso dos bosses serão perdidos.
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 btn-dark px-4 py-2.5 rounded-lg text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={() => { setShowConfirm(false); onNewCampaign(); }}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-red-300 transition-colors"
              style={{ background: 'rgba(127,29,29,0.5)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              Apagar e Recomeçar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
