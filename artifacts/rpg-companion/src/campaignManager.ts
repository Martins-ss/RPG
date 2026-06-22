import { v4 as uuidv4 } from 'uuid';
import { Campaign } from './types';

const CAMPAIGNS_INDEX_KEY = 'rrs-campaigns';
const LAST_CAMPAIGN_KEY   = 'rrs-last-campaign';

// Per-campaign storage key prefix
export function ck(campaignId: string, suffix: string): string {
  return `rrs-c-${campaignId}-${suffix}`;
}

export function loadCampaigns(): Campaign[] {
  try {
    const s = localStorage.getItem(CAMPAIGNS_INDEX_KEY);
    if (s) {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) {
        return arr.filter(
          (c: unknown): c is Campaign =>
            typeof c === 'object' && c !== null &&
            typeof (c as Campaign).id === 'string' &&
            typeof (c as Campaign).name === 'string'
        );
      }
    }
  } catch {}
  return [];
}

export function saveCampaignsIndex(campaigns: Campaign[]): void {
  try { localStorage.setItem(CAMPAIGNS_INDEX_KEY, JSON.stringify(campaigns)); } catch {}
}

export function getLastCampaignId(): string | null {
  try { return localStorage.getItem(LAST_CAMPAIGN_KEY); } catch { return null; }
}

export function setLastCampaignId(id: string): void {
  try { localStorage.setItem(LAST_CAMPAIGN_KEY, id); } catch {}
}

export function createCampaign(name: string): Campaign {
  const campaign: Campaign = {
    id: uuidv4(),
    name: name.trim() || 'Nova Campanha',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const existing = loadCampaigns();
  saveCampaignsIndex([...existing, campaign]);
  setLastCampaignId(campaign.id);
  return campaign;
}

export function touchCampaign(id: string): void {
  const campaigns = loadCampaigns();
  const idx = campaigns.findIndex(c => c.id === id);
  if (idx >= 0) {
    campaigns[idx] = { ...campaigns[idx], updatedAt: Date.now() };
    saveCampaignsIndex(campaigns);
  }
}

export function deleteCampaignData(id: string): void {
  const keysToRemove: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`rrs-c-${id}-`)) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {}
  const updated = loadCampaigns().filter(c => c.id !== id);
  saveCampaignsIndex(updated);
  if (getLastCampaignId() === id) {
    try { localStorage.removeItem(LAST_CAMPAIGN_KEY); } catch {}
  }
}

// One-time migration of old single-campaign data into the new per-campaign format.
// Returns the legacy Campaign object if migration happened (or was already done), null otherwise.
export function migrateOldDataIfNeeded(): Campaign | null {
  const OLD_KEYS: [string, string][] = [
    ['reino-rei-sombrio',                   ck('legacy', 'players')],
    ['reino-rei-sombrio-bosses',            ck('legacy', 'bosses')],
    ['reino-rei-sombrio-boss-derrotas',     ck('legacy', 'boss-defeats')],
    ['reino-rei-sombrio-tabuleiro-v3',      ck('legacy', 'board')],
    ['reino-rei-sombrio-boss-positions-v2', ck('legacy', 'boss-pos')],
  ];

  const hasOldData = OLD_KEYS.some(([oldKey]) => localStorage.getItem(oldKey) !== null);
  if (!hasOldData) return null;

  const campaigns = loadCampaigns();
  const existing = campaigns.find(c => c.id === 'legacy');
  if (existing) return existing;

  for (const [oldKey, newKey] of OLD_KEYS) {
    try {
      const val = localStorage.getItem(oldKey);
      if (val) localStorage.setItem(newKey, val);
    } catch {}
  }

  const legacyCampaign: Campaign = {
    id: 'legacy',
    name: 'Campanha Salva',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveCampaignsIndex([legacyCampaign]);
  setLastCampaignId('legacy');
  return legacyCampaign;
}
