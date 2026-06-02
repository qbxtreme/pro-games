# Mini Brawl Stars

**Hub ID:** `mini-brawl-stars`  
**Path:** `games/mini-brawl-stars/`  
**Status:** Playable

A pocket-sized fork of **Brawl Stars Mod** — same hub, showdown, and modded game modes, with about half the code (fewer brawlers, modes, and maps). The full **Brawl Stars Mod** is unchanged.

## Play

```bash
npm start
# http://localhost:8080/games/mini-brawl-stars/
```

## What's included

- Brawl-style hub (Pass, Quests, Shop, brawler roster)
- Showdown (Solo / Duo / Trio) with shrinking poison
- 10 modded modes (Gem Grab, Brawl Ball, Bounty, Heist, Hot Zone, Knockout, Wipeout, Boss Fight)
- 4 arena map layouts
- ~52 brawlers

## Rebuild trim from Mod

```bash
cp ../brawl-stars-mod/{game.js,style.css,index.html,brawlers-roster.js,brawler-attacks.js} .
node build-mini.js
```
