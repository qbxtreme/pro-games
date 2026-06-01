# Dragon Upgrade (Dragon Plains)

**Hub ID:** `dragon-plains`  
**Path:** `games/dragon-plains/`  
**Play:** [http://localhost:8080/games/dragon-plains/](http://localhost:8080/games/dragon-plains/)

## Overview

Casey’s original large-scale tile RPG. Explore a 100×100 procedural world, collect dragons, forage plants, fight wild blob mobs, and run turn-based pet battles across two worlds with distinct element cycles.

## Save & multiplayer

- **Save key:** `dragonForestSave`
- **MP room:** `dragon-plains` · subrooms: `world-1`, `world-2`

## Core mechanics

- **Biomes:** Plains, Forest, Ocean, Volcano, Sky, Cave, Ice, Hurricane, Mad Green, Lava, Hub (Crystal Rift)
- **Elements:** World 1 — fire/water/earth/air; World 2 — ice/hurricane/madgreen/lava
- **Progression:** Trainer level + XP; dragon pets up to very high levels; stars via Star Dust shop
- **Daily:** 5 coins; hub-style wheel spins (3 per 6 hours in-game)
- **World Two** unlocks after World One complete

## Controls

Joystick / WASD on the overworld; turn-based battle menus in encounters.

## Key files

| File | Role |
|------|------|
| `game.js` | Main game loop |
| `world.js` | Map generation, biomes, rendering |
| `battle.js` | Turn-based combat |
| `index.html` | UI |
| `style.css` | Styling |

## See also

[Main design doc](../../GAME_DESIGN.md)
