(function () {
  "use strict";

  const FACTIONS = {
    protect: {
      id: "protect",
      name: "Protect",
      emoji: "🛡️",
      color: "#42a5f5",
      blurb: "Save the town from the Betray faction.",
    },
    betray: {
      id: "betray",
      name: "Betray",
      emoji: "🗡️",
      color: "#ef5350",
      blurb: "Hunt from the shadows and eliminate Protect.",
    },
    rogue: {
      id: "rogue",
      name: "Rogue",
      emoji: "🔥",
      color: "#ab47bc",
      blurb: "Win on your own chaotic terms.",
    },
  };

  const ROLES = {
    doctor: {
      id: "doctor",
      name: "Doctor",
      emoji: "🩺",
      faction: "protect",
      desc: "Protect one player each night from elimination.",
      night: "heal",
    },
    sheriff: {
      id: "sheriff",
      name: "Sheriff",
      emoji: "⭐",
      faction: "protect",
      desc: "Investigate a player — learn if they are Betray.",
      night: "investigate",
    },
    coroner: {
      id: "coroner",
      name: "Coroner",
      emoji: "⚰️",
      faction: "protect",
      desc: "Examine a body to learn the victim's true role.",
      night: "autopsy",
    },
    vigilante: {
      id: "vigilante",
      name: "Vigilante",
      emoji: "⚔️",
      faction: "protect",
      desc: "Take justice into your own hands — one shot.",
      night: "execute",
      uses: 1,
    },
    werewolf: {
      id: "werewolf",
      name: "Werewolf",
      emoji: "🐺",
      faction: "betray",
      desc: "Devour (40s cd), infect (1 min cd), and transform into a wolf for 30s.",
      night: "kill",
    },
    hitman: {
      id: "hitman",
      name: "Hitman",
      emoji: "🎯",
      faction: "betray",
      desc: "Assassinate your target in the shadows.",
      night: "kill",
    },
    pirate: {
      id: "pirate",
      name: "Pirate",
      emoji: "🏴‍☠️",
      faction: "betray",
      desc: "Plunder and deceive the town.",
      night: "plunder",
    },
    hunter: {
      id: "hunter",
      name: "Hunter",
      emoji: "🏹",
      faction: "betray",
      desc: "Track prey — your strike bypasses protection.",
      night: "hunt",
    },
    anarchist: {
      id: "anarchist",
      name: "Anarchist",
      emoji: "🔥",
      faction: "rogue",
      desc: "Complete all town tasks to win on your own.",
      night: "chaos",
    },
    jester: {
      id: "jester",
      name: "Jester",
      emoji: "🃏",
      faction: "rogue",
      desc: "Prank 3 players, then call a secret fake meeting and vote someone out.",
      win: "chaos",
    },
    survivor: {
      id: "survivor",
      name: "Survivor",
      emoji: "🛡️",
      faction: "rogue",
      desc: "Survive until only 3 players remain alive.",
      win: "survive",
    },
  };

  const ROLE_LIST = Object.values(ROLES);

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

  window.RRRoles = {
    FACTIONS,
    ROLES,
    ROLE_LIST,
    PLAYER_COLORS,
    BOT_NAMES,
  };
})();
