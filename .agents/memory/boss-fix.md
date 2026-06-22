---
name: Boss duplication fix
description: How boss duplication across biomes was eliminated in the board (TabuleiroPanel).
---

**Root cause:** Old global boss position key (reino-rei-sombrio-boss-positions-v2) was shared and could contain out-of-range positions for bosses (e.g., Floresta boss appearing in Castelo cells).

**Fix (three layers):**
1. **Per-campaign isolation** — each campaign has its own boss-pos key via ck(campaignId, 'boss-pos'). New campaigns always start fresh.
2. **Range validation on load** — loadBossPositions(key) checks every boss against its phaseDef.range. Any out-of-range position is reassigned randomly within the correct range and saved.
3. **Phase check on render** — handleCellClick in TabuleiroPanel only triggers a boss encounter when `b.phase === phase` (the cell's biome), preventing cross-biome matches even if positions somehow collide.

**Why:** Boss positions are per-phase; a Floresta boss can only occupy cells 1-24, Cidade Abandonada 25-41, Castelo 42-68. Enforcing this at load time + at render time provides defense in depth.
