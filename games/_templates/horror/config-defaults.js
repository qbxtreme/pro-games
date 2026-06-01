window.HORROR_DEFAULTS = {
  variant: "fnaf",
  variants: {
    fnaf: { zoneName: "The Office", maxNights: 5, nightLength: 90, powerDrain: 0.15, threatCount: 2, threatEmojis: ["🐻", "🦊", "🐤"], sky: ["#0d1b2a", "#1b263b"] },
    mimicer: { zoneName: "The Facility", maxNights: 4, nightLength: 75, sanityDrain: 1.2, threatCount: 3, threatEmojis: ["🎭", "👤", "😱"], sky: ["#1a0a2e", "#2d1b4e"] },
    backrooms: { zoneName: "Backrooms Lvl 1", maxNights: 6, nightLength: 100, sanityDrain: 0.8, threatCount: 2, threatEmojis: ["👽", "🦠"], floor: "#c4a35a", sky: ["#e8d5a3", "#d4bc7a"] },
    nights: { zoneName: "Wilderness Camp", maxNights: 99, nightLength: 60, threatCount: 3, threatEmojis: ["🐺", "🌲", "🔥"], sky: ["#0a1628", "#1a3a5c"] },
    "blood-rain": { zoneName: "City Streets", maxNights: 5, nightLength: 80, overlay: "rain", threatCount: 4, threatEmojis: ["🩸", "👹"], sky: ["#2a0a0a", "#4a1010"] },
    "red-sun": { zoneName: "Red Wasteland", maxNights: 5, nightLength: 85, overlay: "sun", sanityDrain: 1.5, threatCount: 3, threatEmojis: ["☀️", "👹", "🦴"], sky: ["#8b0000", "#ff4500"] },
  },
  ui: {
    nightLabel: "🌙 Night {night}/{max}",
    startToast: "Night {night} — survive until 6 AM!",
    nightClear: "6 AM! Night {night} begins...",
    winToast: "🏆 You survived all nights!",
    loseToast: "💀 Caught — try again!",
    hideOn: "🚪 Hiding...",
    hideOff: "Out of hiding",
    camOn: "📹 Camera mode — drains power faster",
    camOff: "Cameras off",
    leaderboardTitle: "🏆 Top Survivors",
  },
};
