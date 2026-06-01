# Murder Mystery

**Hub ID:** `murder-mystery`  
**Path:** `games/murder-mystery/`  
**Play:** [http://localhost:8080/games/murder-mystery/](http://localhost:8080/games/murder-mystery/)

## Overview

All Out–style murder mystery social deduction. Uncover the killer before time runs out — or be the last one standing. Uses the shared **murder-3** template engine.

## Save & multiplayer

- **Save key:** `murder-mystery` (template default)
- **MP room:** `murder-mystery`

## Template

| Component | Path |
|-----------|------|
| Engine | `games/_templates/murder-3/engine.js` |
| Roles | `games/_templates/murder-3/roles.js` |
| Map | `games/_templates/murder-3/map.js` |
| Styles | `games/_templates/murder-3/style.css` |

Wrapper loads template scripts from `index.html` in this folder.

## Mechanics

- Day phase exploration on mansion map
- Role assignment (killer vs investigators)
- Autopsy, puzzles, and elimination win conditions
- Phase banner (☀️ Day / 🌙 Night)

## Key files

| File | Role |
|------|------|
| `index.html` | Thin wrapper → template |
| `game.js` | Game-specific config (if present) |

## See also

[Main design doc](../../GAME_DESIGN.md) · [Template map](../../all-out-template-map.js)
