# Raising a Monster

**Hub ID:** `raise-a-monster`  
**Path:** `games/raise-a-monster/`  
**Play:** [http://localhost:8080/games/raise-a-monster/](http://localhost:8080/games/raise-a-monster/)

## Overview

All Out–style backyard monster sim. Feed your monster, buy cosmetic/stat upgrades, battle wild mobs across 8 zones, and level up trainer + monster. Up to 10 multiplayer trainers.

## Save & multiplayer

- **Save key:** `raisingAMonster`
- **MP room:** `raise-a-monster`

## Zones (8 worlds)

Backyard → Deep Forest → Badlands → Volcano → Shadow Cavern → Frost Fields → Crystal Peak → Apex Realm  
Each has a level gate, mob set, and alpha boss.

## Upgrades (`UPGRADES`)

| ID | Effect |
|----|--------|
| horns | +5 attack |
| crown | +25 max HP |
| flame (Spicy Bib) | Unlocks **Special** battle move |
| aura | +8 atk, +15 HP |

## Battle

Attack, **Special** (if Spicy Bib owned), Flee. Special uses the shared **1-in-3 turn cycle** (turns 1, 4, 7…). **Top Trainers** leaderboard under **🎨 Upgrades**.

## Key files

| File | Role |
|------|------|
| `game.js` | Zones, battle, upgrades |
| `sprites.js` | Trainer + monster art |
| `index.html` | UI |
| `style.css` | Styling |

## See also

[Main design doc](../../GAME_DESIGN.md)
