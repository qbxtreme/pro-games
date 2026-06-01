# Math Olympiad

**Not on main hub grid** — linked from hub footer button  
**Path:** `games/math-olympiad/`  
**Play:** [http://localhost:8080/games/math-olympiad/](http://localhost:8080/games/math-olympiad/)

## Overview

Standalone math quiz game (separate from the All Out catalog). Five rounds, fifty questions total, increasing difficulty from Easy to Insane. Infinite lives — focus on learning, not game over.

## Save & multiplayer

- **Save key:** `mathOlympiadBest` (best score %)
- **No multiplayer**

## Structure

| Rounds | Set | Questions |
|--------|-----|-----------|
| 1–10 | Easy | 10 |
| 11–20 | Medium | 10 |
| 21–30 | Hard | 10 |
| 31–40 | Very Hard | 10 |
| 41–50 | Insane | 10 |

+2 score per correct answer, −2 per wrong (`SCORE_GAIN` / `SCORE_PENALTY`).

## Key files

| File | Role |
|------|------|
| `game.js` | Question generation, scoring |
| `index.html` | Quiz UI |
| `style.css` | Styling |

## See also

[Main design doc](../../GAME_DESIGN.md)
