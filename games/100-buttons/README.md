# 100 Buttons

**Hub ID:** `100-buttons`  
**Path:** `games/100-buttons/`  
**Play:** [http://localhost:8080/games/100-buttons/](http://localhost:8080/games/100-buttons/)

## Overview

All Out–style party game: press buttons, survive traps, and be the last one standing. Uses the shared **buttons** template engine.

## Save & multiplayer

- **Save key:** `100-buttons`
- **MP room:** `100-buttons`

## Template

| Component | Path |
|-----------|------|
| Engine | `games/_templates/buttons/engine.js` |
| Config | `games/_templates/buttons/config-defaults.js` |
| Styles | `games/_templates/buttons/style.css` |

## Mechanics

- Tiered button grid with rising chaos
- Traps eliminate players; last standing wins
- HUD: tier, chaos %, buttons pressed, best tier

## Key files

| File | Role |
|------|------|
| `index.html` | Thin wrapper → template |

## See also

[Main design doc](../../GAME_DESIGN.md)
