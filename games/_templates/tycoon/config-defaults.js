window.TYCOON_DEFAULTS = {
  variant: "city",
  variants: {
    city: {
      plotCost: 50, defaultBuilding: "shop", ownedColor: "#90caf9", skyTop: "#42a5f5", skyBot: "#e3f2fd",
      buildings: { shop: { emoji: "🏪", income: 3 }, house: { emoji: "🏠", income: 5 }, bank: { emoji: "🏦", income: 8 } },
    },
    zoo: {
      plotCost: 40, defaultBuilding: "cage", ownedColor: "#a5d6a7", skyTop: "#66bb6a", skyBot: "#fff9c4",
      buildings: { cage: { emoji: "🦁", income: 4 }, pond: { emoji: "🐧", income: 3 }, shop: { emoji: "🍿", income: 6 } },
    },
    counterfeit: {
      plotCost: 35, defaultBuilding: "press", ownedColor: "#ffcc80", skyTop: "#ff9800", skyBot: "#fff3e0",
      buildings: { press: { emoji: "🖨️", income: 5 }, vault: { emoji: "💰", income: 7 }, lab: { emoji: "🧪", income: 4 } },
    },
  },
  ui: {
    startToast: "Tap plots to buy & upgrade — earn passive income!",
    needCoins: "Need {cost} coins!",
    bought: "Upgraded {name}! 📈",
    raidNeed: "Need 30 coins to raid!",
    raidWin: "Raid success! +{loot} 🪙",
    shopHint: "Tap empty plots to buy — owned plots upgrade on tap!",
    leaderboardTitle: "💰 Richest Players",
  },
};
