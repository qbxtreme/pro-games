(function () {
  "use strict";

  const ROLES = {
    suspect: {
      id: "suspect",
      name: "Suspect",
      emoji: "🔍",
      team: "suspect",
      desc: "Solve puzzles around the map, then escape through the docks!",
      color: "#42a5f5",
    },
    detective: {
      id: "detective",
      name: "Detective",
      emoji: "🔫",
      team: "detective",
      desc: "Investigate players and stop the murderer before everyone falls!",
      color: "#ffc107",
    },
    murderer: {
      id: "murderer",
      name: "Murderer",
      emoji: "🔪",
      team: "murderer",
      desc: "Eliminate every suspect in stealth before they escape!",
      color: "#ef5350",
    },
  };

  const PLAYER_COLORS = [
    { id: "yellow", hex: "#ffeb3b", name: "Yellow" },
    { id: "purple", hex: "#ab47bc", name: "Purple" },
    { id: "cyan", hex: "#26c6da", name: "Cyan" },
    { id: "red", hex: "#ef5350", name: "Red" },
    { id: "green", hex: "#66bb6a", name: "Green" },
    { id: "orange", hex: "#ff9800", name: "Orange" },
    { id: "pink", hex: "#ec407a", name: "Pink" },
    { id: "blue", hex: "#42a5f5", name: "Blue" },
    { id: "lime", hex: "#cddc39", name: "Lime" },
    { id: "white", hex: "#eceff1", name: "White" },
  ];

  const BOT_NAMES = [
    "Alex", "Sam", "Jordan", "Casey", "Riley", "Morgan", "Quinn", "Sky",
    "Nova", "Blake", "River", "Ash", "Jade", "Kai", "Zoe", "Max",
  ];

  const VARIANTS = {
    default: {
      victim: "the victim",
      heroLine: "3 ROLES · PUZZLES · ESCAPE",
      features: [
        "🔍 <strong>Suspect</strong> — solve clues and escape",
        "🔫 <strong>Detective</strong> — investigate and stop the killer",
        "🔪 <strong>Murderer</strong> — eliminate all suspects in stealth",
        "☀️ Day phase — tasks, kills, and investigations!",
      ],
    },
    sprunki: {
      victim: "Sprunki",
      heroLine: "WHO KILLED SPRUNKI?!",
      features: [
        "🎵 Sprunki-themed mansion mystery",
        "🔍 Gather beat clues as a Suspect",
        "🔫 Detective — expose the killer",
        "🔪 Murderer — silence the crew",
      ],
    },
    barry: {
      victim: "Barry",
      heroLine: "WHO KILLED BARRY?!",
      features: [
        "🕵️ Collect evidence around the manor",
        "🔍 Suspects crack puzzles to escape",
        "🔫 Detective hunts the culprit",
        "🔪 Murderer strikes from the shadows",
      ],
    },
    crush: {
      victim: "your crush",
      heroLine: "WHO KILLED YOUR CRUSH?!",
      features: [
        "💔 Romantic mystery vibes",
        "🔍 Suspects solve heart-clue puzzles",
        "🔫 Detective — find who did it",
        "🔪 Murderer — don't get caught!",
      ],
    },
  };

  window.MMRoles = {
    ROLES,
    PLAYER_COLORS,
    BOT_NAMES,
    VARIANTS,
  };
})();
