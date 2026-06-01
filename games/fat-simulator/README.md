# Coco Devouring (Fat Simulator)

**Hub ID:** `fat-simulator` · **Hub title:** Fat Simulator  
**In-game title:** Coco Devouring  
**Path:** `games/fat-simulator/`  
**Play:** [http://localhost:8080/games/fat-simulator/](http://localhost:8080/games/fat-simulator/)

## Overview

Top-down dog simulator inspired by All Out’s Fat Simulator. Walk an explorable house and neighborhood, eat snacks to gain **Fat**, sell fat for coins, fight bosses, hatch pets, and rebirth for permanent multipliers. The dog grows visually as fat increases.

## Save & multiplayer

- **Save key:** `dogFatSimulator`
- **MP room:** `fat-simulator`

## Home world (`eat` zone)

Walkable floor plan: Kitchen, Living Room, Bedroom, Hallway, Garage, Front/Back Yard, **Main Street**, and three neighbor houses with higher-fat snacks. Kitchen **food bowl** — hold **EAT** for tiered food.

## Other zones (nav tabs)

Sell, Shop, Boss, Eggs, PVP, Rebirth — abstract mini-areas (not walkable map extensions).

## Progression

Fat → sell for coins → boss trophies → pet eggs (multipliers) → rebirth at 10,000+ fat (+15% permanent fat each).

## Dog breeds

Golden, Husky, Corgi, Pug — cosmetic via `BREEDS` / `sprites.js`

## Key files

| File | Role |
|------|------|
| `game.js` | World, snacks, zones, progression |
| `sprites.js` | Dog and snack art |
| `index.html` | UI |
| `style.css` | Styling |

## See also

[Main design doc](../../GAME_DESIGN.md)
