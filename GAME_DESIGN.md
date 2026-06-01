# Become a Pro — Game Design & Rules Reference

This document captures the game rules, mechanics, UI conventions, and design intent for the **Become a Pro** hub (`pet-game`). It is meant for future agents and developers so changes stay consistent with what was built.

**Run the project:** `npm start` → [http://localhost:8080/](http://localhost:8080/)  
Use **Cmd+Shift+R** (hard refresh) after code changes. Multiplayer requires `npm start` (Node server), not a plain static file server.

Each playable game also has its own **`README.md`** in its folder under `games/` — see [Per-game documentation](#per-game-documentation).

---

## Hub — Pro Games

**Files:** `index.html`, `hub.js`, `hub.css`, `server.js`, `all-out-games.js`, `all-out-template-map.js`

### Purpose
Central launcher for all mini-games. Tracks Pro Tokens, Pro Level, daily rewards, token shop, spin-the-wheel, “Make a game” submissions, and Pro Max Gear.

### Games on the grid

The hub builds its grid from **`BAP_ORIGINALS`** (`hub.js`) plus **`ALL_OUT_GAMES`** (`all-out-games.js`), minus entries in **`HUB_HIDDEN_GAME_IDS`**.

| Hub ID | Title | Path | Engine | Notes |
|--------|-------|------|--------|-------|
| `dragon-plains` | Dragon Upgrade | `games/dragon-plains/` | Local | Casey’s original dragon RPG |
| `brawl-stars-mod` | Brawl Stars Mod | `games/brawl-stars-mod/` | Local | Showdown brawler + 200-tier pass |
| `fishermon` | Fishermon | `games/fishermon/` | Local | Full custom fishing RPG |
| `murder-mystery` | 🔪 Murder Mystery | `games/murder-mystery/` | Template `murder-3` | Social deduction |
| `random-roles` | Random Roles | `games/random-roles/` | Local | 11-role social deduction |
| `meme-car` | Meme Car | `games/meme-car-race/` | Local | Side-scrolling racer + PVP |
| `mob-battle` | Mob Battle | `games/mob-battle/` | Local | Capture & battle mobs |
| `100-buttons` | 100 Buttons | `games/100-buttons/` | Template `buttons` | Party trap survival |
| `save-a-brainrot` | Save A Brainrot | `games/save-a-brainrot/` | Template `brainrot` | Rescue brainrots |
| `fat-simulator` | Fat Simulator | `games/fat-simulator/` | Local | Hub card title; in-game **Coco Devouring** |
| `raise-a-monster` | Raising a Monster | `games/raise-a-monster/` | Local | Feed, battle, zone progression |

**Hidden from grid but still in catalog:**
| Hub ID | Title | Path | Notes |
|--------|-------|------|-------|
| `hungry-snake-worm` | Snake.io | `games/snake-io/` | Catalog ID redirects to `snake-io/`; listed as BAP original |

**Footer link (not on main grid):**
| Title | Path |
|-------|------|
| Math Olympiad | `games/math-olympiad/` |

**Total visible on grid:** 13 games (3 originals + 10 All Out catalog entries).

### Hub economy
- **Pro Tokens** — shared currency (`becomeAProTokens` in localStorage)
- **Daily reward:** 5 free tokens OR watch a 5-second “ad” for 15 tokens (once per calendar day)
- **Token packs:** 100 / 500 / 1200 / 3000 tokens via Stripe — see [Stripe payments](#stripe-payments-agent-reference)
- **Make a game:** costs **200 Pro Tokens**; POST to `/api/game-request`, saved to `game-requests.jsonl`
- **Pro Level:** count of unique hub games opened + 1
- **Token wheel:** bottom-left **🎡 Spin the wheel** — 3 spins per 6-hour period; prizes 3–100 tokens
- **API for games:** `window.BecomeAPro.getTokens()`, `.spendTokens(n)`, `.recordGamePlayed(id)`, `.resetAllTokens()`

### Pro Max Gear (`pro-max-gear.js`)
One-time (or re-runnable from Settings) max-upgrade injection into game saves: tranq/shop gear for capture games, rods for Fishermon, horns/crown/flame/aura for Raise a Monster, meme cars, brainrot Pro Shop, etc. Flag: `proMaxGearAppliedV1`.

### Reset progress (`reset-progress.js`)
Settings → **Reset all game progress** clears level/score/coin saves but preserves nicknames, skin picks, and owner boost.

---

## Removed games (catalog cleanup)

**34 All Out catalog games** were removed in two batches. Folders deleted; shared templates under `games/_templates/` may remain for reuse.

**Batch 1 (14):** Merge Zombie Defense, 99 Nights, King of the Hill, Don't Wake Brain Rots, Survive, Digging Simulator, Escape Tsunami Brain Rot, Backrooms, Save a YouTuber, Gun Game, Hunger Games, Gunner.io, Banner Battles, Counterfeit Tycoon

**Batch 2 (20):** Infection, Schleem Soccer, Who Killed My Crush?, Who Killed Barry?, Who Killed Sprunki?, Slime RNG, Sigma Game, Evolve a Brainrot, Fatten a Brainrot, Dino Park, Hide & Seek, Blood Rain, Red Sun, Breaking Brainrots Bones, Ant Army, Battlegrounds, Meme Zoo, Millionaire City RP, Five Nights at The Office, The Mimicer

**Other removed originals:** Pokémon Crossroads, Mow Rush

**Never implemented:** Wordle (requested then cancelled)

---

## Shared systems (all games)

### Multiplayer — `game-multiplayer.js` + `game-multiplayer.css`
- HTTP polling sync via `/api/mp/*` (works with `server.js`)
- **Max 10 players** per game room/subroom
- Each game calls `GameMP.init({ game, subroom, getName, getState, onPeers })` then `GameMP.start()`
- Shows badge next to ⚙️ Settings: `👥 Multiplayer`, `👥 N online`, or solo offline mode
- Subrooms vary by game (e.g. Dragon Plains uses `world-{1|2}`, Fishermon uses zone subrooms)

### Chat — `game-chat.js` + `game-chat.css`
- Floating chat per game room (`GameChat.init({ room, getName })`)
- Room IDs match game hub IDs (`fat-simulator`, `brawl-stars-mod`, etc.)

### All Out template wiring
- **`all-out-games.js`** — catalog metadata (title, thumbnail, All Out ID)
- **`all-out-template-map.js`** — maps catalog IDs to template engines and paths
- **`games/_templates/`** — shared engines (`buttons`, `brainrot`, `murder-3`, `capture`, etc.)
- Template games load `../_templates/{name}/engine.js` + `config-defaults.js` via thin wrapper folders

### Common UI patterns

#### Top Trainers leaderboard under shop button
- **Raising a Monster:** `#leaderboard` inside `.shop-stack` under **🎨 Upgrades**
- Only visible when `#app.playing`; sorted by level; shows you + remote players (top 8)

#### Action button flicker fix (Raising a Monster, Random Roles)
- `setBtnVisible(el, show)` — only toggles DOM when visibility actually changes
- `stickyNear(dist, showAt, hideAt, key)` — hysteresis so buttons don’t flash at range edges
- CSS: `transform: translateZ(0)` on floating action buttons

#### Battle special attacks — 1-in-3 turn cycle
Used in **Raising a Monster**:
- Special ready on player turns **1, 4, 7, …** (`specialTurnsLeft()` based on `battle.playerTurn`)
- **Special** — unlocked by **Spicy Bib** upgrade
- UI: `#special-status` banner (green READY / orange countdown); button uses `.cooldown` class, not `disabled`

#### Visual style — All Out–inspired games
Random Roles, Raising a Monster, template games use:
- Bright cartoon UI, thick black borders, Comic Sans / system-ui fonts
- All Out marketing copy on start screens
- All Out thumbnail URLs on hub cards where `allOut: true`

---

## Game: Brawl Stars Mod (`games/brawl-stars-mod/`)

**Hub title:** Brawl Stars Mod · **Save keys:** `brawlStarsMod`, `brawlStarsModCoins`, pass/quest/unlock keys · **MP room:** `brawl-stars-mod`  
**See also:** [games/brawl-stars-mod/README.md](games/brawl-stars-mod/README.md)

### Concept
Top-down Brawl Stars–style mod: large roster of brawlers by rarity, Solo/Duo/Trio Showdown with shrinking poison, 20+ modded game modes, Brawl Pass (200 tiers), coin shop, Play World hub with merge machine, character rank progression to **God** rank.

### Key constants
- `PASS_MAX_TIER = 200`, `PASS_XP_PER_TIER = 300`
- Milestones: **Tier 50** → Sirius (Ultra Legendary), **Tier 100** → ?????.exe (God), **Tier 200** → Coco (Ultra God) + 2000 coins
- Tiers 101–199: rotating prizes from `PASS_PRIZE_POOL`
- God brawlers: `questionexe`, `oohlala`, `coco` — not shop-purchasable (`god` / `ultraGod` rarities)
- Sirius excluded from shop (Pass T50 only)

### Merge Machine (Play World)
Center of hub map; press **E** or merge button when near:
| Recipe | Ingredients | Result |
|--------|-------------|--------|
| ?????.exe | Sirius + Kit | God brawler |
| Ooh La La | Shelly + Colt | Ooh La La |
| Ultra God · Coco | ?????.exe + Ooh La La | Coco 🥥 |

Unlock keys: `brawlStarsModGodUnlocked`, `brawlStarsModOohLaLaUnlocked`, `brawlStarsModCocoUnlocked`, `brawlStarsModSiriusUnlocked`

### Shop rules
- Purchasable rarities: Super Rare through Ultra Legendary (coin prices 2500–5000)
- Common + Rare free starters; God/Ultra God and Sirius blocked with toast message
- `isShopPurchasable()` enforces non-purchase for special brawlers

### Game modes (`BS_GAME_MODES`)
Categories: **Showdown** (Solo/Duo/Trio), **3v3** (Gem Grab, Brawl Ball, Heist, Hot Zone, Knockout, etc.), **Special**, **Co-op PvE** (Big Game, Robo Rumble, Boss Fight, Super City Rampage)

### Files
`game.js`, `index.html`, `style.css`, `brawler-attacks.js`, `brawlers-roster.js`, `fullscreen.js`

---

## Game: Coco Devouring (`games/fat-simulator/`)

**Hub title:** Fat Simulator · **In-game title:** Coco Devouring · **Save key:** `dogFatSimulator` · **MP room:** `fat-simulator`  
**See also:** [games/fat-simulator/README.md](games/fat-simulator/README.md)

### Concept
Top-down dog walks a detailed house and neighborhood, devours snacks for **Fat**, sells fat for coins, fights bosses, hatches pets, rebirths for permanent boosts. Dog gets visually larger as fat increases.

### Controls
Arrow keys / WASD + on-screen move pad in Home zone; walk into snacks to auto-collect.

### Home world (zone `eat`)
Explorable 2D floor plan: Kitchen, Living Room, Bedroom, Hallway, Garage, Front/Back Yard, plus **Main Street** and three neighbor houses (higher-fat snacks). Food bowl in kitchen (hold **EAT** for tiered food).

### Other zones (bottom nav tabs)
Sell, Shop, Boss, Eggs, PVP, Rebirth — abstract mini-areas, not walkable map extensions.

### Progression
Fat → coins (sell) → trophies (bosses) → pets (multipliers) → rebirth at 10,000+ fat (+15% permanent fat each).

---

## Game: Raising a Monster (`games/raise-a-monster/`)

**Save:** `raisingAMonster` · **MP:** `raise-a-monster`  
**See also:** [games/raise-a-monster/README.md](games/raise-a-monster/README.md)

Feed monster in backyard, buy upgrades, battle wild mobs across 8 zones, level trainer + monster. **Special** attack (Spicy Bib) on 1-in-3 turn cycle. **Top Trainers** leaderboard under **🎨 Upgrades**.

---

## Game: Random Roles (`games/random-roles/`)

**MP room:** `random-roles` · **No persistent save** — round-based  
**See also:** [games/random-roles/README.md](games/random-roles/README.md)

Day/night social deduction: 11 roles, 3 factions (Protect / Betray / Rogue), 8 connected map areas, 1 human + 8 bots default lobby.

---

## Game: Meme Car (`games/meme-car-race/`)

**Save:** `memeCarRaceSave` · **MP:** `meme-car-race`  
**See also:** [games/meme-car-race/README.md](games/meme-car-race/README.md)

Side-scrolling meme car racer — three worlds (Oasis, Steampunk, Cyber), collectible meme cars, solo (3 lives) or PVP blaster races.

---

## Game: Snake I.O. (`games/snake-io/`)

**Hub ID:** `hungry-snake-worm` (hidden duplicate entry) · **Save:** `snakeIoBest`, coins, skins, hub stats · **MP:** `snake-io`  
**See also:** [games/snake-io/README.md](games/snake-io/README.md)

Slither.io–style arena: grow snake, boost, ranked/unranked modes, minimap, leaderboard, embedded mini-hub for arena setup.

---

## Game: Dragon Upgrade (`games/dragon-plains/`)

**Save:** `dragonForestSave` · **MP:** `dragon-plains`, subroom `world-{n}`  
**See also:** [games/dragon-plains/README.md](games/dragon-plains/README.md)

Large tile-based RPG: 100×100 map, biomes, dragon collection, turn-based pet battles, two worlds, trainer level up to extreme pet levels.

---

## Game: Fishermon (`games/fishermon/`)

**Save:** `fishermon` · **MP:** `fishermon`  
**See also:** [games/fishermon/README.md](games/fishermon/README.md)

Full fishing RPG: rods, bait, zones, sailing between docks, mythic bosses, pearls, PvP.

---

## Template-based All Out games

| Hub ID | Folder | Template | README |
|--------|--------|----------|--------|
| `murder-mystery` | `games/murder-mystery/` | `murder-3` | [README](games/murder-mystery/README.md) |
| `100-buttons` | `games/100-buttons/` | `buttons` | [README](games/100-buttons/README.md) |
| `save-a-brainrot` | `games/save-a-brainrot/` | `brainrot` | [README](games/save-a-brainrot/README.md) |

---

## Game: Mob Battle (`games/mob-battle/`)

**Save:** `mob-battle` · **MP:** `mob-battle`  
**See also:** [games/mob-battle/README.md](games/mob-battle/README.md)

Dino Park–style capture loop with Mob Battle branding: walk world, battle/capture mobs, level up.

---

## Game: Math Olympiad (`games/math-olympiad/`)

**Save:** `mathOlympiadBest` · **No MP**  
**See also:** [games/math-olympiad/README.md](games/math-olympiad/README.md)

50-question math quiz across 5 difficulty sets (Easy → Insane). Linked from hub footer, not main grid.

---

## Stripe payments (agent reference)

Pro Token packs are sold through **Stripe Checkout** (one-time payments). Setup has two layers: **site checkout** (real payments) and **Stripe MCP in Cursor** (dev tooling for agents).

### Site checkout vs Stripe MCP

| | **Site checkout** | **Stripe MCP** (`.cursor/mcp.json`) |
|---|---|---|
| Purpose | Parents pay for token packs on the hub | Agents query Stripe, create products/prices, search docs |
| Runs when | `npm start` serves `/api/create-checkout` | Cursor Agent chat in this project |
| Secrets | `.env` → `STRIPE_SECRET_KEY` | OAuth via `https://mcp.stripe.com` (no key in repo) |
| Config | `stripe-packs.json` | `.cursor/mcp.json` |

These are independent: MCP auth does **not** enable site checkout, and vice versa.

### Local setup (site checkout)

1. Copy `.env.example` → `.env` (never commit `.env`).
2. Add test secret key from [Stripe Dashboard → API keys (test mode)](https://dashboard.stripe.com/test/apikeys) (`sk_test_...`).
3. Ensure every pack in `stripe-packs.json` has a `stripePriceId` (test-mode Price IDs from Stripe Dashboard).
4. Run `npm start` — console should say `Payments ON — Pro Token checkout is ready.`
5. Test at [http://localhost:8080](http://localhost:8080) with card `4242 4242 4242 4242`.

If payments are off, check: missing/invalid `.env`, empty `stripePriceId`, or server not restarted after `.env` changes.

### Config files

| File | Role |
|------|------|
| `.env` | `STRIPE_SECRET_KEY`, `BASE_URL`, `PORT` — gitignored |
| `.env.example` | Placeholder template only — **never put real keys here** |
| `stripe-packs.json` | **Canonical pack → Stripe mapping** (`tokens`, `label`, `stripePriceId`) |
| `payments-config.js` | Client-side: `useApi` flag + optional static Payment Link URLs |
| `setup-payment-links.js` | `npm run setup-payments` — builds Payment Links from `stripe-packs.json` |
| `.cursor/mcp.json` | Project-scoped Stripe MCP (OAuth remote server) |

**Prices are not hardcoded in checkout code.** `server.js` passes `stripePriceId` to Stripe; dollar amounts live in Stripe Dashboard. To change a price: create a new Price in Stripe, update `stripePriceId` in `stripe-packs.json`, restart server.

**Display prices** in `hub.js` (`TOKEN_PACKS[].price`) are UI-only and should stay in sync with Stripe manually.

### Token packs (`stripe-packs.json`)

| Pack ID | Tokens | Stripe product (test) | `stripePriceId` |
|---------|--------|-------------------------|-------------------|
| `pack100` | 100 | Become a Pro | `price_1TcXMILlMDtyDLHUEbY7QZQL` |
| `pack500` | 500 | 500 Pro Tokens — Pro Pack | `price_1TdCCjLlMDtyDLHURpxQB6TQ` |
| `pack1200` | 1200 | 1200 Pro Tokens — Mega Pack | `price_1TdCCjLlMDtyDLHU27zWhLUY` |
| `pack3000` | 3000 | 3000 Pro Tokens — Ultra Pack | `price_1TdCCjLlMDtyDLHUftc311ud` |

Stripe account (test): **The Eagle Ray Group sandbox**. [Dashboard → Products (test)](https://dashboard.stripe.com/test/products)

### Checkout flow

**Option A (default, recommended):** `payments-config.js` has `useApi: true`.

1. Hub calls `GET /api/payments-ready` on load.
2. User clicks **Pay Now** → `POST /api/create-checkout` with `{ packId }`.
3. `server.js` creates Stripe Checkout Session with `line_items: [{ price: stripePriceId, quantity: 1 }]` and metadata `{ packId, tokens }`.
4. User pays on Stripe-hosted page; redirect to `/?purchase=success&pack=…&session_id=…`.
5. `hub.js` → `handlePurchaseReturn()` → `GET /api/verify-session?session_id=…` → credits tokens to `becomeAProTokens` in localStorage.

**Option B (static Payment Links):** run `npm run setup-payments` once. Rewrites `payments-config.js` with `useApi: false` and permanent `buy.stripe.com` URLs. Works without `/api/create-checkout` but creates new links each run if re-executed.

Requires `npm start` (Node `server.js`), not a plain static file server, for Option A and for verify-session.

### Payment API (`server.js`)

- `GET /api/payments-ready` — `{ ready: true }` when `STRIPE_SECRET_KEY` is set and all packs have `stripePriceId`.
- `POST /api/create-checkout` — body `{ packId }` → `{ url }` (Stripe Checkout URL).
- `GET /api/verify-session?session_id=…` — `{ paid, packId, tokens, amountTotal }`.

### Stripe MCP in Cursor (agents)

Project config at `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "stripe": {
      "url": "https://mcp.stripe.com"
    }
  }
}
```

After reload, connect via **Cursor Settings → MCP** and complete Stripe OAuth (test mode while developing). Agents can list products, create prices, search Stripe docs, etc. Revoke access in Stripe Dashboard → User settings → OAuth sessions.

Use MCP to manage Stripe catalog; use `stripe-packs.json` + code changes to wire new price IDs into checkout.

### Not yet implemented

- **Recurring subscriptions** (e.g. monthly Pro Max) — would need `mode: "subscription"`, webhook handler, and hub UI.
- **Webhooks** — current flow verifies on redirect only; renewals/refunds would need `POST /api/stripe-webhook`.

---

## Server (`server.js`)

Besides static files:
- `/api/mp/join`, `/api/mp/sync`, `/api/mp/poll` — multiplayer
- `/api/chat/*` — game chat
- `/api/game-request` — make-a-game submissions
- `/api/create-checkout`, `/api/verify-session`, `/api/payments-ready` — Stripe Pro Token packs (see [Stripe payments](#stripe-payments-agent-reference))
- Game requests append to `game-requests.jsonl`

---

## File map for agents

```
pet-game/
├── index.html, hub.js, hub.css          # Main hub
├── server.js                            # Node server + APIs
├── all-out-games.js                     # All Out catalog (11 entries)
├── all-out-template-map.js              # ID → template mapping
├── all-out-engine.js                    # Shared All Out helpers
├── pro-max-gear.js                      # Max-upgrade cheat injection
├── reset-progress.js                    # Clear saves from Settings
├── game-multiplayer.js/css              # Shared MP client
├── game-chat.js/css                     # Shared chat
├── payments-config.js                   # Client payment mode + optional Payment Links
├── stripe-packs.json                    # Pack tokens + Stripe price IDs (server source of truth)
├── setup-payment-links.js               # npm run setup-payments
├── .cursor/mcp.json                       # Stripe MCP (OAuth) for Cursor agents
├── .env.example                           # Env template (secrets go in .env only)
├── GAME_DESIGN.md                       # This file
└── games/
    ├── brawl-stars-mod/                 # Brawl Stars Mod (local)
    ├── dragon-plains/                   # Dragon Upgrade (local)
    ├── snake-io/                        # Snake I.O. (local)
    ├── fat-simulator/                   # Coco Devouring (local)
    ├── random-roles/                    # Random Roles (local)
    ├── raise-a-monster/                 # Raising a Monster (local)
    ├── meme-car-race/                   # Meme Car (local)
    ├── fishermon/                       # Fishermon (local)
    ├── mob-battle/                      # Mob Battle (local)
    ├── murder-mystery/                  # → _templates/murder-3
    ├── 100-buttons/                     # → _templates/buttons
    ├── save-a-brainrot/                 # → _templates/brainrot
    ├── math-olympiad/                   # Footer link only
    ├── hungry-snake-worm/               # Redirect → snake-io
    └── _templates/                      # Shared All Out clone engines
```

Each local game folder typically: `index.html`, `game.js`, `style.css`, optional `sprites.js` / `map.js` / `roles.js`.  
Each game folder has a **`README.md`** with hub ID, save keys, and play URL.

---

## Per-game documentation

| Game | README |
|------|--------|
| Brawl Stars Mod | [games/brawl-stars-mod/README.md](games/brawl-stars-mod/README.md) |
| Dragon Upgrade | [games/dragon-plains/README.md](games/dragon-plains/README.md) |
| Snake I.O. | [games/snake-io/README.md](games/snake-io/README.md) |
| Coco Devouring | [games/fat-simulator/README.md](games/fat-simulator/README.md) |
| Random Roles | [games/random-roles/README.md](games/random-roles/README.md) |
| Raising a Monster | [games/raise-a-monster/README.md](games/raise-a-monster/README.md) |
| Meme Car | [games/meme-car-race/README.md](games/meme-car-race/README.md) |
| Fishermon | [games/fishermon/README.md](games/fishermon/README.md) |
| Mob Battle | [games/mob-battle/README.md](games/mob-battle/README.md) |
| Murder Mystery | [games/murder-mystery/README.md](games/murder-mystery/README.md) |
| 100 Buttons | [games/100-buttons/README.md](games/100-buttons/README.md) |
| Save A Brainrot | [games/save-a-brainrot/README.md](games/save-a-brainrot/README.md) |
| Math Olympiad | [games/math-olympiad/README.md](games/math-olympiad/README.md) |

---

## Design principles used across sessions

1. **Minimize scope** — small targeted diffs; match existing code style in each game
2. **All Out parity** — where noted, marketing copy, thumbnails, and mechanics mirror All Out game descriptions
3. **Mobile-first** — touch joysticks, safe-area insets, max-width `#app` on menus
4. **localStorage saves** — per-game `SAVE_KEY`; hub uses `becomeAProHub` + `becomeAProTokens`
5. **No git commits** unless the user explicitly asks

---

## Future work / known gaps

- **Random Roles** — primarily vs bots; MP hooks exist but round logic is local
- **Coco Devouring** — PVP/rebirth/boss zones are menu tabs, not walkable map areas
- **Template games** — share engines under `_templates/`; thin wrappers may need per-game tuning
- **Shared templates** — many deleted games’ template folders still exist but are unwired from the hub

---

*Last updated: May 2026 — reflects hub catalog trim (34 games removed), Brawl Stars Mod (200-tier pass, Coco Ultra God, merge machine, shop rules), and per-game README docs.*
