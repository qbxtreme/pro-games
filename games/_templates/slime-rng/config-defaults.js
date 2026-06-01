window.SLIME_RNG_DEFAULTS = {
  rarities: [
    { id: "common", name: "Common", chance: 0.55, emoji: "🟢", power: 10 },
    { id: "rare", name: "Rare", chance: 0.28, emoji: "🔵", power: 25 },
    { id: "epic", name: "Epic", chance: 0.12, emoji: "🟣", power: 50 },
    { id: "legend", name: "Legend", chance: 0.05, emoji: "⭐", power: 100 },
  ],
  ui: {
    needCoins: "Need 10 coins to roll!",
    rolled: "Got {emoji} {name} slime!",
    noSlime: "Roll a slime first!",
    win: "Victory! +{coins} coins",
    lose: "Your slime fainted!",
    emptyCollection: "No slimes yet — roll!",
  },
};
