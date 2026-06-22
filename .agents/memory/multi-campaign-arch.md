---
name: Multi-campaign architecture
description: How per-campaign storage isolation is implemented across the RPG companion app.
---

All localStorage keys are scoped using `ck(campaignId, suffix)` from `src/campaignManager.ts`, producing keys of the form `rrs-c-{id}-{suffix}`.

**Key files:**
- `src/campaignManager.ts` — CRUD: loadCampaigns, createCampaign, deleteCampaignData, migrateOldDataIfNeeded, ck()
- `src/store.ts` — useGameStore(campaignId: string), uses keysRef = useRef({...}) for stable per-session keys
- `src/components/TabuleiroPanel.tsx` — accepts campaignId prop, uses keysRef for board/boss-pos keys
- `src/App.tsx` — GameApp inner component with key={activeCampaignId} ensures full hook remount on campaign switch

**Why key={campaignId} on GameApp:** React hook state cannot be reset in place; remounting the component via `key` is the only reliable way to reinitialize all useState/useRef values when switching campaigns.

**Migration:** migrateOldDataIfNeeded() called once on App startup — copies old global keys (reino-rei-sombrio-*) to rrs-c-legacy-* and registers a Campaign with id='legacy'.

**Campaign index:** stored at rrs-campaigns; last active stored at rrs-last-campaign.

**How to apply:** Any new stateful feature that needs per-campaign isolation should use ck(campaignId, 'new-suffix') as its storage key, initialized in a useRef inside the component.
