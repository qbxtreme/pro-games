# Save A Brainrot

**Hub ID:** `save-a-brainrot`  
**Path:** `games/save-a-brainrot/`  
**Play:** [http://localhost:8080/games/save-a-brainrot/](http://localhost:8080/games/save-a-brainrot/)

## Overview

All Out–style rescue game: save brainrots before time runs out. Uses the shared **brainrot** template engine (save variant).

## Save & multiplayer

- **Save key:** `save-a-brainrot`
- **MP room:** `save-a-brainrot`

## Template

| Component | Path |
|-----------|------|
| Engine | `games/_templates/brainrot/engine.js` |
| Config | `games/_templates/brainrot/config-defaults.js` (variant: `save`) |
| Styles | `games/_templates/brainrot/style.css` |

Mapped in `all-out-template-map.js` with `variant: "save"`.

## Mechanics

- Explore and collect/rescue brainrot characters
- Level, coins, rebirth progression
- Pro Max Gear unlocks full Pro Shop gear

## Key files

| File | Role |
|------|------|
| `index.html` | Thin wrapper → template |

## See also

[Main design doc](../../GAME_DESIGN.md)
