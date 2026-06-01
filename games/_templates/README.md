# All Out Shared Templates

Reusable game engines cloned from [allout.game](https://allout.game) mechanics. Thin wrapper folders under `games/{id}/` load these templates via `all-out-template-map.js`.

## Active templates (wired to hub)

| Template | Games using it |
|----------|----------------|
| `murder-3` | Murder Mystery |
| `buttons` | 100 Buttons |
| `brainrot` | Save A Brainrot (`variant: save`) |
| `capture` | Mob Battle (local fork; template available) |
| `snake` | Hungry Snake → `snake-io/` |

## Template folder structure

Each template typically contains:

- `engine.js` — core game loop
- `config-defaults.js` — title, tagline, variant flags
- `style.css` — All Out cartoon UI
- Optional: `sprites.js`, `map.js`, `roles.js`

Shared base assets live in `_templates/base/`:

- `all-out-base.css`, `all-out-controls.js`, `all-out-easy.js`, `all-out-help.js`
- `game-mp-bootstrap.js` — multiplayer init helper

## Unwired templates

Many templates remain from the original 45-game catalog (horror, tycoon, shooter, etc.) but are **no longer linked** after catalog cleanup. They can be re-wired by adding entries to `all-out-games.js` and `all-out-template-map.js`.

Examples: `horror/`, `tycoon/`, `shooter/`, `battlegrounds/`, `infection/`, `digging/`, `chase/`, `sports/`, `merge-td/`, `slime-rng/`, `sigma/`, `survive/`, `hide-seek/`

## See also

[Main design doc](../../GAME_DESIGN.md) · [Template map](../../all-out-template-map.js)
