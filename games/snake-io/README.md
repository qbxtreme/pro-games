# Snake I.O.

**Hub ID:** `hungry-snake-worm` (catalog; hidden from main grid)  
**Path:** `games/snake-io/`  
**Play:** [http://localhost:8080/games/snake-io/](http://localhost:8080/games/snake-io/)

## Overview

Slither.io–style multiplayer arena. Grow your snake by eating food, avoid other snakes’ bodies, boost for speed, and compete on ranked or unranked leaderboards. Includes an embedded mini-hub for name/color setup before entering the arena.

## Save & multiplayer

| Key | Purpose |
|-----|---------|
| `snakeIoBest` / `snakeIoBestRanked` / `snakeIoBestUnranked` | High scores |
| `snakeIoCoins` | Cosmetic currency |
| `snakeIoUnlockedSkins` | Unlocked skins |
| `snakeIoHubStats` | Hub stats |
| `snakeIoName`, `snakeIoColorIdx`, `snakeIoCosmetic` | Preferences (preserved on reset) |

**MP room:** `snake-io`

## Rules

- Circular world (~6400×6400); mouse steers; click/space boosts (1.85× speed)
- Die on collision with another snake’s body
- ~28 bots + online players; minimap and on-screen leaderboard while playing

## Redirect

`games/hungry-snake-worm/` redirects here (All Out catalog ID).

## Key files

| File | Role |
|------|------|
| `game.js` | Arena, snakes, bots, MP sync |
| `index.html` | Mini-hub + canvas |
| `style.css` | Arena + hub styling |

## See also

[Main design doc](../../GAME_DESIGN.md)
