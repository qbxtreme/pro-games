# Brawl Stars Mod

**Hub ID:** `brawl-stars-mod`  
**Path:** `games/brawl-stars-mod/`  
**Play:** [http://localhost:8080/games/brawl-stars-mod/](http://localhost:8080/games/brawl-stars-mod/)

## Overview

Top-down Brawl Stars–style mod with a full brawler roster (rarity tiers from Common through Ultra God), Showdown with shrinking poison, 20+ modded game modes, Brawl Pass, coin shop, and a **Play World** hub with a merge machine for secret brawlers.

## Save & multiplayer

| Key | Purpose |
|-----|---------|
| `brawlStarsMod` | Main progress |
| `brawlStarsModCoins` | Coins |
| `brawlStarsModPassTier` / `brawlStarsModPassXp` | Brawl Pass |
| `brawlStarsModUnlock_*` | Per-brawler unlocks |
| `brawlStarsModSiriusUnlocked` | Pass T50 reward |
| `brawlStarsModGodUnlocked` | Pass T100 / merge |
| `brawlStarsModOohLaLaUnlocked` | Merge recipe |
| `brawlStarsModCocoUnlocked` | Pass T200 / merge |

**MP room:** `brawl-stars-mod`

## Brawl Pass (200 tiers)

- **300 XP per tier** (`PASS_XP_PER_TIER`)
- **Tier 50:** Sirius (Ultra Legendary) — not sold in shop
- **Tier 100:** ?????.exe (God Brawler) + 1000 coins
- **Tier 200:** Coco (Ultra God) + 2000 coins
- **Tiers 101–199:** Rotating cosmetic prizes from `PASS_PRIZE_POOL`

## Merge Machine (Play World)

Walk to the center machine and press **E** (Coco merge prioritized when ready):

| Result | Ingredients |
|--------|-------------|
| ?????.exe | Sirius + Kit |
| Ooh La La | Shelly + Colt |
| Coco 🥥 | ?????.exe + Ooh La La |

## Shop rules

- **Purchasable:** Super Rare → Ultra Legendary (2500–5000 coins)
- **Not purchasable:** God, Ultra God rarities; Sirius; any `GOD_PLAYABLE_IDS`
- Common + Rare starters are free

## Game modes

**Showdown:** Solo, Duo, Trio  
**3v3:** Gem Grab, Brawl Ball, Goal Rush, Basket Brawl, Volley Brawl, Heist, Hot Zone, Knockout, Bounty, Wipeout, Payload  
**Special:** Trophy Thieves, Hold the Trophy, Present Plunder  
**Co-op PvE:** Big Game, Robo Rumble, Boss Fight, Super City Rampage

## Key files

| File | Role |
|------|------|
| `game.js` | Core loop, pass, shop, merge, modes |
| `brawlers-roster.js` | Full brawler list + rarities |
| `brawler-attacks.js` | Per-brawler attack definitions |
| `index.html` | UI shell, roster sections, pass |
| `style.css` | Hub + arena styling |
| `fullscreen.js` | Fullscreen helper |

## See also

[Main design doc](../../GAME_DESIGN.md)
