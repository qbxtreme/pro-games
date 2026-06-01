# Random Roles

**Hub ID:** `random-roles`  
**Path:** `games/random-roles/`  
**Play:** [http://localhost:8080/games/random-roles/](http://localhost:8080/games/random-roles/)

## Overview

All Out–style day/night social deduction in a cartoon sticker town. 11 roles across 3 factions, tile-based map with 8 connected areas, and bot-filled lobbies.

## Save & multiplayer

- **No persistent save** — round-based
- **MP room:** `random-roles` (hooks exist; round logic is primarily local vs bots)

## Factions & roles (`roles.js`)

**Protect:** Doctor, Sheriff, Coroner, Vigilante  
**Betray:** Werewolf, Hitman, Pirate, Hunter  
**Rogue:** Anarchist (win at Chaos 3), Jester (voted out), Survivor (≤3 alive)

## Map (`map.js`)

Mansion, Town Square, Market, Watchtower, Graveyard, Tavern, Park, Docks

## Day / night loop

- **Day:** Walk, report bodies (🚨), call meetings (📢)
- **Meeting:** Vote to eject; Jester wins if ejected
- **Night:** Role abilities via 🌙 ABILITY overlay

Default lobby: **1 human + 8 bots** (`BOT_COUNT = 8`).

## Key files

| File | Role |
|------|------|
| `game.js` | Phase loop, voting, win checks |
| `roles.js` | Role definitions |
| `map.js` | Tile world + collision |
| `index.html` | UI, hotbar, overlays |
| `style.css` | Styling |

## See also

[Main design doc](../../GAME_DESIGN.md)
