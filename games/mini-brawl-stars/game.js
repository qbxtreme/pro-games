(function () {
  "use strict";

  const SAVE_KEY = "miniBrawlStars";
  const COINS_KEY = "miniBrawlStarsCoins";
  const BLING_KEY = "miniBrawlStarsBling";
  const ENERGY_BLASTS_KEY = "miniBrawlStarsEnergyBlasts";
  const LEVEL_KEY = "miniBrawlStarsLevel";
  const MAX_PLAYER_LEVEL = 100;
  const LEVEL_BASE_COST = 20;
  const LEVEL_COST_STEP = 100;
  const WIN_BLING_REWARD = 100;
  const WIN_ENERGY_REWARD = 100;
  const QUEST_KEY = "miniBrawlStarsQuest";
  const QUEST_PROGRESS_KEY = "miniBrawlStarsQuestProgress";
  const QUEST_CLAIMED_KEY = "miniBrawlStarsQuestClaimed";
  const PASS_TIER_KEY = "miniBrawlStarsPassTier";
  const PASS_XP_KEY = "miniBrawlStarsPassXp";
  const PASS_MAX_TIER = 200;
  const PASS_SIRIUS_TIER = 50;
  const PASS_GOD_TIER = 100;
  const PASS_COCO_TIER = 200;
  const PASS_XP_PER_TIER = 300;

  const CHAR_PROG_KEY = "miniBrawlStarsCharProg";
  const RANKS = ["Wood", "Bronze", "Silver", "Gold", "Diamond", "Platinum", "Prestige", "Prestige 2", "Prestige 3", "Prestige 4", "Prestige 5", "God"];
  const STARS_PER_RANK = 5;
  const CHAR_XP_STAR_BASE = 100;
  const GOD_RANK_INDEX = RANKS.length - 1;

  const QUESTS = [
    { id: "win-showdown", text: "Win 1 Showdown match", reward: 50 },
    { id: "knockouts", text: "Get 3 knockouts", reward: 35 },
    { id: "survive-poison", text: "Survive the poison cloud", reward: 40 },
  ];

  const MEGA_QUESTS = [];
  const NAME_KEY = "becomeAProChatName";
  const MATCH_SEC = 300;
  const SPAWN_EDGE_PAD = 80;
  let ARENA_W = 3200;
  let ARENA_H = 2800;
  let POISON_START = 2150;
  let POISON_MIN = 220;
  let CENTER_X = ARENA_W / 2;
  let CENTER_Y = ARENA_H / 2;
  let PLAYER_SPAWN_Y = ARENA_H - SPAWN_EDGE_PAD;
  let BOT_SPAWN_Y = SPAWN_EDGE_PAD;
  const BOT_SPEED_MULT = 0.49;
  const BOT_SHOOT_COOLDOWN = 2.6;
  const FLAWLESS_BLING = 1000;
  const FLAWLESS_ENERGY = 1000;
  const FLAWLESS_COINS = 500;
  const FLAWLESS_XP = 500;
  const SUPER_COOLDOWN = 7;
  const TRANQ_COOLDOWN = 8;

  const SHOP = {
    skin: { label: "Bull Armor Skin", price: 1200 },
    power: { label: "Super Legendary Title", price: 2000 },
  };
  const BRAWLER_UNLOCK_PREFIX = "miniBrawlStarsUnlock_";
  const SIRIUS_UNLOCK_KEY = "miniBrawlStarsSiriusUnlocked";
  const GOD_UNLOCK_KEY = "miniBrawlStarsGodUnlocked";
  const OOHLALA_UNLOCK_KEY = "miniBrawlStarsOohLaLaUnlocked";
  const COCO_UNLOCK_KEY = "miniBrawlStarsCocoUnlocked";
  const FREE_RARITIES = ["common", "rare"];
  const RARITY_SHOP = {
    superRare: 2500,
    epic: 3000,
    mythic: 4000,
    legendary: 4500,
    ultraLegendary: 5000,
  };
  const SHOP_PURCHASABLE_RARITIES = ["superRare", "epic", "mythic", "legendary", "ultraLegendary"];
  const SHOP_NON_PURCHASABLE_RARITIES = ["god", "ultraGod"];
  const SHOP_NON_PURCHASABLE_IDS = new Set(["sirius"]);
  const RARITY_LABELS = {
    common: "Common",
    rare: "Rare",
    superRare: "Super Rare",
    epic: "Epic",
    mythic: "Mythic",
    legendary: "Legendary",
    ultraLegendary: "Ultra Legendary",
    god: "God Brawler",
    ultraGod: "Ultra God",
  };
  const ROSTER_UI_SECTIONS = [
    { rarity: "common", label: "Starting Brawler" },
    { rarity: "rare", label: "Rare Brawlers" },
    { rarity: "superRare", label: "Super Rare Brawlers" },
    { rarity: "epic", label: "Epic Brawlers" },
    { rarity: "mythic", label: "Mythic Brawlers" },
    { rarity: "legendary", label: "Legendary Brawlers" },
    { rarity: "ultraLegendary", label: "Ultra Legendary Brawlers" },
    { rarity: "god", label: "God Brawler" },
    { rarity: "ultraGod", label: "Ultra God" },
  ];
  const RARITY_TEMPLATES = {
    common: { hp: 3200, speed: 295, dmg: 400, pellets: 5, spread: 0.35, rate: 0.42, superDmg: 850 },
    rare: { hp: 2800, speed: 300, dmg: 380, pellets: 1, spread: 0.08, rate: 0.2, superDmg: 900 },
    superRare: { hp: 2600, speed: 285, dmg: 480, pellets: 1, spread: 0.12, rate: 0.45, superDmg: 950 },
    epic: { hp: 3000, speed: 292, dmg: 420, pellets: 2, spread: 0.15, rate: 0.35, superDmg: 980 },
    mythic: { hp: 3400, speed: 310, dmg: 500, pellets: 2, spread: 0.12, rate: 0.28, superDmg: 1200 },
    legendary: { hp: 3800, speed: 318, dmg: 550, pellets: 2, spread: 0.1, rate: 0.25, superDmg: 1400 },
    ultraLegendary: { hp: 5500, speed: 360, dmg: 700, pellets: 3, spread: 0.08, rate: 0.18, superDmg: 1800 },
    god: { hp: 9999, speed: 420, dmg: 1200, pellets: 7, spread: 0.1, rate: 0.08, superDmg: 3600 },
    ultraGod: { hp: 16000, speed: 450, dmg: 1500, pellets: 10, spread: 0.08, rate: 0.06, superDmg: 5000 },
  };
  const GOD_BRAWLER_ID = "questionexe";
  const OOHLALA_BRAWLER_ID = "oohlala";
  const VOIDLORD_BRAWLER_ID = "voidlord";
  const THUNDERACE_BRAWLER_ID = "thunderace";
  const COCO_BRAWLER_ID = "coco";
  const PHOENIX_GOD_BRAWLER_ID = "phoenixgod";
  const ABYSS_KING_BRAWLER_ID = "abyssking";
  const STAR_DEVOUR_BRAWLER_ID = "stardevour";
  const GOD_PLAYABLE_IDS = [
    GOD_BRAWLER_ID, OOHLALA_BRAWLER_ID, VOIDLORD_BRAWLER_ID, THUNDERACE_BRAWLER_ID,
    COCO_BRAWLER_ID, PHOENIX_GOD_BRAWLER_ID, ABYSS_KING_BRAWLER_ID, STAR_DEVOUR_BRAWLER_ID,
  ];
  const MERGE_MACHINE = { x: CENTER_X, y: CENTER_Y - 40, size: 195 };
  const MERGE_INTERACT_DIST = 155;
  const MERGE_RECIPES = [
    { resultId: GOD_BRAWLER_ID, ingredients: ["sirius", "kit"], label: "?????.exe" },
    { resultId: OOHLALA_BRAWLER_ID, ingredients: ["shelly", "colt"], label: "Ooh La La" },
    { resultId: VOIDLORD_BRAWLER_ID, ingredients: ["surge", "leon"], label: "Void Lord" },
    { resultId: THUNDERACE_BRAWLER_ID, ingredients: ["crow", "mortis"], label: "Thunder Ace" },
    { resultId: COCO_BRAWLER_ID, ingredients: [GOD_BRAWLER_ID, OOHLALA_BRAWLER_ID], label: "Ultra God · Coco" },
    { resultId: PHOENIX_GOD_BRAWLER_ID, ingredients: [VOIDLORD_BRAWLER_ID, THUNDERACE_BRAWLER_ID], label: "Phoenix God" },
    { resultId: ABYSS_KING_BRAWLER_ID, ingredients: [PHOENIX_GOD_BRAWLER_ID, OOHLALA_BRAWLER_ID], label: "Abyss King" },
    { resultId: STAR_DEVOUR_BRAWLER_ID, ingredients: [ABYSS_KING_BRAWLER_ID, COCO_BRAWLER_ID], label: "Star Devourer" },
  ];
  const MELEE_COOLDOWN = 0.48;
  const MELEE_RANGE = 98;
  const MELEE_ARC = 1.15;

  const MOD = {
    playerSpeed: 1.35,
    playerHp: 1,
    fireRate: 0.65,
    bulletSpeed: 1.0,
    instantSuper: true,
  };

  const CUSTOM_BRAWLER_STATS = {
    rico: { style: "diamond", color: "#1565c0", dark: "#0d47a1", skin: "#ffcc80", shirt: "#1976d2", pants: "#263238", hair: "#fdd835", hp: 4400, speed: 328, dmg: 520, pellets: 1, spread: 0.05, rate: 0.1, superDmg: 1150 },
    bull: { style: "tank", color: "#546e7a", dark: "#37474f", skin: "#a1887f", shirt: "#607d8b", pants: "#455a64", hair: "#212121", hp: 4300, speed: 258, dmg: 450, pellets: 3, spread: 0.26, rate: 0.54, superDmg: 1080 },
    edgar: { style: "edgar", color: "#9c27b0", dark: "#6a1b9a", skin: "#ffe0b2", shirt: "#7b1fa2", pants: "#263238", hair: "#212121", hp: 2600, speed: 318, dmg: 340, pellets: 1, spread: 0.1, rate: 0.2, superDmg: 880, superJump: 240 },
    colt: { style: "colt", color: "#e53935", dark: "#b71c1c", skin: "#ffcc80", shirt: "#1565c0", pants: "#263238", hair: "#5d4037", hp: 2800, speed: 305, dmg: 380, pellets: 1, spread: 0.04, rate: 0.14, superDmg: 900, superCd: 0.9 },
    dynamike: { style: "dynamike", color: "#ff5722", dark: "#e64a19", skin: "#ffe0b2", shirt: "#795548", pants: "#37474f", hair: "#fafafa", hp: 2400, speed: 278, dmg: 510, pellets: 1, spread: 0.14, rate: 0.52, superDmg: 980 },
    starnova: { style: "starnova", color: "#e040fb", dark: "#aa00ff", skin: "#ffe0b2", shirt: "#7c4dff", pants: "#311b92", hair: "#ea80fc", hp: 5600, speed: 332, dmg: 650, pellets: 2, spread: 0.1, rate: 0.2, superDmg: 1600 },
    glowy: { style: "glowy", color: "#00e5ff", dark: "#00b8d4", skin: "#ffe0b2", shirt: "#18ffff", pants: "#37474f", hair: "#84ffff", hp: 5500, speed: 336, dmg: 640, pellets: 3, spread: 0.12, rate: 0.18, superDmg: 1550 },
    kit: { style: "kit", color: "#ff7043", dark: "#e64a19", skin: "#ffe0b2", shirt: "#ff8a65", pants: "#5d4037", hair: "#ffab91", hp: 5200, speed: 348, dmg: 620, pellets: 3, spread: 0.18, rate: 0.22, superDmg: 1400 },
    leon: { style: "ninja", color: "#78909c", dark: "#546e7a", skin: "#8d6e63", shirt: "#607d8b", pants: "#263238", hair: "#212121", hp: 4800, speed: 338, dmg: 420, pellets: 4, spread: 0.22, rate: 0.24, superDmg: 1100 },
    surge: { style: "surge", color: "#00e676", dark: "#00c853", skin: "#ffe0b2", shirt: "#1de9b6", pants: "#37474f", hair: "#76ff03", hp: 5400, speed: 318, dmg: 590, pellets: 1, spread: 0.06, rate: 0.17, superDmg: 1520 },
    sirius: { style: "star", color: "#ffd54f", dark: "#f9a825", skin: "#ffe0b2", shirt: "#fff8e1", pants: "#455a64", hair: "#ffca28", hp: 7500, speed: 395, dmg: 860, pellets: 5, spread: 0.05, rate: 0.052, superDmg: 2200, meleeDmg: 1550 },
    shelly: { style: "fire", color: "#ef6c00", dark: "#e65100", skin: "#ffe0b2", shirt: "#ff9800", pants: "#37474f", hair: "#4e342e", hp: 3200, speed: 298, dmg: 420, pellets: 5, spread: 0.38, rate: 0.42, superDmg: 880 },
    spike: { style: "cactus", color: "#7cb342", dark: "#558b2f", skin: "#ffcc80", shirt: "#8bc34a", pants: "#33691e", hair: "#424242", hp: 2400, speed: 288, dmg: 510, pellets: 1, spread: 0.12, rate: 0.44, superDmg: 750 },
    crow: { style: "crow", color: "#7e57c2", dark: "#5e35b1", skin: "#cfd8dc", shirt: "#4527a0", pants: "#311b92", hair: "#212121", hp: 2500, speed: 312, dmg: 280, pellets: 3, spread: 0.14, rate: 0.22, superDmg: 680 },
    mortis: { style: "mortis", color: "#26a69a", dark: "#00897b", skin: "#bcaaa4", shirt: "#00695c", pants: "#37474f", hair: "#212121", hp: 3400, speed: 302, dmg: 540, pellets: 1, spread: 0, rate: 0.52, superDmg: 980 },
    piper: { style: "sniper", color: "#ec407a", dark: "#c2185b", skin: "#ffe0b2", shirt: "#ad1457", pants: "#4a148c", hair: "#6a1b9a", hp: 2200, speed: 268, dmg: 780, pellets: 1, spread: 0.03, rate: 0.58, superDmg: 1150 },
    brock: { style: "rocket", color: "#ffa726", dark: "#ef6c00", skin: "#ffcc80", shirt: "#fb8c00", pants: "#424242", hair: "#3e2723", hp: 2700, speed: 272, dmg: 460, pellets: 1, spread: 0.1, rate: 0.48, superDmg: 1080 },
    questionexe: { name: "?????.exe", style: "exe", color: "#ffd700", dark: "#ff6f00", skin: "#fff8e1", shirt: "#212121", pants: "#111111", hair: "#ffd700", hp: 9999, speed: 420, dmg: 1200, pellets: 7, spread: 0.1, rate: 0.08, superDmg: 3600, superCd: 0.5, meleeDmg: 2200 },
    oohlala: { name: "Ooh La La", style: "oohlala", color: "#ec407a", dark: "#ad1457", skin: "#ffe0b2", shirt: "#f48fb1", pants: "#880e4f", hair: "#ff4081", hp: 8800, speed: 410, dmg: 1150, pellets: 8, spread: 0.22, rate: 0.1, superDmg: 3400, superCd: 0.55 },
    coco: { name: "Coco", style: "dog", color: "#8B6914", dark: "#5D4037", skin: "#A1887F", shirt: "#795548", pants: "#4E342E", hair: "#6D4C41", hp: 16000, speed: 450, dmg: 1500, pellets: 10, spread: 0.08, rate: 0.06, superDmg: 5000, superCd: 0.4, meleeDmg: 2800 },
    blazeknight: { style: "fire", color: "#ff5722", dark: "#bf360c", skin: "#ffcc80", shirt: "#e64a19", pants: "#37474f", hair: "#ffab91", hp: 4200, speed: 322, dmg: 580, pellets: 4, spread: 0.18, rate: 0.22, superDmg: 1500 },
    frosttitan: { style: "generic", color: "#4fc3f7", dark: "#0277bd", skin: "#e1f5fe", shirt: "#29b6f6", pants: "#37474f", hair: "#b3e5fc", hp: 4400, speed: 305, dmg: 620, pellets: 3, spread: 0.12, rate: 0.28, superDmg: 1550 },
    cosmicfang: { style: "crow", color: "#7c4dff", dark: "#4527a0", skin: "#d1c4e9", shirt: "#651fff", pants: "#311b92", hair: "#b388ff", hp: 5800, speed: 368, dmg: 740, pellets: 4, spread: 0.1, rate: 0.16, superDmg: 1900 },
    auroraprime: { style: "starnova", color: "#18ffff", dark: "#00838f", skin: "#e0f7fa", shirt: "#00bcd4", pants: "#006064", hair: "#84ffff", hp: 5900, speed: 372, dmg: 760, pellets: 5, spread: 0.08, rate: 0.14, superDmg: 2000 },
    voidlord: { name: "Void Lord", style: "void", color: "#311b92", dark: "#1a0033", skin: "#d1c4e9", shirt: "#4a148c", pants: "#120022", hair: "#7c4dff", hp: 9500, speed: 415, dmg: 1180, pellets: 8, spread: 0.12, rate: 0.09, superDmg: 3500, superCd: 0.52, meleeDmg: 2100 },
    thunderace: { name: "Thunder Ace", style: "surge", color: "#ffd54f", dark: "#ff8f00", skin: "#fff8e1", shirt: "#ffc107", pants: "#37474f", hair: "#ffeb3b", hp: 9200, speed: 425, dmg: 1220, pellets: 6, spread: 0.1, rate: 0.085, superDmg: 3650, superCd: 0.48, meleeDmg: 2050 },
    phoenixgod: { name: "Phoenix God", style: "fire", color: "#ff6d00", dark: "#e65100", skin: "#ffcc80", shirt: "#ff9100", pants: "#bf360c", hair: "#ffd180", hp: 15500, speed: 445, dmg: 1450, pellets: 9, spread: 0.09, rate: 0.065, superDmg: 4800, superCd: 0.42, meleeDmg: 2700 },
    abyssking: { name: "Abyss King", style: "void", color: "#1a0033", dark: "#0d001a", skin: "#b39ddb", shirt: "#4a148c", pants: "#000000", hair: "#7c4dff", hp: 15800, speed: 440, dmg: 1480, pellets: 10, spread: 0.08, rate: 0.062, superDmg: 4900, superCd: 0.4, meleeDmg: 2750 },
    stardevour: { name: "Star Devourer", style: "star", color: "#ea80fc", dark: "#aa00ff", skin: "#f3e5f5", shirt: "#e040fb", pants: "#4a148c", hair: "#ffd54f", hp: 16500, speed: 455, dmg: 1550, pellets: 11, spread: 0.07, rate: 0.055, superDmg: 5200, superCd: 0.38, meleeDmg: 2900 },
  };

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function hslColor(h, s, l) {
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  function makeBrawlerFromRoster(entry) {
    const h = hashStr(entry.id);
    const t = RARITY_TEMPLATES[entry.rarity] || RARITY_TEMPLATES.epic;
    const hue = hashStr(entry.id) % 360;
    return {
      name: entry.name,
      rarity: entry.rarity,
      emoji: entry.emoji,
      style: "generic",
      color: hslColor(hue, 65, 48),
      dark: hslColor(hue, 60, 32),
      skin: "#ffe0b2",
      shirt: hslColor(hue, 55, 42),
      pants: "#37474f",
      hair: hslColor((hue + 40) % 360, 40, 25),
      hp: t.hp + (h % 500),
      speed: t.speed + (h % 40),
      dmg: t.dmg + (h % 80),
      pellets: t.pellets,
      spread: t.spread,
      rate: t.rate,
      superDmg: t.superDmg + (h % 200),
    };
  }

  function buildBrawlersFromRoster() {
    const out = {};
    const roster = window.BS_ROSTER || [];
    roster.forEach((entry) => {
      const custom = CUSTOM_BRAWLER_STATS[entry.id] || {};
      out[entry.id] = { ...makeBrawlerFromRoster(entry), ...custom, name: entry.name, rarity: entry.rarity, emoji: entry.emoji };
      if (window.BS_ATTACKS) BS_ATTACKS.applyToBrawler(entry.id, out[entry.id]);
    });
    Object.entries(CUSTOM_BRAWLER_STATS).forEach(([id, custom]) => {
      if (out[id]) return;
      const stub = { id, name: custom.name || id, rarity: custom.rarity || "god", emoji: custom.emoji || "❓" };
      out[id] = { ...makeBrawlerFromRoster(stub), ...custom };
      if (window.BS_ATTACKS) BS_ATTACKS.applyToBrawler(id, out[id]);
    });
    return out;
  }

  const BRAWLERS = buildBrawlersFromRoster();

  const PASS_PRIZES = {
    1: { icon: "🏅", label: "Rookie Title", type: "title" },
    3: { icon: "🎭", label: "Happy Emote", type: "emote" },
    5: { icon: "🎨", label: "Gold Banner", type: "cosmetic" },
    7: { icon: "💠", label: "Rare Pin", type: "pin" },
    9: { icon: "📌", label: "Brawl Pin", type: "pin" },
    11: { icon: "🏆", label: "Champion Title", type: "title" },
    13: { icon: "🔫", label: "Shelly Pin", type: "pin" },
    15: { icon: "🖼️", label: "Player Icon", type: "cosmetic" },
    17: { icon: "😎", label: "Cool Emote", type: "emote" },
    19: { icon: "🌵", label: "Spike Pin", type: "pin" },
    21: { icon: "⭐", label: "Power Star", type: "cosmetic" },
    23: { icon: "🎉", label: "Victory Emote", type: "emote" },
    25: { icon: "🦎", label: "Assassin Pin", type: "pin" },
    27: { icon: "👕", label: "Blue Skin", type: "cosmetic" },
    29: { icon: "📍", label: "Star Pin", type: "pin" },
    31: { icon: "🐦‍⬛", label: "Crow Pin", type: "pin" },
    33: { icon: "👑", label: "Master Title", type: "title" },
    35: { icon: "🔥", label: "Fire Emote", type: "emote" },
    37: { icon: "🦇", label: "Mortis Pin", type: "pin" },
    39: { icon: "💎", label: "Crown Pin", type: "pin" },
    41: { icon: "🦸", label: "Hero Skin", type: "cosmetic" },
    43: { icon: "🎯", label: "Piper Pin", type: "pin" },
    45: { icon: "✨", label: "Legend Emote", type: "emote" },
    47: { icon: "🛡️", label: "Elite Title", type: "title" },
    49: { icon: "🚀", label: "Brock Pin", type: "pin" },
    51: { icon: "🥈", label: "Silver Sticker", type: "cosmetic" },
    53: { icon: "🦎", label: "Leon Pin", type: "pin" },
    55: { icon: "🌈", label: "Neon Banner", type: "cosmetic" },
    57: { icon: "💎", label: "Gem Pin", type: "pin" },
    59: { icon: "☠️", label: "Showdown Emote", type: "emote" },
    61: { icon: "🏅", label: "Legend Title", type: "title" },
    63: { icon: "🎀", label: "Colette Pin", type: "pin" },
    65: { icon: "🟣", label: "Epic Skin", type: "cosmetic" },
    67: { icon: "😂", label: "Laugh Emote", type: "emote" },
    69: { icon: "⚡", label: "Surge Pin", type: "pin" },
    71: { icon: "🔮", label: "Mythic Pin", type: "pin" },
    73: { icon: "🛡️", label: "Mega Title", type: "title" },
    75: { icon: "🔥", label: "Amber Pin", type: "pin" },
    77: { icon: "🏆", label: "Trophy Emote", type: "emote" },
    79: { icon: "⚾", label: "Bibi Pin", type: "pin" },
    81: { icon: "🌑", label: "Shadow Skin", type: "cosmetic" },
    83: { icon: "💃", label: "Dance Emote", type: "emote" },
    85: { icon: "🐺", label: "Fang Pin", type: "pin" },
    87: { icon: "💫", label: "Ultra Pin", type: "pin" },
    89: { icon: "🐉", label: "Dragon Emote", type: "emote" },
    91: { icon: "👑", label: "God Title", type: "title" },
    93: { icon: "🎯", label: "Mandy Pin", type: "pin" },
    95: { icon: "🌌", label: "Cosmic Skin", type: "cosmetic" },
    97: { icon: "🎊", label: "Final Emote", type: "emote" },
    99: { icon: "❓", label: "Pre-God Pin", type: "pin" },
  };

  const PASS_PRIZE_POOL = [
    { icon: "🥥", label: "Coconut Pin", type: "pin" },
    { icon: "🐶", label: "Devour Emote", type: "emote" },
    { icon: "🌴", label: "Tropical Banner", type: "cosmetic" },
    { icon: "💥", label: "Ultra Pin", type: "pin" },
    { icon: "🎖️", label: "Elite Title", type: "title" },
    { icon: "🍫", label: "Snack Emote", type: "emote" },
    { icon: "🛸", label: "Cosmic Skin", type: "cosmetic" },
    { icon: "🔱", label: "Trident Pin", type: "pin" },
    { icon: "🌊", label: "Wave Emote", type: "emote" },
    { icon: "🦴", label: "Bone Pin", type: "pin" },
    { icon: "🎪", label: "Circus Banner", type: "cosmetic" },
    { icon: "⚡", label: "Thunder Pin", type: "pin" },
    { icon: "🍀", label: "Lucky Emote", type: "emote" },
    { icon: "🛡️", label: "Guardian Title", type: "title" },
    { icon: "🔥", label: "Inferno Pin", type: "pin" },
    { icon: "🌙", label: "Moon Skin", type: "cosmetic" },
    { icon: "🎯", label: "Sniper Pin", type: "pin" },
    { icon: "🎸", label: "Rock Emote", type: "emote" },
    { icon: "💜", label: "Violet Pin", type: "pin" },
    { icon: "🏝️", label: "Island Banner", type: "cosmetic" },
    { icon: "🦈", label: "Shark Pin", type: "pin" },
    { icon: "🎆", label: "Fireworks Emote", type: "emote" },
    { icon: "🧿", label: "Myth Pin", type: "pin" },
    { icon: "🌟", label: "Nova Title", type: "title" },
    { icon: "🍩", label: "Donut Emote", type: "emote" },
  ];
  for (let t = 101; t <= 199; t += 2) {
    if (!PASS_PRIZES[t]) PASS_PRIZES[t] = PASS_PRIZE_POOL[((t - 101) / 2) % PASS_PRIZE_POOL.length];
  }

  const PASS_MILESTONE_TIERS = {
    50: { icon: "⭐", label: "Ultra Legendary · Sirius", type: "legendary", special: true, unlockSirius: true, brawler: "sirius", coins: 0 },
    100: { icon: "❓", label: "?????.exe — God Brawler", type: "brawler", special: true, unlockGod: true, brawler: GOD_BRAWLER_ID, coins: 1000 },
    200: { icon: "🥥", label: "Coco — Ultra God Brawler", type: "brawler", special: true, unlockCoco: true, brawler: COCO_BRAWLER_ID, coins: 2000 },
  };

  const STARTER_BONUS = {
    rico:  { hp: 1.10, speed: 1.10, fire: 0.82, ricochet: true },
    bull:  { hp: 1.08, speed: 1.03, fire: 0.92 },
    edgar: { hp: 1.03, speed: 1.06, fire: 0.94 },
    colt:  { hp: 1.04, speed: 1.05, fire: 0.90 },
  };

  const DEFAULT_BRAWLER = "shelly";

  const SIRIUS_BONUS = {
    hp: 1.48,
    speed: 1.34,
    fire: 0.45,
    bulletSpeed: 1.4,
    ricochet: true,
    maxBounces: 6,
    meleeCd: 0.16,
    meleeRange: 138,
    meleeArc: 1.55,
    dmgMult: 1.5,
    superCd: 4.5,
    poisonResist: 0.5,
  };

  const KIT_BONUS = {
    hp: 1.18,
    speed: 1.22,
    fire: 0.72,
    bulletSpeed: 1.12,
    dmgMult: 1.12,
    superCd: 5.5,
    pounceDist: 165,
  };

  const LEON_BONUS = {
    hp: 1.16,
    speed: 1.24,
    fire: 0.74,
    bulletSpeed: 1.1,
    dmgMult: 1.1,
    superCd: 5.5,
    smokeTime: 2.5,
  };

  const SURGE_BONUS = {
    hp: 1.2,
    speed: 1.15,
    fire: 0.7,
    bulletSpeed: 1.2,
    dmgMult: 1.18,
    superCd: 5,
    boostTime: 4,
    boostSpeed: 1.35,
  };

  const STARNOVA_BONUS = {
    hp: 1.22,
    speed: 1.18,
    fire: 0.68,
    bulletSpeed: 1.18,
    dmgMult: 1.2,
    superCd: 5,
  };

  const GLOWY_BONUS = {
    hp: 1.2,
    speed: 1.2,
    fire: 0.7,
    bulletSpeed: 1.15,
    dmgMult: 1.18,
    superCd: 5,
  };

  const QUESTIONEXE_BONUS = {
    hp: 1.6,
    speed: 1.4,
    fire: 0.35,
    bulletSpeed: 1.55,
    ricochet: true,
    maxBounces: 8,
    meleeCd: 0.12,
    meleeRange: 150,
    meleeArc: 1.65,
    dmgMult: 2.2,
    superCd: 0.5,
    poisonResist: 0.75,
  };

  const OOHLALA_BONUS = {
    hp: 1.45,
    speed: 1.32,
    fire: 0.38,
    bulletSpeed: 1.4,
    dmgMult: 2.0,
    superCd: 0.55,
  };

  const COCO_BONUS = {
    hp: 1.85,
    speed: 1.5,
    fire: 0.28,
    bulletSpeed: 1.65,
    ricochet: true,
    maxBounces: 12,
    meleeCd: 0.08,
    meleeRange: 165,
    meleeArc: 1.75,
    dmgMult: 2.6,
    superCd: 0.4,
    poisonResist: 0.5,
  };

  const GAME_MODE_KEY = "miniBrawlStarsGameMode";
  const BRAWLER_SELECT_KEY = "miniBrawlStarsSelectedBrawler";
  const BS_GAME_MODES = [
    { id: "showdown-solo", name: "Showdown", emoji: "☠️", cat: "Showdown", desc: "Solo — be the last brawler standing.", match: "solo", toast: "Solo Showdown — every brawler for themselves!", win: "Last brawler standing!" },
    { id: "showdown-duo", name: "Duo Showdown", emoji: "👥", cat: "Showdown", desc: "Pair up — last duo alive wins.", match: "duo", toast: "Duo Showdown — stick with your teammate!", win: "Your duo wins!" },
    { id: "showdown-trio", name: "Trio Showdown", emoji: "🧑‍🤝‍🧑", cat: "Showdown", desc: "Teams of three — last squad wins.", match: "trio", toast: "Trio Showdown — protect your squad!", win: "Your trio wins!" },
    { id: "gem-grab", name: "Gem Grab", emoji: "💎", cat: "3v3", desc: "Collect 10 gems before the enemy team.", match: "solo", toast: "Gem Grab — knockouts drop gems!", win: "Gem Grab victory!" },
    { id: "brawl-ball", name: "Brawl Ball", emoji: "⚽", cat: "3v3", desc: "Score 2 goals in the enemy net.", match: "solo", toast: "Brawl Ball — shoot to score!", win: "GOOOAL! Brawl Ball win!" },
    { id: "bounty", name: "Bounty", emoji: "⭐", cat: "3v3", desc: "Collect stars from knockouts.", match: "solo", toast: "Bounty — stars for every KO!", win: "Bounty stars collected!" },
    { id: "heist", name: "Heist", emoji: "🔐", cat: "3v3", desc: "Break the enemy safe before they break yours.", match: "solo", toast: "Heist — crack the safe!", win: "Safe destroyed — Heist win!" },
    { id: "hot-zone", name: "Hot Zone", emoji: "🔥", cat: "3v3", desc: "Hold capture zones to fill the bar.", match: "solo", toast: "Hot Zone — control the zone!", win: "Hot Zone captured!" },
    { id: "knockout", name: "Knockout", emoji: "🎯", cat: "3v3", desc: "Best of 3 rounds — no respawns.", match: "solo", toast: "Knockout — one life only!", win: "Knockout round won!" },
    { id: "wipeout", name: "Wipeout", emoji: "💥", cat: "3v3", desc: "First team to 8 knockouts wins.", match: "solo", toast: "Wipeout — rack up KOs!", win: "Wipeout — 8 KOs!" },
    { id: "boss-fight", name: "Boss Fight", emoji: "🐉", cat: "Co-op PvE", desc: "Team up to beat the mega boss.", match: "solo", toast: "Boss Fight — defeat the boss!", win: "Boss Fight cleared!" },
  ];
  const BS_GAME_CATEGORIES = ["Showdown", "3v3", "Co-op PvE"];

  const BOT_KINDS = Object.keys(BRAWLERS);
  const GRASS_TILE = 48;
  const GRASS_COLORS = ["#4d8a3a", "#5a9648", "#6ba856", "#458238", "#527a44", "#72a85c", "#3d6832", "#649652", "#5f9349", "#7cb868"];
  const GRASS_INIT = "";

  let WALLS = [];
  let grassTiles = [];
  let grassInitKey = "";
  let mapSeed = 0;
  let currentMapName = "Grass Arena";
  let mapTheme = null;
  let menuCamAngle = 0;
  let menuPreviewId = null;
  let menuHeroCtx = null;
  let menuHeroW = 0;
  let menuHeroH = 0;

  let canvas, ctx, wrap;
  let w = 0, h = 0, dpr = 1;
  let playing = false;
  let inWorld = false;
  let mergeFxTimer = 0;
  let matchMode = "solo";
  let selectedGameModeId = "showdown-solo";
  let brawlerKey = DEFAULT_BRAWLER;
  let moveJoy = { dx: 0, dy: 0 };
  let attackHeld = false;
  let meleeCd = 0;
  let meleeSwings = [];
  let keys = {};
  let cam = { x: ARENA_W / 2, y: ARENA_H / 2 };
  let player = null;
  let bots = [];
  let bullets = [];
  let poofs = [];
  let bursts = [];
  let matchTime = MATCH_SEC;
  let poisonR = POISON_START;
  let kills = 0;
  let touchedPoison = false;
  let shootCd = 0;
  let superCd = 0;
  let tranqCd = 0;
  let surgeBoostT = 0;
  let leonSmokeT = 0;
  let animT = 0;
  let lastFrame = 0;
  let remotePlayers = [];
  let toastTimer = 0;
  function playBang() {
    window.GameSFX?.play("attack");
  }

  function oohLaLaBonus() {
    return brawlerKey === OOHLALA_BRAWLER_ID ? OOHLALA_BONUS : null;
  }

  function cocoBonus() {
    return brawlerKey === COCO_BRAWLER_ID ? COCO_BONUS : null;
  }

  function questionExeBonus() {
    return brawlerKey === GOD_BRAWLER_ID ? QUESTIONEXE_BONUS : null;
  }

  function siriusBonus() {
    return brawlerKey === "sirius" ? SIRIUS_BONUS : null;
  }

  function kitBonus() {
    return brawlerKey === "kit" ? KIT_BONUS : null;
  }

  function leonBonus() {
    return brawlerKey === "leon" ? LEON_BONUS : null;
  }

  function surgeBonus() {
    return brawlerKey === "surge" ? SURGE_BONUS : null;
  }

  function starNovaBonus() {
    return brawlerKey === "starnova" ? STARNOVA_BONUS : null;
  }

  function glowyBonus() {
    return brawlerKey === "glowy" ? GLOWY_BONUS : null;
  }

  function legendaryBonus() {
    return cocoBonus() || questionExeBonus() || oohLaLaBonus() || siriusBonus() || kitBonus() || leonBonus() || surgeBonus() || starNovaBonus() || glowyBonus();
  }

  function isGodBrawler(id) {
    return GOD_PLAYABLE_IDS.includes(id || brawlerKey);
  }

  function starterBonus() {
    if (legendaryBonus()) return null;
    return STARTER_BONUS[brawlerKey] || null;
  }

  function playerFireOpts() {
    const coco = cocoBonus();
    if (coco) {
      return { ricochet: true, maxBounces: coco.maxBounces, bulletSpeed: coco.bulletSpeed, pierce: true };
    }
    const qe = questionExeBonus();
    if (qe) {
      return { ricochet: true, maxBounces: qe.maxBounces, bulletSpeed: qe.bulletSpeed, pierce: true };
    }
    const oll = oohLaLaBonus();
    if (oll) {
      return { bulletSpeed: oll.bulletSpeed, pierce: true };
    }
    const sirius = siriusBonus();
    if (sirius) {
      return { ricochet: true, maxBounces: sirius.maxBounces, bulletSpeed: sirius.bulletSpeed };
    }
    const kit = kitBonus();
    if (kit?.bulletSpeed) return { bulletSpeed: kit.bulletSpeed };
    const leon = leonBonus();
    if (leon?.bulletSpeed) return { bulletSpeed: leon.bulletSpeed };
    const surge = surgeBonus();
    if (surge?.bulletSpeed) return { bulletSpeed: surge.bulletSpeed };
    const nova = starNovaBonus();
    if (nova?.bulletSpeed) return { bulletSpeed: nova.bulletSpeed };
    const glow = glowyBonus();
    if (glow?.bulletSpeed) return { bulletSpeed: glow.bulletSpeed };
    const bonus = starterBonus();
    if (bonus?.ricochet) return { ricochet: true, maxBounces: 1 };
    return null;
  }

  function playerFireCooldown(rate) {
    const base = rate * MOD.fireRate;
    const leg = legendaryBonus();
    if (leg) return base * leg.fire;
    const bonus = starterBonus();
    return bonus ? base * bonus.fire : base;
  }

  function playerSpeedMult() {
    const leg = legendaryBonus();
    let mult = leg ? MOD.playerSpeed * leg.speed : MOD.playerSpeed * (starterBonus()?.speed || 1);
    if (brawlerKey === "surge" && surgeBoostT > 0) {
      mult *= SURGE_BONUS.boostSpeed || 1.35;
    }
    return mult;
  }

  function brawlerMaxHp(id) {
    const b = BRAWLERS[id || brawlerKey] || BRAWLERS[DEFAULT_BRAWLER];
    return b.hp;
  }

  function brawler() {
    return BRAWLERS[brawlerKey] || BRAWLERS[DEFAULT_BRAWLER];
  }

  function applyArenaMetrics(w, h) {
    ARENA_W = w;
    ARENA_H = h;
    CENTER_X = w / 2;
    CENTER_Y = h / 2;
    PLAYER_SPAWN_Y = h - SPAWN_EDGE_PAD;
    BOT_SPAWN_Y = SPAWN_EDGE_PAD;
    const maxDim = Math.max(w, h);
    POISON_START = maxDim * 0.672;
    POISON_MIN = maxDim * 0.069;
  }

  const DEFAULT_MAP_THEME = {
    id: "grassland",
    label: "Grassland",
    backdrop: "day",
    grassColors: ["#4d8a3a", "#5a9648", "#6ba856", "#458238", "#527a44", "#72a85c"],
    grassFill: ["#7ec86a", "#5fa84c", "#4a9340", "#3d7a34"],
    border: ["#6aab58", "#4f8440", "#3a6530"],
    sky: ["#5ba3d9", "#8ec5ef", "#b8d4a8"],
    vignette: "rgba(15,35,10,0.22)",
    poison: {
      outer: "rgba(18, 8, 32, 0.58)",
      edge: ["rgba(120,60,160,0.45)", "rgba(60,140,80,0.35)"],
      fog: "rgba(140,80,200,0.25)",
      stroke: "rgba(160,90,220,0.65)",
    },
    rock: ["#c9c9c9", "#9e9e9e", "#616161", "#424242"],
    bush: ["#6fa858", "#5d9448", "#4a7a38"],
  };

  function applyMapBackgroundStyles() {
    const theme = mapTheme || DEFAULT_MAP_THEME;
    const wrap = document.getElementById("game-wrap");
    const canvasEl = document.getElementById("game-canvas");
    const grad = `linear-gradient(180deg, ${theme.sky[0]} 0%, ${theme.sky[1]} 52%, ${theme.grassFill[1]} 100%)`;
    if (wrap) wrap.style.background = grad;
    if (canvasEl) canvasEl.style.background = theme.grassFill[0];
  }

  const MAP_BIOMES = [
    DEFAULT_MAP_THEME,
    {
      id: "desert", label: "Scorch Sands", backdrop: "sunset",
      grassColors: ["#d4a574", "#c9956a", "#b8845a", "#a67348", "#dbb882", "#bf9160"],
      grassFill: ["#f0d4a0", "#e6c078", "#d4a85c", "#b8894a"],
      border: ["#c9956a", "#a67348", "#8b5e3c"],
      sky: ["#87ceeb", "#f4d03f", "#e8b86d"],
      vignette: "rgba(60,35,10,0.28)",
      poison: { outer: "rgba(40,20,8,0.62)", edge: ["rgba(255,120,40,0.5)", "rgba(200,80,20,0.35)"], fog: "rgba(255,160,60,0.28)", stroke: "rgba(255,140,40,0.7)" },
      rock: ["#d7ccc8", "#a1887f", "#795548", "#5d4037"],
      bush: ["#a1887f", "#8d6e63", "#6d4c41"],
    },
    {
      id: "snow", label: "Frozen Tundra", backdrop: "arctic",
      grassColors: ["#e3f2fd", "#bbdefb", "#90caf9", "#e1f5fe", "#cfd8dc", "#b0bec5"],
      grassFill: ["#f5fbff", "#dceefb", "#c5dff0", "#a8c8e8"],
      border: ["#b3d9f2", "#8ec5ef", "#6baed6"],
      sky: ["#6eb5ff", "#b8dcff", "#eef6ff"],
      vignette: "rgba(20,40,70,0.24)",
      poison: { outer: "rgba(8,20,48,0.6)", edge: ["rgba(100,180,255,0.45)", "rgba(60,120,220,0.35)"], fog: "rgba(140,200,255,0.3)", stroke: "rgba(160,210,255,0.75)" },
      rock: ["#eceff1", "#cfd8dc", "#90a4ae", "#607d8b"],
      bush: ["#b0bec5", "#90a4ae", "#78909c"],
    },
    {
      id: "volcano", label: "Lava Fields", backdrop: "volcano",
      grassColors: ["#5d4037", "#6d4c41", "#795548", "#4e342e", "#8d6e63", "#3e2723"],
      grassFill: ["#8d6e63", "#6d4c41", "#4e342e", "#3e2723"],
      border: ["#bf360c", "#8d2f0a", "#5d1f08"],
      sky: ["#ff6f00", "#ff8f00", "#4e342e"],
      vignette: "rgba(40,10,0,0.32)",
      poison: { outer: "rgba(32,8,0,0.65)", edge: ["rgba(255,80,20,0.55)", "rgba(255,160,0,0.4)"], fog: "rgba(255,100,30,0.32)", stroke: "rgba(255,120,40,0.8)" },
      rock: ["#8d6e63", "#6d4c41", "#4e342e", "#3e2723"],
      bush: ["#558b2f", "#33691e", "#1b5e20"],
    },
    {
      id: "marsh", label: "Misty Marsh", backdrop: "mist",
      grassColors: ["#558b2f", "#689f38", "#7cb342", "#33691e", "#4caf50", "#2e7d32"],
      grassFill: ["#7cb868", "#5a9a48", "#4a8840", "#3d7538"],
      border: ["#4a9340", "#3d7a34", "#2d5c28"],
      sky: ["#607d8b", "#90a4ae", "#a5d6a7"],
      vignette: "rgba(10,30,20,0.26)",
      poison: { outer: "rgba(8,24,16,0.6)", edge: ["rgba(80,180,120,0.45)", "rgba(40,120,80,0.35)"], fog: "rgba(100,200,140,0.28)", stroke: "rgba(120,220,160,0.7)" },
      rock: ["#78909c", "#607d8b", "#455a64", "#37474f"],
      bush: ["#66bb6a", "#43a047", "#2e7d32"],
    },
    {
      id: "crystal", label: "Crystal Caves", backdrop: "nebula",
      grassColors: ["#7e57c2", "#9575cd", "#b39ddb", "#5e35b1", "#8e24aa", "#6a1b9a"],
      grassFill: ["#b39ddb", "#9575cd", "#7e57c2", "#5e35b1"],
      border: ["#9575cd", "#7e57c2", "#5e35b1"],
      sky: ["#311b92", "#512da8", "#9575cd"],
      vignette: "rgba(30,10,50,0.3)",
      poison: { outer: "rgba(20,8,40,0.62)", edge: ["rgba(180,100,255,0.5)", "rgba(120,60,220,0.38)"], fog: "rgba(200,120,255,0.3)", stroke: "rgba(220,160,255,0.75)" },
      rock: ["#e1bee7", "#ce93d8", "#ab47bc", "#8e24aa"],
      bush: ["#ba68c8", "#9c27b0", "#7b1fa2"],
    },
    {
      id: "factory", label: "Rust Yard", backdrop: "industrial",
      grassColors: ["#78909c", "#90a4ae", "#b0bec5", "#607d8b", "#546e7a", "#455a64"],
      grassFill: ["#b0bec5", "#90a4ae", "#78909c", "#607d8b"],
      border: ["#78909c", "#607d8b", "#455a64"],
      sky: ["#546e7a", "#78909c", "#b0bec5"],
      vignette: "rgba(20,25,30,0.3)",
      poison: { outer: "rgba(16,16,20,0.64)", edge: ["rgba(255,160,60,0.42)", "rgba(180,100,40,0.32)"], fog: "rgba(255,180,80,0.24)", stroke: "rgba(255,170,60,0.68)" },
      rock: ["#bdbdbd", "#9e9e9e", "#757575", "#616161"],
      bush: ["#8d6e63", "#795548", "#6d4c41"],
    },
    {
      id: "tropical", label: "Neon Jungle", backdrop: "tropical",
      grassColors: ["#00c853", "#00e676", "#69f0ae", "#1b5e20", "#2e7d32", "#43a047"],
      grassFill: ["#69f0ae", "#00e676", "#00c853", "#1b5e20"],
      border: ["#00c853", "#00897b", "#00695c"],
      sky: ["#00bcd4", "#26c6da", "#80deea"],
      vignette: "rgba(0,40,30,0.24)",
      poison: { outer: "rgba(0,24,20,0.58)", edge: ["rgba(0,230,118,0.45)", "rgba(0,180,160,0.35)"], fog: "rgba(0,255,180,0.26)", stroke: "rgba(0,255,160,0.72)" },
      rock: ["#80cbc4", "#4db6ac", "#00897b", "#00695c"],
      bush: ["#00e676", "#00c853", "#1b5e20"],
    },
  ];

  const MAP_SHAPES = [
    { id: "standard", label: "Standard", w: 3200, h: 2800 },
    { id: "wide", label: "Wide Arena", w: 4200, h: 2400 },
    { id: "tall", label: "Sky Tower", w: 2600, h: 3600 },
    { id: "compact", label: "Compact", w: 2400, h: 2100 },
    { id: "mega", label: "Mega Pit", w: 4000, h: 3400 },
  ];

  function mulberry32(seed) {
    let t = seed >>> 0;
    return () => {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function wallOverlaps(x, y, rw, rh, pad) {
    const probe = { x, y, w: rw, h: rh };
    return WALLS.some((wall) =>
      probe.x - pad < wall.x + wall.w + pad
      && probe.x + probe.w + pad > wall.x - pad
      && probe.y - pad < wall.y + wall.h + pad
      && probe.y + probe.h + pad > wall.y - pad
    );
  }

  function isSpawnZone(x, y, rw, rh) {
    if (y < ARENA_H * 0.12) return true;
    if (y + rh > ARENA_H * 0.88) return true;
    return false;
  }

  function addDecor(x, y, rw, rh, kind) {
    if (x < 50 || y < 50 || x + rw > ARENA_W - 50 || y + rh > ARENA_H - 50) return false;
    WALLS.push({ x, y, w: rw, h: rh, kind });
    return true;
  }

  function addWall(x, y, rw, rh, kind) {
    if (x < 70 || y < 70 || x + rw > ARENA_W - 70 || y + rh > ARENA_H - 70) return false;
    if (isSpawnZone(x, y, rw, rh)) return false;
    if (wallOverlaps(x, y, rw, rh, 34)) return false;
    WALLS.push({ x, y, w: rw, h: rh, kind });
    return true;
  }

  function tryRandomWall(kind, rnd, rwMin, rwMax, rhMin, rhMax, attempts) {
    for (let i = 0; i < attempts; i++) {
      const rw = rwMin + rnd() * (rwMax - rwMin);
      const rh = rhMin + rnd() * (rhMax - rhMin);
      const x = 90 + rnd() * (ARENA_W - 180 - rw);
      const y = 360 + rnd() * (ARENA_H - 720 - rh);
      if (addWall(x, y, rw, rh, kind)) return true;
    }
    return false;
  }

  const MAP_PRESETS = [
    { id: "scatter", name: "Scattered Grove" },
    { id: "ring", name: "Stone Ring" },
    { id: "maze", name: "Bush Maze" },
    { id: "fortress", name: "Fortress Clash" },
  ];

  function buildScatterLayout(rnd) {
    const rocks = 10 + Math.floor(rnd() * 5);
    const bushes = 14 + Math.floor(rnd() * 6);
    for (let i = 0; i < rocks; i++) tryRandomWall("rock", rnd, 110, 210, 70, 115, 40);
    for (let i = 0; i < bushes; i++) tryRandomWall("bush", rnd, 88, 118, 72, 98, 40);
  }

  function buildRingLayout(rnd) {
    const count = 9 + Math.floor(rnd() * 4);
    const radius = 430 + rnd() * 180;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + rnd() * 0.35;
      const rw = 120 + rnd() * 80;
      const rh = 75 + rnd() * 45;
      const x = CENTER_X + Math.cos(ang) * radius - rw * 0.5 + (rnd() - 0.5) * 60;
      const y = CENTER_Y + Math.sin(ang) * radius - rh * 0.5 + (rnd() - 0.5) * 60;
      addWall(x, y, rw, rh, "rock");
    }
    for (let i = 0; i < 12; i++) tryRandomWall("bush", rnd, 88, 112, 72, 95, 24);
  }

  function buildMazeLayout(rnd) {
    const cols = 4 + Math.floor(rnd() * 2);
    const rows = 3 + Math.floor(rnd() * 2);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (rnd() > 0.42) continue;
        const bw = 95 + rnd() * 25;
        const bh = 80 + rnd() * 20;
        const x = 420 + col * ((ARENA_W - 840) / Math.max(1, cols - 1)) - bw * 0.5 + (rnd() - 0.5) * 70;
        const y = 520 + row * ((ARENA_H - 1040) / Math.max(1, rows - 1)) - bh * 0.5 + (rnd() - 0.5) * 70;
        addWall(x, y, bw, bh, "bush");
      }
    }
    for (let i = 0; i < 8; i++) tryRandomWall("rock", rnd, 130, 190, 75, 105, 30);
  }



  function buildFortressLayout(rnd) {
    addWall(CENTER_X - 150 + (rnd() - 0.5) * 40, CENTER_Y - 55 + (rnd() - 0.5) * 40, 280 + rnd() * 60, 75 + rnd() * 25, "rock");
    const marginX = ARENA_W * 0.13;
    const marginY = ARENA_H * 0.19;
    const corners = [
      [marginX, marginY], [ARENA_W - marginX - 180, marginY],
      [marginX, ARENA_H - marginY - 120], [ARENA_W - marginX - 180, ARENA_H - marginY - 120],
    ];
    corners.forEach(([cx, cy]) => {
      addWall(cx, cy, 140 + rnd() * 40, 85 + rnd() * 35, "rock");
      addWall(cx + 80 + rnd() * 40, cy + 60 + rnd() * 40, 95, 82, "bush");
    });
    for (let i = 0; i < 10; i++) tryRandomWall("bush", rnd, 88, 112, 72, 95, 24);
  }




  function buildWaterDecor(rnd) {
    const pools = 5 + Math.floor(rnd() * 5);
    for (let i = 0; i < pools; i++) {
      const pw = 120 + rnd() * 180;
      const ph = 90 + rnd() * 120;
      const x = ARENA_W * 0.12 + rnd() * (ARENA_W * 0.76 - pw);
      const y = ARENA_H * 0.16 + rnd() * (ARENA_H * 0.68 - ph);
      addDecor(x, y, pw, ph, "water");
    }
  }

  function buildCrateDecor(rnd) {
    const crates = 8 + Math.floor(rnd() * 8);
    for (let i = 0; i < crates; i++) {
      const size = 55 + rnd() * 45;
      tryRandomWall("crate", rnd, size, size, size, size, 35);
    }
  }

  function buildCrystalDecor(rnd) {
    for (let i = 0; i < 10; i++) {
      const rw = 60 + rnd() * 50;
      const rh = 90 + rnd() * 70;
      tryRandomWall("crystal", rnd, rw, rh, rw, rh, 35);
    }
  }

  function buildLayout(presetId, rnd) {
    if (presetId === "ring") buildRingLayout(rnd);
    else if (presetId === "maze") buildMazeLayout(rnd);
    else if (presetId === "fortress") buildFortressLayout(rnd);
    else buildScatterLayout(rnd);
  }

  function generateArenaMap(forcedSeed) {
    mapSeed = forcedSeed ?? ((Date.now() ^ (Math.random() * 0x7fffffff)) | 0);
    const rnd = mulberry32(mapSeed);
    mapTheme = MAP_BIOMES[Math.floor(rnd() * MAP_BIOMES.length)];
    const shape = MAP_SHAPES[Math.floor(rnd() * MAP_SHAPES.length)];
    const preset = MAP_PRESETS[Math.floor(rnd() * MAP_PRESETS.length)];
    const wJitter = Math.floor(rnd() * 240) - 120;
    const hJitter = Math.floor(rnd() * 240) - 120;
    applyArenaMetrics(Math.max(2200, shape.w + wJitter), Math.max(1900, shape.h + hJitter));
    currentMapName = `${mapTheme.label} · ${shape.label} · ${preset.name}`;
    WALLS = [];
    buildLayout(preset.id, rnd);
    if (WALLS.filter((wall) => wall.kind === "rock" || wall.kind === "crate" || wall.kind === "crystal").length < 5) {
      buildScatterLayout(rnd);
    }
    if (mapTheme.id === "marsh" || mapTheme.id === "tropical") buildWaterDecor(rnd);
    if (mapTheme.id === "factory") buildCrateDecor(rnd);
    if (mapTheme.id === "crystal") buildCrystalDecor(rnd);
    if (mapTheme.id === "snow") {
      for (let i = 0; i < 6; i++) tryRandomWall("crystal", rnd, 70, 120, 70, 120, 24);
    }
    grassInitKey = "";
    grassTiles = [];
    applyMapBackgroundStyles();
  }

  function buildWorldMap() {
    applyArenaMetrics(3200, 2800);
    mapTheme = DEFAULT_MAP_THEME;
    currentMapName = "Brawl World · Merge Hub";
    MERGE_MACHINE.x = CENTER_X;
    MERGE_MACHINE.y = CENTER_Y - 80;
    grassInitKey = "";
    grassTiles = [];
    WALLS = [];
    // Open lane from spawn (south) to merge machine (north); decor stays on the sides.
    addWall(180, 420, 160, 120, "rock");
    addWall(ARENA_W - 340, 420, 160, 120, "rock");
    addWall(240, 1180, 140, 100, "bush");
    addWall(ARENA_W - 380, 1180, 140, 100, "bush");
    addWall(280, 2060, 150, 110, "rock");
    addWall(ARENA_W - 430, 2060, 150, 110, "rock");
    addWall(420, 720, 90, 70, "bush");
    addWall(ARENA_W - 510, 720, 90, 70, "bush");
    applyMapBackgroundStyles();
  }

  function ensurePlayerSpawnClear() {
    if (!player) return;
    if (!hitsRock(player.x, player.y, 22) && !hitsMergeMachine(player.x, player.y, 24)) return;
    const offsets = [
      [0, -80], [0, 80], [-80, 0], [80, 0],
      [-60, -60], [60, -60], [-60, 60], [60, 60],
    ];
    for (const [ox, oy] of offsets) {
      const nx = player.x + ox;
      const ny = player.y + oy;
      if (!hitsRock(nx, ny, 22) && !hitsMergeMachine(nx, ny, 24)) {
        player.x = nx;
        player.y = ny;
        return;
      }
    }
  }

  generateArenaMap(Date.now());

  function getActiveGameMode() {
    return BS_GAME_MODES.find((m) => m.id === selectedGameModeId) || BS_GAME_MODES[0];
  }

  function loadGameModeId() {
    try {
      const saved = localStorage.getItem(GAME_MODE_KEY);
      if (saved && BS_GAME_MODES.some((m) => m.id === saved)) return saved;
    } catch (_) {}
    return "showdown-solo";
  }

  function loadSelectedBrawlerId() {
    try {
      const saved = localStorage.getItem(BRAWLER_SELECT_KEY);
      if (saved && BRAWLERS[saved]) return saved;
    } catch (_) {}
    return DEFAULT_BRAWLER;
  }

  function saveSelectedBrawlerId(id) {
    if (!id || !BRAWLERS[id]) return;
    try { localStorage.setItem(BRAWLER_SELECT_KEY, id); } catch (_) {}
  }

  function applySavedBrawlerSelection() {
    const id = loadSelectedBrawlerId();
    brawlerKey = id;
    document.querySelectorAll(".brawler-card").forEach((b) => b.classList.remove("selected"));
    const card = document.querySelector(`.brawler-card[data-brawler="${id}"]`);
    if (card && isBrawlerPlayable(id)) card.classList.add("selected");
    else selectBrawler(DEFAULT_BRAWLER);
    updateCharRankUI();
    updateMenuHeroLabels();
  }

  function selectGameMode(id) {
    if (!BS_GAME_MODES.some((m) => m.id === id)) return;
    selectedGameModeId = id;
    try { localStorage.setItem(GAME_MODE_KEY, id); } catch (_) {}
    updateGameModeUI();
  }

  function applySelectedGameMode() {
    matchMode = getActiveGameMode().match || "solo";
  }

  function isTeamMode() {
    return matchMode === "duo" || matchMode === "trio";
  }

  function isCoopMpMode() {
    return isGodBossMode();
  }

  function remotePlayerAlly() {
    return isTeamMode() || isCoopMpMode();
  }

  function mpSubroom() {
    return selectedGameModeId || "showdown-solo";
  }

  function updateGameModeUI() {
    const mode = getActiveGameMode();
    const emojiEl = document.getElementById("selected-game-mode-emoji");
    const labelEl = document.getElementById("selected-game-mode-label");
    const descEl = document.getElementById("selected-game-mode-desc");
    if (emojiEl) emojiEl.textContent = mode.emoji;
    if (labelEl) labelEl.textContent = mode.name;
    if (descEl) descEl.textContent = mode.desc;
    const tagline = document.querySelector(".menu-tagline");
    if (tagline) tagline.textContent = `${mode.emoji} ${mode.name} · Modded · Grass Arena · Poison Cloud`;
  }

  function buildGamesPanelHtml() {
    let html = `<p class="quest-page-note">All official Brawl Stars game modes — pick one to play modded!</p><div class="bs-games-scroll">`;
    BS_GAME_CATEGORIES.forEach((cat) => {
      const modes = BS_GAME_MODES.filter((m) => m.cat === cat);
      if (!modes.length) return;
      html += `<p class="bs-games-cat-label">${cat}</p>`;
      modes.forEach((m) => {
        const sel = m.id === selectedGameModeId ? " bs-game-mode-selected" : "";
        html += `<button type="button" class="hub-game-link bs-game-mode-btn${sel}" data-game-mode="${m.id}">
          <span class="bs-game-mode-row">
            <span class="bs-game-mode-emoji">${m.emoji}</span>
            <span class="bs-game-mode-text"><strong>${m.name}</strong><small>${m.desc}</small></span>
          </span>
        </button>`;
      });
    });
    html += `</div>
      <button type="button" class="hub-game-link bs-game-play-btn" id="hub-play-mode-btn">▶ Play ${getActiveGameMode().name}</button>
      <a href="../../index.html" class="hub-game-link bs-games-hub-link">🎮 Pro Games Hub</a>`;
    return html;
  }

  function bindGamesPanel() {
    document.querySelectorAll(".bs-game-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectGameMode(btn.dataset.gameMode);
        openGamesPanel();
      });
    });
    document.getElementById("hub-play-mode-btn")?.addEventListener("click", () => {
      closeHubPanel();
      startGame();
    });
  }

  function openGamesPanel() {
    openHubPanel("Brawl Stars Games", buildGamesPanelHtml());
    bindGamesPanel();
  }

  function isSiriusUnlocked() {
    try {
      if (localStorage.getItem(SIRIUS_UNLOCK_KEY) === "1") return true;
    } catch (_) {}
    return getPassTier() >= PASS_SIRIUS_TIER;
  }

  function unlockSirius() {
    try { localStorage.setItem(SIRIUS_UNLOCK_KEY, "1"); } catch (_) {}
    updateBrawlerUnlockUI();
  }

  function unlockGodBrawler() {
    try { localStorage.setItem(GOD_UNLOCK_KEY, "1"); } catch (_) {}
    updateBrawlerUnlockUI();
    updateGodBanner();
  }

  function isOohLaLaUnlocked() {
    try {
      if (localStorage.getItem(OOHLALA_UNLOCK_KEY) === "1") return true;
    } catch (_) {}
    return false;
  }

  function unlockOohLaLa() {
    try { localStorage.setItem(OOHLALA_UNLOCK_KEY, "1"); } catch (_) {}
    updateBrawlerUnlockUI();
    updateGodBanner();
  }

  function isCocoUnlocked() {
    try {
      if (localStorage.getItem(COCO_UNLOCK_KEY) === "1") return true;
    } catch (_) {}
    return false;
  }

  function unlockCoco() {
    try { localStorage.setItem(COCO_UNLOCK_KEY, "1"); } catch (_) {}
    updateBrawlerUnlockUI();
    updateGodBanner();
  }

  function isGodBrawlerUnlocked(id) {
    if (id === COCO_BRAWLER_ID) return isCocoUnlocked();
    if (id === GOD_BRAWLER_ID) return hasGodBrawlerUnlocked();
    if (id === OOHLALA_BRAWLER_ID) return isOohLaLaUnlocked();
    const b = BRAWLERS[id];
    if (b?.rarity === "god" || b?.rarity === "ultraGod") return isBrawlerShopUnlocked(id);
    return false;
  }

  function unlockModGodBrawler(id) {
    unlockBrawlerShop(id);
  }

  function brawlerUnlockKey(id) {
    return BRAWLER_UNLOCK_PREFIX + id;
  }

  function migrateLegacyUnlocks() {
    const legacy = {
      miniBrawlStarsKitUnlocked: "kit",
      miniBrawlStarsLeonUnlocked: "leon",
      miniBrawlStarsSurgeUnlocked: "surge",
      miniBrawlStarsStarNovaUnlocked: "starnova",
      miniBrawlStarsGlowyUnlocked: "glowy",
      miniBrawlStarsDynamikeUnlocked: "dynamike",
    };
    try {
      Object.entries(legacy).forEach(([oldKey, id]) => {
        if (localStorage.getItem(oldKey) === "1") localStorage.setItem(brawlerUnlockKey(id), "1");
      });
    } catch (_) {}
  }

  function isBrawlerShopUnlocked(id) {
    try { return localStorage.getItem(brawlerUnlockKey(id)) === "1"; } catch (_) { return false; }
  }

  function unlockBrawlerShop(id) {
    try { localStorage.setItem(brawlerUnlockKey(id), "1"); } catch (_) {}
    updateBrawlerUnlockUI();
  }

  function shopPriceFor(id) {
    const b = BRAWLERS[id];
    return RARITY_SHOP[b?.rarity] || 3000;
  }

  function isShopPurchasable(id) {
    const b = BRAWLERS[id];
    if (!b) return false;
    if (GOD_PLAYABLE_IDS.includes(id) || SHOP_NON_PURCHASABLE_IDS.has(id)) return false;
    if (SHOP_NON_PURCHASABLE_RARITIES.includes(b.rarity)) return false;
    return SHOP_PURCHASABLE_RARITIES.includes(b.rarity);
  }

  function shopPageForRarity(rarity) {
    if (rarity === "superRare" || rarity === "epic") return "regular";
    return "mega";
  }

  function shopHintFor(id) {
    const b = BRAWLERS[id];
    if (!b) return "Shop";
    if (id === "sirius") return "Ultra Legendary · Brawl Pass Tier 50";
    if (id === COCO_BRAWLER_ID) return "Ultra God · Merge ?????.exe + Ooh La La at the Merge Machine, or Brawl Pass Tier 200";
    if (id === PHOENIX_GOD_BRAWLER_ID) return "Ultra God · Merge Void Lord + Thunder Ace in Play World";
    if (id === ABYSS_KING_BRAWLER_ID) return "Ultra God · Merge Phoenix God + Ooh La La in Play World";
    if (id === STAR_DEVOUR_BRAWLER_ID) return "Ultra God · Merge Abyss King + Coco in Play World";
    if (id === VOIDLORD_BRAWLER_ID) return "God Brawler · Merge Surge + Leon in Play World";
    if (id === THUNDERACE_BRAWLER_ID) return "God Brawler · Merge Crow + Mortis in Play World";
    if (id === GOD_BRAWLER_ID || id === OOHLALA_BRAWLER_ID || b.rarity === "god") {
      if (id === OOHLALA_BRAWLER_ID) return "God Brawler · Merge Shelly + Colt in Play World";
      return "God Brawler · Pass T100, Merge, God ★, or Boss Fight";
    }
    if (b.rarity === "ultraGod") return "Ultra God · Merge both gods in Play World, or Brawl Pass Tier 200";
    const page = shopPageForRarity(b.rarity);
    const label = RARITY_LABELS[b.rarity] || b.rarity;
    return page === "mega" ? `${label} · Mega Shop` : `${label} · Shop`;
  }

  function rosterByRarity(rarity) {
    return (window.BS_ROSTER || []).filter((e) => e.rarity === rarity).sort((a, b) => a.name.localeCompare(b.name));
  }

  function hasGodBrawlerUnlocked() {
    try {
      if (localStorage.getItem(GOD_UNLOCK_KEY) === "1") return true;
    } catch (_) {}
    return Object.keys(BRAWLERS).some((bid) => getCharProg(bid).rank >= GOD_RANK_INDEX);
  }

  function godUnlockHint() {
    return "Unlock god brawlers via Play World merges, Pass T100/T200, God ★, or Boss Fight · Merge both gods into Coco";
  }

  function buildGodBanner() {
    const scroll = document.getElementById("brawler-roster-scroll");
    if (!scroll || document.getElementById("god-brawler-banner")) return;
    const banner = document.createElement("div");
    banner.id = "god-brawler-banner";
    banner.className = "god-brawler-banner";
    scroll.parentElement?.insertBefore(banner, scroll);
    updateGodBanner();
  }

  function updateGodBanner() {
    const banner = document.getElementById("god-brawler-banner");
    if (!banner) return;
    const god = BRAWLERS[GOD_BRAWLER_ID];
    const unlocked = hasGodBrawlerUnlocked();
    banner.classList.toggle("god-brawler-banner-unlocked", unlocked);
    banner.innerHTML = unlocked
      ? `<span class="god-banner-icon">❓</span>
        <span class="god-banner-text"><strong>${god?.name || "?????.exe"}</strong><small>God Brawler ready — one-shot power unlocked!</small></span>
        <button type="button" class="god-banner-btn" data-god-select="1">Play as God</button>`
      : `<span class="god-banner-icon">👹</span>
        <span class="god-banner-text"><strong>THE GOD awaits</strong><small>${godUnlockHint()}</small></span>
        <button type="button" class="god-banner-btn god-banner-btn-boss" data-god-boss="1">Boss Fight</button>`;
    banner.querySelector("[data-god-select]")?.addEventListener("click", () => selectBrawler(GOD_BRAWLER_ID));
    banner.querySelector("[data-god-boss]")?.addEventListener("click", () => {
      selectGameMode("boss-fight");
      updateGameModeUI();
      showToast("Boss Fight — defeat ?????.exe THE GOD to unlock!");
    });
  }

  function isBrawlerPlayable(id) {
    const b = BRAWLERS[id];
    if (!b) return false;
    if (FREE_RARITIES.includes(b.rarity)) return true;
    if (b.rarity === "god" || b.rarity === "ultraGod") return isGodBrawlerUnlocked(id);
    if (id === "sirius") return isSiriusUnlocked();
    return isBrawlerShopUnlocked(id);
  }

  function rarityCardClass(rarity) {
    return {
      common: "brawler-card-common",
      rare: "brawler-card-rare",
      superRare: "brawler-card-super-rare",
      epic: "brawler-card-epic",
      mythic: "brawler-card-mythic",
      legendary: "brawler-card-legendary",
      ultraLegendary: "brawler-card-ultra",
      god: "brawler-card-god",
      ultraGod: "brawler-card-ultra-god",
    }[rarity] || "";
  }

  function updateRosterCard(id) {
    const card = document.getElementById(`${id}-card`);
    if (!card) return;
    const b = BRAWLERS[id];
    const unlocked = isBrawlerPlayable(id);
    card.classList.toggle("locked", !unlocked);
    const roleEl = card.querySelector(".brawler-role");
    if (roleEl) {
      roleEl.textContent = unlocked
        ? `${RARITY_LABELS[b?.rarity] || "Brawler"} · Ready`
        : shopHintFor(id);
    }
    let lockTag = card.querySelector(".brawler-lock-tag");
    if (unlocked) {
      if (lockTag) lockTag.remove();
    } else {
      card.classList.remove("selected");
      if (!lockTag) {
        lockTag = document.createElement("span");
        lockTag.className = "brawler-lock-tag";
        lockTag.textContent = "🔒";
        card.appendChild(lockTag);
      }
    }
  }

  function buildRosterUI() {
    const scroll = document.getElementById("brawler-roster-scroll");
    if (!scroll || scroll.dataset.built === "1") return;
    scroll.dataset.built = "1";
    ROSTER_UI_SECTIONS.forEach(({ rarity, label }) => {
      const entries = rosterByRarity(rarity);
      if (!entries.length) return;
      const section = document.createElement("div");
      section.className = "brawler-rarity-section";
      const heading = document.createElement("p");
      heading.className = "menu-section-label menu-section-label-sub";
      heading.textContent = `${label} (${entries.length})`;
      section.appendChild(heading);
      const row = document.createElement("div");
      row.className = `brawler-cards brawler-cards-scroll ${rarity}-brawler-row`;
      row.id = `${rarity}-brawler-row`;
      entries.forEach((entry) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `brawler-card ${rarityCardClass(rarity)} locked`;
        btn.dataset.brawler = entry.id;
        btn.id = `${entry.id}-card`;
        if (entry.id === loadSelectedBrawlerId()) btn.classList.add("selected");
        btn.innerHTML = `<span class="brawler-portrait ${entry.id}-portrait">${entry.emoji || "🎮"}</span>
          <span class="brawler-name">${entry.name}</span>
          <span class="brawler-role">${shopHintFor(entry.id)}</span>
          <span class="brawler-lock-tag">🔒</span>`;
        row.appendChild(btn);
      });
      section.appendChild(row);
      scroll.appendChild(section);
    });
    scroll.addEventListener("click", (e) => {
      const btn = e.target.closest(".brawler-card");
      if (btn?.dataset.brawler) selectBrawler(btn.dataset.brawler);
    });
  }

  function getSelectedBrawlerId() {
    return document.querySelector(".brawler-card.selected")?.dataset.brawler || brawlerKey || DEFAULT_BRAWLER;
  }

  function updateMenuHeroLabels() {
    const kind = getSelectedBrawlerId();
    const b = BRAWLERS[kind] || BRAWLERS[DEFAULT_BRAWLER];
    const emojiEl = document.getElementById("menu-hero-emoji");
    const nameEl = document.getElementById("menu-hero-name");
    const rarityEl = document.getElementById("menu-hero-rarity");
    if (emojiEl) emojiEl.textContent = b.emoji || "🎮";
    if (nameEl) nameEl.textContent = b.name;
    if (rarityEl) rarityEl.textContent = RARITY_LABELS[b.rarity] || b.rarity;
  }

  function resizeMenuHeroCanvas() {
    const panel = document.getElementById("menu-hero-panel");
    const heroCanvas = document.getElementById("menu-brawler-canvas");
    if (!panel || !heroCanvas || document.getElementById("main-menu")?.classList.contains("hidden")) return;
    const hdpr = Math.min(window.devicePixelRatio || 1, 2.5);
    menuHeroW = heroCanvas.clientWidth || panel.clientWidth;
    menuHeroH = heroCanvas.clientHeight || Math.max(180, panel.clientHeight - 72);
    heroCanvas.width = Math.round(menuHeroW * hdpr);
    heroCanvas.height = Math.round(menuHeroH * hdpr);
    heroCanvas.style.width = menuHeroW + "px";
    heroCanvas.style.height = menuHeroH + "px";
    menuHeroCtx = heroCanvas.getContext("2d");
    menuHeroCtx.setTransform(hdpr, 0, 0, hdpr, 0, 0);
    menuHeroCtx.imageSmoothingEnabled = true;
  }

  function drawMenuHeroBrawler(now) {
    const panel = document.getElementById("menu-hero-panel");
    if (!panel || document.getElementById("main-menu")?.classList.contains("hidden")) return;
    if (!menuHeroCtx || !menuHeroW || !menuHeroH) resizeMenuHeroCanvas();
    if (!menuHeroCtx || !menuHeroW || !menuHeroH) return;

    const kind = getSelectedBrawlerId();
    const t = (now || performance.now()) / 1000;
    const bob = Math.sin(t * 2.2) * 10;
    const sway = Math.sin(t * 0.75) * 0.1;
    const hctx = menuHeroCtx;

    hctx.clearRect(0, 0, menuHeroW, menuHeroH);

    const glow = hctx.createRadialGradient(menuHeroW * 0.5, menuHeroH * 0.42, 16, menuHeroW * 0.5, menuHeroH * 0.5, Math.max(menuHeroW, menuHeroH) * 0.72);
    glow.addColorStop(0, "rgba(255,248,220,0.16)");
    glow.addColorStop(0.45, "rgba(255,255,255,0.05)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    hctx.fillStyle = glow;
    hctx.fillRect(0, 0, menuHeroW, menuHeroH);

    hctx.fillStyle = "rgba(0,0,0,0.35)";
    hctx.beginPath();
    hctx.ellipse(menuHeroW * 0.5, menuHeroH * 0.8 + bob * 0.15, menuHeroW * 0.24, menuHeroH * 0.045, 0, 0, Math.PI * 2);
    hctx.fill();

    const heroScale = Math.min(menuHeroW, menuHeroH) / 118;
    const prevCtx = ctx;
    ctx = hctx;
    drawBrawlerBody(
      { x: menuHeroW * 0.52, y: menuHeroH * 0.56 + bob },
      sway,
      kind,
      true,
      false,
      { scale: heroScale * 1.08 }
    );
    ctx = prevCtx;
  }

  function selectBrawler(id) {
    if (!isBrawlerPlayable(id)) {
      const b = BRAWLERS[id];
      if (GOD_PLAYABLE_IDS.includes(id) || b?.rarity === "god" || b?.rarity === "ultraGod") showToast(shopHintFor(id));
      else if (id === "sirius") showToast("Unlock Sirius at Brawl Pass Tier 50!");
      else if (b && isShopPurchasable(id)) showToast(`Unlock ${b.name} in Shop → ${shopPageForRarity(b.rarity) === "mega" ? "Mega Shop" : "Shop"}! (${shopPriceFor(id)} 🪙)`);
      else if (b) showToast(shopHintFor(id));
      else showToast("Unlock this brawler in the Shop!");
      return;
    }
    document.querySelectorAll(".brawler-card").forEach((b) => b.classList.remove("selected"));
    document.querySelector(`.brawler-card[data-brawler="${id}"]`)?.classList.add("selected");
    brawlerKey = id;
    saveSelectedBrawlerId(id);
    updateCharRankUI();
    updateMenuHeroLabels();
  }

  function updateBrawlerUnlockUI() {
    (window.BS_ROSTER || []).forEach((entry) => updateRosterCard(entry.id));
    updateCharRankUI();
    updateGodBanner();
  }

  function updatePlayControls() {
    const melee = playing && (BRAWLERS[brawlerKey]?.meleeDmg || brawlerKey === "sirius" || brawlerKey === GOD_BRAWLER_ID || brawlerKey === COCO_BRAWLER_ID);
    document.getElementById("melee-btn")?.classList.toggle("hidden", !melee);
  }

  let shopSearchQuery = "";

  function buildShopSearchHtml() {
    const q = shopSearchQuery.replace(/"/g, "&quot;");
    return `<div class="shop-search-wrap">
      <input type="search" id="shop-brawler-search" class="shop-brawler-search" placeholder="🔍 Search brawlers..." value="${q}" autocomplete="off" enterkeyhint="search">
    </div>`;
  }

  function buildShopTitleHtml(page) {
    if (page === "mega") {
      return `<span class="quest-title-text">Mega Shop</span><button type="button" class="quest-nav-btn" id="shop-prev-btn">Back</button>`;
    }
    return `<span class="quest-title-text">Shop</span><button type="button" class="quest-nav-btn" id="shop-next-btn">Next</button>`;
  }

  function shopListedBrawlerIds(rarities) {
    return rarities
      .flatMap((r) => rosterByRarity(r).map((e) => e.id))
      .filter(isShopPurchasable);
  }

  function buildShopBrawlerItemHtml(id) {
    const b = BRAWLERS[id];
    if (!b || !isShopPurchasable(id)) return "";
    const price = shopPriceFor(id);
    const owned = isBrawlerShopUnlocked(id);
    const buyBtn = owned
      ? `<p class="mega-shop-owned">✅ ${b.name} unlocked — pick in Choose Brawler!</p>`
      : `<button type="button" class="hub-game-link mega-shop-buy shop-buy-brawler" data-brawler="${id}">${b.name} — ${price} 🪙</button>`;
    return `<div class="shop-brawler-item" data-shop-name="${b.name.toLowerCase()}" data-shop-id="${id.toLowerCase()}" data-shop-rarity="${(RARITY_LABELS[b.rarity] || b.rarity).toLowerCase()}">
      <p class="shop-brawler-name">${b.emoji || "🎮"} ${b.name}</p>
      <p class="shop-brawler-desc">${RARITY_LABELS[b.rarity] || b.rarity} brawler</p>
      ${buyBtn}
    </div>`;
  }

  function buildShopBodyHtml(page) {
    const coins = getCoins();
    if (page === "mega") {
      const megaRarities = ["mythic", "legendary", "ultraLegendary"];
      const ids = shopListedBrawlerIds(megaRarities);
      const items = ids.map((id) => buildShopBrawlerItemHtml(id)).join("");
      return `<p class="quest-page-note quest-page-note-mega">⭐ Mega Shop — Mythic, Legendary & Ultra Legendary (${ids.length} brawlers)</p>
        <p>🪙 You have <strong>${coins}</strong> coins</p>
        ${buildShopSearchHtml()}
        <p id="shop-search-empty" class="shop-search-empty hidden">No brawlers match your search.</p>
        <div class="shop-brawler-scroll">${items}</div>`;
    }
    const regularIds = shopListedBrawlerIds(["superRare", "epic"]);
    const brawlerItems = regularIds.map((id) => buildShopBrawlerItemHtml(id)).join("");
    return `<p>🪙 You have <strong>${coins}</strong> coins</p>
      <button type="button" class="hub-game-link" id="buy-skin-btn">${SHOP.skin.label} — ${SHOP.skin.price} 🪙</button>
      <button type="button" class="hub-game-link" id="buy-power-btn">${SHOP.power.label} — ${SHOP.power.price} 🪙</button>
      <p class="quest-page-note">Super Rare & Epic brawlers (${regularIds.length})</p>
      ${buildShopSearchHtml()}
      <p id="shop-search-empty" class="shop-search-empty hidden">No brawlers match your search.</p>
      <div class="shop-brawler-scroll">${brawlerItems}</div>`;
  }

  function tryBuyShopBrawler(id) {
    const b = BRAWLERS[id];
    if (!b || !isShopPurchasable(id)) {
      if (b?.rarity === "god" || b?.rarity === "ultraGod" || GOD_PLAYABLE_IDS.includes(id)) showToast("God & Ultra God brawlers can't be bought — merge or Brawl Pass only!");
      else if (id === "sirius") showToast("Unlock Sirius at Brawl Pass Tier 50!");
      return;
    }
    const owned = isBrawlerShopUnlocked(id);
    if (owned) { showToast(`${b.name} already unlocked!`); return; }
    const price = shopPriceFor(id);
    if (getCoins() >= price) {
      addCoins(-price);
      unlockBrawlerShop(id);
      showToast(`${b.emoji || "🎮"} ${b.name} unlocked!`);
      openShopPanel(shopPageForRarity(b.rarity));
    } else showToast(`Need ${price} coins!`);
  }

  function filterShopBrawlers(query) {
    shopSearchQuery = query;
    const q = query.trim().toLowerCase();
    const items = document.querySelectorAll(".shop-brawler-item");
    let visible = 0;
    items.forEach((el) => {
      const haystack = `${el.dataset.shopName || ""} ${el.dataset.shopId || ""} ${el.dataset.shopRarity || ""}`;
      const match = !q || haystack.includes(q);
      el.classList.toggle("shop-brawler-hidden", !match);
      if (match) visible += 1;
    });
    document.getElementById("shop-search-empty")?.classList.toggle("hidden", visible > 0 || !q);
  }

  function bindShopPanel(page) {
    page = page === "mega" ? "mega" : "regular";
    document.getElementById("shop-next-btn")?.addEventListener("click", () => openShopPanel("mega"));
    document.getElementById("shop-prev-btn")?.addEventListener("click", () => openShopPanel("regular"));
    if (page === "regular") {
      document.getElementById("buy-skin-btn")?.addEventListener("click", () => {
        if (getCoins() >= SHOP.skin.price) { addCoins(-SHOP.skin.price); showToast("Bull Armor Skin bought!"); closeHubPanel(); }
        else showToast(`Need ${SHOP.skin.price} coins!`);
      });
      document.getElementById("buy-power-btn")?.addEventListener("click", () => {
        if (getCoins() >= SHOP.power.price) { addCoins(-SHOP.power.price); showToast("Super Legendary Title bought!"); closeHubPanel(); }
        else showToast(`Need ${SHOP.power.price} coins!`);
      });
    }
    document.querySelectorAll(".shop-buy-brawler").forEach((btn) => {
      btn.addEventListener("click", () => tryBuyShopBrawler(btn.dataset.brawler));
    });
    const searchInput = document.getElementById("shop-brawler-search");
    searchInput?.addEventListener("input", (e) => filterShopBrawlers(e.target.value));
    searchInput?.addEventListener("search", (e) => filterShopBrawlers(e.target.value));
    filterShopBrawlers(shopSearchQuery);
  }

  function openShopPanel(page) {
    page = page === "mega" ? "mega" : "regular";
    const overlay = document.getElementById("hub-panel-overlay");
    const titleEl = document.getElementById("hub-panel-title");
    const bodyEl = document.getElementById("hub-panel-body");
    if (!overlay || !titleEl || !bodyEl) return;
    titleEl.classList.add("quest-panel-title");
    titleEl.innerHTML = buildShopTitleHtml(page);
    bodyEl.innerHTML = buildShopBodyHtml(page);
    overlay.classList.remove("hidden");
    bindShopPanel(page);
  }

  function getCoins() {
    try { return parseInt(localStorage.getItem(COINS_KEY) || "0", 10) || 0; } catch (_) { return 0; }
  }

  function getBling() {
    try { return parseInt(localStorage.getItem(BLING_KEY) || "0", 10) || 0; } catch (_) { return 0; }
  }

  function getEnergyBlasts() {
    try { return parseInt(localStorage.getItem(ENERGY_BLASTS_KEY) || "0", 10) || 0; } catch (_) { return 0; }
  }

  function addCoins(n) {
    const total = Math.max(0, getCoins() + n);
    try { localStorage.setItem(COINS_KEY, String(total)); } catch (_) {}
    updateMenuCoins();
    return total;
  }

  function addBling(n) {
    const total = Math.max(0, getBling() + n);
    try { localStorage.setItem(BLING_KEY, String(total)); } catch (_) {}
    updateMenuCoins();
    return total;
  }

  function addEnergyBlasts(n) {
    const total = Math.max(0, getEnergyBlasts() + n);
    try { localStorage.setItem(ENERGY_BLASTS_KEY, String(total)); } catch (_) {}
    updateMenuCoins();
    return total;
  }

  function updateMenuCoins() {
    const coinsEl = document.getElementById("menu-coins-count");
    const blingEl = document.getElementById("menu-bling-count");
    const energyEl = document.getElementById("menu-energy-blasts-count");
    if (coinsEl) coinsEl.textContent = String(getCoins());
    if (blingEl) blingEl.textContent = String(getBling());
    if (energyEl) energyEl.textContent = String(getEnergyBlasts());
    updatePlayerLevelUI();
  }

  function getLevel() {
    try {
      const n = parseInt(localStorage.getItem(LEVEL_KEY) || "1", 10);
      return Math.min(MAX_PLAYER_LEVEL, Math.max(1, n || 1));
    } catch (_) {
      return 1;
    }
  }

  function setLevel(level) {
    const next = Math.min(MAX_PLAYER_LEVEL, Math.max(1, level));
    try { localStorage.setItem(LEVEL_KEY, String(next)); } catch (_) {}
    updatePlayerLevelUI();
    return next;
  }

  function levelUpCost(level) {
    if (level >= MAX_PLAYER_LEVEL) return null;
    return LEVEL_BASE_COST + (Math.max(1, level) - 1) * LEVEL_COST_STEP;
  }

  function canLevelUp() {
    const level = getLevel();
    const cost = levelUpCost(level);
    if (cost == null) return false;
    return getBling() >= cost && getEnergyBlasts() >= cost;
  }

  function tryLevelUp() {
    const level = getLevel();
    const cost = levelUpCost(level);
    if (cost == null) {
      showToast(`Max level ${MAX_PLAYER_LEVEL} reached!`);
      return false;
    }
    if (getBling() < cost || getEnergyBlasts() < cost) {
      showToast(`Need ${cost} Bling ★ and ${cost} Energy ⚡ for Level ${level + 1}!`);
      return false;
    }
    addBling(-cost);
    addEnergyBlasts(-cost);
    setLevel(level + 1);
    showToast(`🎉 Level ${level + 1}!`);
    return true;
  }

  function updatePlayerLevelUI() {
    const level = getLevel();
    const cost = levelUpCost(level);
    const numEl = document.getElementById("player-level-num");
    const costEl = document.getElementById("player-level-cost");
    const blingFill = document.getElementById("player-level-bling-fill");
    const energyFill = document.getElementById("player-level-energy-fill");
    const blingLabel = document.getElementById("player-level-bling-label");
    const energyLabel = document.getElementById("player-level-energy-label");
    const btn = document.getElementById("level-up-btn");

    if (numEl) numEl.textContent = String(level);

    if (cost == null) {
      if (costEl) costEl.textContent = `MAX LEVEL ${MAX_PLAYER_LEVEL}`;
      if (blingFill) blingFill.style.width = "100%";
      if (energyFill) energyFill.style.width = "100%";
      if (blingLabel) blingLabel.textContent = "★ Max";
      if (energyLabel) energyLabel.textContent = "⚡ Max";
      if (btn) btn.classList.add("hidden");
      return;
    }

    const bling = getBling();
    const energy = getEnergyBlasts();
    const blingPct = Math.min(100, (bling / cost) * 100);
    const energyPct = Math.min(100, (energy / cost) * 100);

    if (costEl) costEl.textContent = `Level ${level + 1}: ${cost} ★ Bling · ${cost} ⚡ Energy`;
    if (blingFill) blingFill.style.width = `${blingPct}%`;
    if (energyFill) energyFill.style.width = `${energyPct}%`;
    if (blingLabel) blingLabel.textContent = `★ ${bling} / ${cost}`;
    if (energyLabel) energyLabel.textContent = `⚡ ${energy} / ${cost}`;

    if (btn) {
      btn.classList.toggle("hidden", !canLevelUp());
      btn.classList.toggle("level-up-btn-ready", canLevelUp());
    }
  }

  function getPassTier() {
    try { return Math.min(PASS_MAX_TIER, Math.max(0, parseInt(localStorage.getItem(PASS_TIER_KEY) || "0", 10) || 0)); } catch (_) { return 0; }
  }

  function getPassXp() {
    try { return Math.max(0, parseInt(localStorage.getItem(PASS_XP_KEY) || "0", 10) || 0); } catch (_) { return 0; }
  }

  function setPassProgress(tier, xp) {
    try {
      localStorage.setItem(PASS_TIER_KEY, String(Math.min(PASS_MAX_TIER, Math.max(0, tier))));
      localStorage.setItem(PASS_XP_KEY, String(Math.max(0, xp)));
    } catch (_) {}
    updatePassMenuHint();
    updatePassOverlayIfOpen();
  }

  function getPassReward(tier) {
    const milestone = PASS_MILESTONE_TIERS[tier];
    if (milestone) return { ...milestone, coins: milestone.coins || 0 };
    if (tier % 2 === 0) {
      const coins = 35 + tier * 7;
      return { icon: "🪙", label: `${coins} coins`, type: "coins", coins };
    }
    const prize = PASS_PRIZES[tier];
    if (prize) return { ...prize, coins: 0 };
    return { icon: "🎁", label: "Mystery Box", type: "cosmetic", coins: 0 };
  }

  function grantPassTierReward(tier) {
    const reward = getPassReward(tier);
    if (reward.coins > 0) addCoins(reward.coins);
    if (reward.unlockSirius) unlockSirius();
    if (reward.unlockGod) unlockGodBrawler();
    if (reward.unlockCoco) unlockCoco();
    if (reward.brawler || reward.unlockSirius || reward.unlockGod || reward.unlockCoco) updateBrawlerUnlockUI();
    let msg = `Brawl Pass Tier ${tier}: ${reward.label}!`;
    if (reward.unlockCoco) msg += " Pick Coco in Choose Brawler.";
    else if (reward.unlockGod) msg += " Pick ?????.exe in Choose Brawler.";
    else if (reward.type === "brawler" || reward.brawler) msg += " Pick them in Choose Brawler.";
    else if (reward.unlockSirius) msg += " Sirius unlocked!";
    if (reward.coins > 0 && (reward.unlockGod || reward.unlockSirius || reward.unlockCoco)) msg += ` +${reward.coins} coins!`;
    showToast(msg);
    updatePassOverlayIfOpen();
    return reward;
  }

  function syncPassUnlocks() {
    if (getPassTier() >= PASS_SIRIUS_TIER) unlockSirius();
    if (getPassTier() >= PASS_GOD_TIER) unlockGodBrawler();
    if (getPassTier() >= PASS_COCO_TIER) unlockCoco();
  }

  function addPassXp(amount) {
    if (getPassTier() >= PASS_MAX_TIER) return;
    let tier = getPassTier();
    let xp = getPassXp() + amount;
    while (xp >= PASS_XP_PER_TIER && tier < PASS_MAX_TIER) {
      xp -= PASS_XP_PER_TIER;
      tier += 1;
      grantPassTierReward(tier);
    }
    setPassProgress(tier, xp);
  }

  function updatePassMenuHint() {
    const tier = getPassTier();
    const xp = getPassXp();
    const next = Math.min(PASS_MAX_TIER, tier + 1);
    const hint = tier >= PASS_MAX_TIER
      ? `Tier ${PASS_MAX_TIER} · MAX!`
      : `Tier ${next} · ${xp} / ${PASS_XP_PER_TIER}`;
    document.querySelectorAll(".hub-pass-hint").forEach((el) => { el.textContent = hint; });
  }

  function buildPassTierRow(tier) {
    const unlocked = getPassTier();
    const reward = getPassReward(tier);
    let state = "locked";
    if (tier <= unlocked) state = "claimed";
    else if (tier === unlocked + 1) state = "current";
    const milestone = PASS_MILESTONE_TIERS[tier];
    const legendary = !!milestone?.special;
    const godTier = !!milestone?.unlockGod;
    const ultraGodTier = !!milestone?.unlockCoco;
    const coinTier = reward.type === "coins";
    const prizeTier = !legendary && reward.type !== "coins";
    const brawlerName = milestone?.brawler ? BRAWLERS[milestone.brawler]?.name : null;
    const rewardDetail = ultraGodTier
      ? `Unlock ${brawlerName || "Coco"} · Ultra God${reward.coins ? ` + ${reward.coins} 🪙` : ""}`
      : godTier
        ? `Unlock ${brawlerName || "?????.exe"} · God Brawler${reward.coins ? ` + ${reward.coins} 🪙` : ""}`
        : milestone?.unlockSirius
          ? `Unlock ${brawlerName || "Sirius"} · Ultra Legendary`
          : reward.label;
    return `<div class="pass-tier pass-tier-${state}${legendary ? " pass-tier-legendary" : ""}${godTier ? " pass-tier-god-reward" : ""}${ultraGodTier ? " pass-tier-ultra-god-reward" : ""}${coinTier ? " pass-tier-coins" : ""}${prizeTier ? " pass-tier-prize" : ""}" data-tier="${tier}" id="pass-tier-${tier}">
      <div class="pass-tier-rail"><span class="pass-tier-num">${tier}</span></div>
      <div class="pass-tier-card">
        <span class="pass-tier-icon">${reward.icon}</span>
        <div class="pass-tier-info">
          <strong>Tier ${tier}${ultraGodTier ? " · Coco" : godTier ? " · God" : milestone?.unlockSirius ? " · Sirius" : ""}</strong>
          <span>${rewardDetail}</span>
        </div>
        <span class="pass-tier-status">${state === "claimed" ? "✓" : state === "current" ? "▶" : "🔒"}</span>
      </div>
    </div>`;
  }

  function buildPassScrollHtml() {
    let html = "";
    for (let t = 1; t <= PASS_MAX_TIER; t++) html += buildPassTierRow(t);
    return html;
  }

  function updatePassOverlayIfOpen() {
    const overlay = document.getElementById("brawl-pass-overlay");
    if (!overlay || overlay.classList.contains("hidden")) return;
    const tier = getPassTier();
    const xp = getPassXp();
    const label = document.getElementById("brawl-pass-progress-label");
    const fill = document.getElementById("brawl-pass-progress-fill");
    if (label) {
      label.textContent = tier >= PASS_MAX_TIER
        ? `Tier ${PASS_MAX_TIER} complete — Coco unlocked!`
        : tier >= PASS_GOD_TIER
          ? `Working on Tier ${tier + 1} · ${xp} / ${PASS_XP_PER_TIER} XP · Tier ${PASS_COCO_TIER} = Coco`
          : tier >= PASS_SIRIUS_TIER
            ? `Working on Tier ${tier + 1} · ${xp} / ${PASS_XP_PER_TIER} XP · Tier ${PASS_GOD_TIER} = ?????.exe`
            : `Working on Tier ${tier + 1} · ${xp} / ${PASS_XP_PER_TIER} XP`;
    }
    if (fill) {
      const pct = tier >= PASS_MAX_TIER ? 100 : (xp / PASS_XP_PER_TIER) * 100;
      fill.style.width = `${pct}%`;
    }
    const scroll = document.getElementById("brawl-pass-scroll");
    if (scroll) scroll.innerHTML = buildPassScrollHtml();
    scrollToPassTier(Math.min(PASS_MAX_TIER, tier + 1));
  }

  function scrollToPassTier(tier) {
    const el = document.getElementById(`pass-tier-${tier}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function openBrawlPass() {
    const overlay = document.getElementById("brawl-pass-overlay");
    const scroll = document.getElementById("brawl-pass-scroll");
    if (!overlay || !scroll) return;
    scroll.innerHTML = buildPassScrollHtml();
    updatePassOverlayIfOpen();
    overlay.classList.remove("hidden");
    requestAnimationFrame(() => scrollToPassTier(Math.min(PASS_MAX_TIER, getPassTier() + 1)));
  }

  function closeBrawlPass() {
    document.getElementById("brawl-pass-overlay")?.classList.add("hidden");
  }

  function defaultCharProg() {
    return { rank: 0, stars: 1, xp: 0 };
  }

  function readCharProgStore() {
    try { return JSON.parse(localStorage.getItem(CHAR_PROG_KEY) || "{}"); } catch (_) { return {}; }
  }

  function writeCharProgStore(data) {
    try { localStorage.setItem(CHAR_PROG_KEY, JSON.stringify(data)); } catch (_) {}
  }

  function getCharProg(id) {
    const data = readCharProgStore();
    const prog = data[id] || defaultCharProg();
    return { rank: prog.rank || 0, stars: prog.stars || 1, xp: prog.xp || 0 };
  }

  function saveCharProg(id, prog) {
    const data = readCharProgStore();
    data[id] = prog;
    writeCharProgStore(data);
  }

  function resetAllCharRank() {
    writeCharProgStore({});
    updateCharRankUI();
    showToast("Rank reset — all brawlers back to Wood ★!");
  }

  function isCharMax(prog) {
    return prog.rank >= RANKS.length - 1 && prog.stars >= STARS_PER_RANK;
  }

  function isPlayerGod() {
    return isGodBrawler(brawlerKey) || getCharProg(brawlerKey).rank >= GOD_RANK_INDEX;
  }

  function charXpToNextStar(prog) {
    const steps = prog.rank * STARS_PER_RANK + (prog.stars - 1);
    return (steps + 1) * CHAR_XP_STAR_BASE;
  }

  function starsDisplay(stars) {
    let out = "";
    for (let i = 1; i <= STARS_PER_RANK; i++) out += i <= stars ? "★" : "☆";
    return out;
  }

  function applyCharStarLevelUp(prog) {
    if (isCharMax(prog)) return null;
    const oldRankName = RANKS[prog.rank];
    prog.stars += 1;
    if (prog.stars > STARS_PER_RANK) {
      if (prog.rank < RANKS.length - 1) {
        prog.rank += 1;
        prog.stars = 1;
        return { type: "rank", name: RANKS[prog.rank] };
      }
      prog.stars = STARS_PER_RANK;
      return { type: "max" };
    }
    return { type: "star", name: RANKS[prog.rank], stars: prog.stars, oldRankName };
  }

  function addCharXp(id, amount) {
    if (!id || amount <= 0) return;
    const prog = getCharProg(id);
    if (isCharMax(prog)) return;
    prog.xp += amount;
    const messages = [];
    let lastResult = null;
    while (!isCharMax(prog) && prog.xp >= charXpToNextStar(prog)) {
      prog.xp -= charXpToNextStar(prog);
      const result = applyCharStarLevelUp(prog);
      if (!result) break;
      lastResult = result;
      if (result.type === "rank" && result.name === "God") messages.push("Rank up! GOD ★ — ?????.exe unlocked!");
      else if (result.type === "rank") messages.push(`Rank up! ${result.name} ★`);
      else if (result.type === "max") messages.push("MAX RANK — God ★★★★★!");
      else messages.push(`${result.name} · ${starsDisplay(result.stars)}`);
    }
    saveCharProg(id, prog);
    if (lastResult?.type === "rank" && lastResult.name === "God") updateBrawlerUnlockUI();
    updateCharRankUI();
    if (messages.length) showToast(messages[messages.length - 1]);
  }

  function updateCharRankUI() {
    const selected = document.querySelector(".brawler-card.selected")?.dataset.brawler || brawlerKey;
    const prog = getCharProg(selected);

    document.querySelectorAll(".brawler-card").forEach((card) => {
      const id = card.dataset.brawler;
      const p = getCharProg(id);
      let rankEl = card.querySelector(".brawler-rank-stars");
      if (!rankEl) {
        rankEl = document.createElement("span");
        rankEl.className = "brawler-rank-stars";
        card.appendChild(rankEl);
      }
      rankEl.textContent = `${RANKS[p.rank]} ${starsDisplay(p.stars)}`;
      rankEl.className = `brawler-rank-stars rank-tier-${p.rank}`;
    });

    const label = document.getElementById("char-rank-label");
    const xpLabel = document.getElementById("char-xp-label");
    const fill = document.getElementById("char-xp-fill");
    if (label) {
      label.textContent = isCharMax(prog)
        ? `${RANKS[prog.rank]} ${starsDisplay(prog.stars)} · MAX`
        : `${RANKS[prog.rank]} ${starsDisplay(prog.stars)}`;
      label.className = `char-rank-label rank-tier-${prog.rank}`;
    }
    if (xpLabel && fill) {
      if (isCharMax(prog)) {
        xpLabel.textContent = "Max rank reached!";
        fill.style.width = "100%";
      } else {
        const need = charXpToNextStar(prog);
        xpLabel.textContent = `${prog.xp} / ${need} XP to next ★`;
        fill.style.width = `${Math.min(100, (prog.xp / need) * 100)}%`;
      }
    }
    updateMenuHeroLabels();
  }

  function allQuests() {
    return QUESTS.concat(MEGA_QUESTS);
  }

  function findQuest(id) {
    return allQuests().find((q) => q.id === id);
  }

  function isMegaQuest(id) {
    return id.startsWith("mega-");
  }

  function readQuestStore(key) {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch (_) { return {}; }
  }

  function writeQuestStore(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) {}
  }

  function migrateQuestProgress() {
    try {
      if (localStorage.getItem(QUEST_KEY) === "won") {
        markQuestDone("win-showdown");
      }
    } catch (_) {}
  }

  function isQuestDone(id) {
    migrateQuestProgress();
    return !!readQuestStore(QUEST_PROGRESS_KEY)[id];
  }

  function markQuestDone(id) {
    const data = readQuestStore(QUEST_PROGRESS_KEY);
    if (data[id]) return;
    data[id] = true;
    writeQuestStore(QUEST_PROGRESS_KEY, data);
    updateQuestMenuHint();
  }

  function isQuestClaimed(id) {
    return !!readQuestStore(QUEST_CLAIMED_KEY)[id];
  }

  function markQuestClaimed(id) {
    const data = readQuestStore(QUEST_CLAIMED_KEY);
    data[id] = true;
    writeQuestStore(QUEST_CLAIMED_KEY, data);
    updateQuestMenuHint();
  }

  function claimQuestReward(id) {
    const quest = findQuest(id);
    if (!quest || !isQuestDone(id) || isQuestClaimed(id)) return false;
    markQuestClaimed(id);
    addCoins(quest.reward);
    const label = isMegaQuest(id) ? "Mega quest" : "Quest";
    showToast(`${label} reward claimed! +${quest.reward} coins`);
    return true;
  }

  function buildQuestListHtml(list, mega) {
    return list.map((quest) => {
      const done = isQuestDone(quest.id);
      const claimed = isQuestClaimed(quest.id);
      let state = "pending";
      if (claimed) state = "claimed";
      else if (done) state = "ready";
      const clickable = state === "ready";
      return `<div class="quest-row${mega ? " quest-row-mega" : ""}">
        <button type="button" class="quest-check quest-check-${state}" data-quest-id="${quest.id}" ${clickable ? "" : "disabled"} aria-label="${clickable ? "Claim quest reward" : "Quest checkmark"}">
          <span class="quest-check-mark" aria-hidden="true"></span>
        </button>
        <div class="quest-info">
          <span class="quest-text">${mega ? "MEGA · " : ""}${quest.text}</span>
          <span class="quest-reward">${claimed ? "Reward claimed" : `Prize: ${quest.reward} coins`}</span>
        </div>
      </div>`;
    }).join("");
  }

  function buildQuestsBodyHtml(page) {
    const mega = page === "mega";
    const list = mega ? MEGA_QUESTS : QUESTS;
    const intro = mega
      ? `<p class="quest-page-note quest-page-note-mega">Very hard mega quests. Huge coin prizes!</p>`
      : `<p class="quest-page-note">Complete quests in battle, then tap the green check to claim.</p>`;
    return `${intro}<div class="quest-list">${buildQuestListHtml(list, mega)}</div>`;
  }

  function buildQuestTitleHtml(page) {
    if (page === "mega") {
      return `<span class="quest-title-text">Mega Quests</span><button type="button" class="quest-nav-btn" id="quest-prev-btn">Back</button>`;
    }
    return `<span class="quest-title-text">Quests</span><button type="button" class="quest-nav-btn" id="quest-next-btn">Next</button>`;
  }

  function bindQuestPanel(page) {
    document.querySelectorAll(".quest-check-ready").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.questId;
        if (claimQuestReward(id)) openQuestsPanel(page);
      });
    });
    document.getElementById("quest-next-btn")?.addEventListener("click", () => openQuestsPanel("mega"));
    document.getElementById("quest-prev-btn")?.addEventListener("click", () => openQuestsPanel("regular"));
  }

  function openQuestsPanel(page) {
    page = page === "mega" ? "mega" : "regular";
    const overlay = document.getElementById("hub-panel-overlay");
    const titleEl = document.getElementById("hub-panel-title");
    const bodyEl = document.getElementById("hub-panel-body");
    if (!overlay || !titleEl || !bodyEl) return;
    titleEl.classList.add("quest-panel-title");
    titleEl.innerHTML = buildQuestTitleHtml(page);
    bodyEl.innerHTML = buildQuestsBodyHtml(page);
    overlay.classList.remove("hidden");
    bindQuestPanel(page);
  }

  function updateQuestMenuHint() {
    const all = allQuests();
    const pending = all.some((q) => isQuestDone(q.id) && !isQuestClaimed(q.id));
    const next = all.find((q) => !isQuestDone(q.id));
    let hint = pending ? "Tap green check to claim!" : (next ? next.text : "All quests done!");
    if (MEGA_QUESTS.some((q) => isQuestDone(q.id) && !isQuestClaimed(q.id))) {
      hint = "Mega quest ready to claim!";
    }
    document.querySelectorAll(".hub-quests-hint").forEach((el) => { el.textContent = hint; });
  }

  function markQuestWin() {
    markQuestDone("win-showdown");
    try { localStorage.setItem(QUEST_KEY, "won"); } catch (_) {}
  }

  function checkQuestProgress(won) {
    if (won) markQuestWin();
    if (kills >= 3) markQuestDone("knockouts");
    if (won && poisonR < POISON_START - 150) markQuestDone("survive-poison");

    if (won && !touchedPoison) markQuestDone("mega-flawless");
    if (kills >= 8) markQuestDone("mega-slaughter");
    if (won && player && player.hp / player.maxHp >= 0.75) markQuestDone("mega-tank");
    if (won && matchMode === "duo") markQuestDone("mega-duo-champ");
    const poisonHalf = (POISON_START + POISON_MIN) / 2;
    if (won && kills >= 4 && poisonR > poisonHalf) markQuestDone("mega-blitz");
  }

  function playerName() {
    const el = document.getElementById("name-input");
    const n = el?.value?.trim();
    if (n) return n.slice(0, 14);
    try { return localStorage.getItem(NAME_KEY) || "Trainer"; } catch (_) { return "Trainer"; }
  }

  function saveName() {
    try { localStorage.setItem(NAME_KEY, playerName()); } catch (_) {}
  }

  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    toastTimer = 2.5;
  }

  function resize() {
    if (!wrap || !canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    w = wrap.clientWidth;
    h = wrap.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    resizeMenuHeroCanvas();
  }

  function robloxViewY() {
    return window.AllOutCamera ? AllOutCamera.viewOffsetY(h) : h * 0.5;
  }

  function screenPos(wx, wy, useCam) {
    const cx = useCam?.x ?? cam.x;
    const cy = useCam?.y ?? cam.y;
    return { x: wx - cx + w * 0.5, y: wy - cy + robloxViewY() };
  }

  function worldToScreen(wx, wy) {
    return screenPos(wx, wy);
  }

  function initGrass() {
    const key = `map-${mapSeed}`;
    if (grassInitKey === key && grassTiles.length) return;
    grassInitKey = key;
    grassTiles = [];
    const cols = Math.ceil(ARENA_W / GRASS_TILE) + 1;
    const rows = Math.ceil(ARENA_H / GRASS_TILE) + 1;
    let seed = mapSeed || 1337;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const palette = (mapTheme || DEFAULT_MAP_THEME).grassColors;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        grassTiles.push({
          col, row,
          color: palette[Math.floor(rnd() * palette.length)],
          tuft: rnd() > 0.25,
          shade: rnd() * 0.18,
          blade: rnd() * Math.PI * 2,
          patch: rnd() > 0.78,
          clover: rnd() > 0.9,
          soil: rnd() > 0.88,
          wet: rnd() > 0.93,
          flower: rnd() > 0.96,
          flowerHue: rnd(),
          bladeH: 0.65 + rnd() * 0.55,
        });
      }
    }
  }

  function drawGrassBaseFill() {
    const theme = mapTheme || DEFAULT_MAP_THEME;
    const [c0, c1, c2, c3] = theme.grassFill;
    const sun = ctx.createRadialGradient(w * 0.72, h * 0.08, 20, w * 0.5, h * 0.45, Math.max(w, h) * 0.95);
    sun.addColorStop(0, c0);
    sun.addColorStop(0.35, c1);
    sun.addColorStop(0.7, c2);
    sun.addColorStop(1, c3);
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);

    const shade = ctx.createLinearGradient(0, 0, w * 0.25, h);
    shade.addColorStop(0, "rgba(20,45,15,0.12)");
    shade.addColorStop(0.5, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(10,30,8,0.08)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);
  }

  function drawArenaEdgeBorder(cx, cy, grassMode) {
    const theme = mapTheme || DEFAULT_MAP_THEME;
    const border = 60;
    const bx = border - cx + w * 0.5;
    const by = border - cy + robloxViewY();
    const bw = ARENA_W - border * 2;
    const bh = ARENA_H - border * 2;

    if (grassMode) {
      const strips = [
        [0, 0, ARENA_W, border],
        [0, ARENA_H - border, ARENA_W, border],
        [0, border, border, ARENA_H - border * 2],
        [ARENA_W - border, border, border, ARENA_H - border * 2],
      ];
      strips.forEach(([wx, wy, ww, wh]) => {
        const sx = wx - cx + w * 0.5;
        const sy = wy - cy + robloxViewY();
        if (sx + ww < -80 || sx > w + 80 || sy + wh < -80 || sy > h + 80) return;
        const g = ctx.createLinearGradient(sx, sy, sx, sy + wh);
        g.addColorStop(0, theme.border[0]);
        g.addColorStop(0.5, theme.border[1]);
        g.addColorStop(1, theme.border[2]);
        ctx.fillStyle = g;
        ctx.fillRect(sx, sy, ww, wh);
        for (let i = 0; i < Math.ceil(ww / 14); i++) {
          const fx = sx + i * 14 + 4;
          const fy = sy + wh * 0.55;
          ctx.strokeStyle = "rgba(35,75,28,0.35)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.quadraticCurveTo(fx + 2, fy - 10, fx + 4, fy - 16);
          ctx.stroke();
        }
      });
      ctx.strokeStyle = "rgba(55,95,45,0.35)";
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, by, bw, bh);
    } else {
      const strips = [
        [0, 0, ARENA_W, border],
        [0, ARENA_H - border, ARENA_W, border],
        [0, border, border, ARENA_H - border * 2],
        [ARENA_W - border, border, border, ARENA_H - border * 2],
      ];
      ctx.fillStyle = "#8d6e63";
      strips.forEach(([wx, wy, ww, wh]) => {
        const sx = wx - cx + w * 0.5;
        const sy = wy - cy + robloxViewY();
        if (sx + ww < -80 || sx > w + 80 || sy + wh < -80 || sy > h + 80) return;
        ctx.fillRect(sx, sy, ww, wh);
      });
      ctx.strokeStyle = "rgba(76,120,60,0.45)";
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);
    }
  }
  function drawGrassBaseFillWorld(cx, cy) {
    const theme = mapTheme || DEFAULT_MAP_THEME;
    const [c0, c1, c2, c3] = theme.grassFill;
    const sx = -cx + w * 0.5;
    const sy = -cy + robloxViewY();
    const ground = ctx.createLinearGradient(sx, sy, sx, sy + ARENA_H);
    ground.addColorStop(0, c0);
    ground.addColorStop(0.35, c1);
    ground.addColorStop(0.7, c2);
    ground.addColorStop(1, c3);
    ctx.fillStyle = ground;
    ctx.fillRect(sx, sy, ARENA_W, ARENA_H);

    const sunWx = ARENA_W * 0.72;
    const sunWy = ARENA_H * 0.08;
    const sunSx = sunWx - cx + w * 0.5;
    const sunSy = sunWy - cy + robloxViewY();
    const sun = ctx.createRadialGradient(sunSx, sunSy, 10, sunSx, sunSy, Math.max(ARENA_W, ARENA_H) * 0.55);
    sun.addColorStop(0, "rgba(255,248,220,0.12)");
    sun.addColorStop(0.45, "rgba(255,255,255,0.04)");
    sun.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(sx, sy, ARENA_W, ARENA_H);
  }

  function drawSkyBackdrop() {
    const theme = mapTheme || DEFAULT_MAP_THEME;
    const backdrop = theme.backdrop || "day";
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, theme.sky[0]);
    sky.addColorStop(0.42, theme.sky[1]);
    sky.addColorStop(0.72, theme.sky[2]);
    sky.addColorStop(1, theme.grassFill[0]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const drawClouds = (alpha, tint) => {
      ctx.fillStyle = tint || `rgba(255,255,255,${alpha})`;
      [[0.18, 0.11, 42, 14], [0.32, 0.08, 56, 16], [0.55, 0.14, 38, 12], [0.72, 0.1, 48, 13]].forEach(([px, py, rw, rh]) => {
        ctx.beginPath();
        ctx.ellipse(w * px, h * py, rw, rh, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawSun = (x, y, core, glow, size) => {
      const sun = ctx.createRadialGradient(x, y, 4, x, y, size || 90);
      sun.addColorStop(0, core);
      sun.addColorStop(0.35, glow);
      sun.addColorStop(1, "rgba(255,236,140,0)");
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, w, h);
    };

    if (backdrop === "day") {
      drawSun(w * 0.78, h * 0.12, "rgba(255,252,220,0.95)", "rgba(255,236,140,0.35)");
      drawClouds(0.55);
    } else if (backdrop === "sunset") {
      const haze = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.65);
      haze.addColorStop(0, "rgba(255,193,7,0.35)");
      haze.addColorStop(1, "rgba(255,87,34,0.08)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);
      drawSun(w * 0.82, h * 0.18, "rgba(255,220,120,0.92)", "rgba(255,120,40,0.42)", 120);
      drawClouds(0.35, "rgba(255,224,178,0.45)");
    } else if (backdrop === "arctic") {
      for (let i = 0; i < 28; i++) {
        const fx = ((mapSeed + i * 97) % 1000) / 1000 * w;
        const fy = ((mapSeed + i * 53) % 1000) / 1000 * h * 0.55;
        ctx.fillStyle = `rgba(255,255,255,${0.35 + (i % 5) * 0.1})`;
        ctx.beginPath();
        ctx.arc(fx, fy, 1 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      drawClouds(0.72, "rgba(240,248,255,0.85)");
    } else if (backdrop === "volcano") {
      drawSun(w * 0.5, h * 0.72, "rgba(255,80,20,0.55)", "rgba(255,40,0,0.25)", 160);
      const glow = ctx.createRadialGradient(w * 0.5, h * 0.85, 10, w * 0.5, h * 0.85, w * 0.55);
      glow.addColorStop(0, "rgba(255,120,40,0.28)");
      glow.addColorStop(1, "rgba(255,60,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = `rgba(60,40,35,${0.15 + (i % 4) * 0.05})`;
        ctx.fillRect(((mapSeed + i * 131) % 1000) / 1000 * w, h * (0.15 + (i % 6) * 0.06), 2 + (i % 3), 2 + (i % 2));
      }
    } else if (backdrop === "mist") {
      for (let layer = 0; layer < 3; layer++) {
        const fog = ctx.createLinearGradient(0, h * (0.18 + layer * 0.12), 0, h * (0.42 + layer * 0.14));
        fog.addColorStop(0, "rgba(200,220,210,0)");
        fog.addColorStop(0.5, `rgba(180,200,190,${0.18 - layer * 0.04})`);
        fog.addColorStop(1, "rgba(160,180,170,0)");
        ctx.fillStyle = fog;
        ctx.fillRect(0, 0, w, h);
      }
      drawSun(w * 0.7, h * 0.14, "rgba(255,255,240,0.45)", "rgba(220,230,220,0.2)", 70);
    } else if (backdrop === "nebula") {
      for (let i = 0; i < 40; i++) {
        const sx = ((mapSeed + i * 71) % 1000) / 1000 * w;
        const sy = ((mapSeed + i * 43) % 1000) / 1000 * h * 0.6;
        ctx.fillStyle = `rgba(220,180,255,${0.25 + (i % 4) * 0.15})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
      const neb = ctx.createRadialGradient(w * 0.35, h * 0.22, 20, w * 0.35, h * 0.22, w * 0.5);
      neb.addColorStop(0, "rgba(186,104,200,0.35)");
      neb.addColorStop(0.6, "rgba(94,53,177,0.15)");
      neb.addColorStop(1, "rgba(49,27,146,0)");
      ctx.fillStyle = neb;
      ctx.fillRect(0, 0, w, h);
      const neb2 = ctx.createRadialGradient(w * 0.75, h * 0.35, 10, w * 0.75, h * 0.35, w * 0.35);
      neb2.addColorStop(0, "rgba(126,87,234,0.28)");
      neb2.addColorStop(1, "rgba(49,27,146,0)");
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, w, h);
    } else if (backdrop === "industrial") {
      drawClouds(0.28, "rgba(189,189,189,0.45)");
      const smog = ctx.createLinearGradient(0, h * 0.25, 0, h * 0.7);
      smog.addColorStop(0, "rgba(120,144,156,0.2)");
      smog.addColorStop(1, "rgba(69,90,100,0.08)");
      ctx.fillStyle = smog;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,152,0,0.12)";
      [[0.12, 0.62, 18, 80], [0.88, 0.58, 14, 65], [0.45, 0.68, 22, 55]].forEach(([px, py, rw, rh]) => {
        ctx.fillRect(w * px - rw * 0.5, h * py - rh, rw, rh);
      });
    } else if (backdrop === "tropical") {
      drawSun(w * 0.75, h * 0.1, "rgba(255,255,220,0.9)", "rgba(128,255,220,0.35)", 100);
      const band = ctx.createLinearGradient(0, h * 0.35, 0, h * 0.55);
      band.addColorStop(0, "rgba(0,255,200,0.08)");
      band.addColorStop(1, "rgba(0,200,160,0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, w, h);
      drawClouds(0.4, "rgba(224,255,252,0.55)");
    } else {
      drawSun(w * 0.78, h * 0.12, "rgba(255,252,220,0.95)", "rgba(255,236,140,0.35)");
      drawClouds(0.55);
    }
  }

  function drawGrassTileDetail(sx, sy, tile) {
    if (tile.soil) {
      ctx.fillStyle = "rgba(92,64,42,0.22)";
      ctx.beginPath();
      ctx.ellipse(sx + GRASS_TILE * 0.45, sy + GRASS_TILE * 0.55, GRASS_TILE * 0.22, GRASS_TILE * 0.12, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (tile.patch) {
      ctx.fillStyle = "rgba(25,55,20,0.14)";
      ctx.fillRect(sx + 6, sy + 8, GRASS_TILE * 0.62, GRASS_TILE * 0.5);
    }
    if (tile.wet) {
      ctx.fillStyle = "rgba(80,140,70,0.12)";
      ctx.fillRect(sx + 4, sy + 4, GRASS_TILE * 0.7, GRASS_TILE * 0.65);
    }
    ctx.fillStyle = `rgba(255,255,255,${0.04 + tile.shade})`;
    ctx.fillRect(sx + 2, sy + 2, GRASS_TILE * 0.38, GRASS_TILE * 0.32);
    ctx.fillStyle = `rgba(0,0,0,${0.02 + tile.shade * 0.12})`;
    ctx.fillRect(sx + GRASS_TILE * 0.48, sy + GRASS_TILE * 0.52, GRASS_TILE * 0.48, GRASS_TILE * 0.42);

    const bladeCount = tile.tuft ? 5 : 2;
    for (let i = 0; i < bladeCount; i++) {
      const ox = sx + GRASS_TILE * (0.12 + i * (0.72 / Math.max(1, bladeCount - 1)));
      const oy = sy + GRASS_TILE * 0.78;
      const a = tile.blade + i * 0.55;
      const len = (8 + i * 1.5) * tile.bladeH;
      const bend = 3 + i * 0.8;
      const dark = i % 2 === 0 ? "rgba(30,70,24,0.72)" : "rgba(45,95,36,0.58)";
      ctx.strokeStyle = dark;
      ctx.lineWidth = i === Math.floor(bladeCount / 2) ? 2 : 1.3;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.quadraticCurveTo(ox + Math.cos(a) * bend, oy - len * 0.55, ox + Math.cos(a) * 2, oy - len);
      ctx.stroke();
    }

    if (tile.clover) {
      ctx.fillStyle = "rgba(72,140,58,0.85)";
      [[0.62, 0.32], [0.7, 0.4], [0.55, 0.4]].forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(sx + GRASS_TILE * px, sy + GRASS_TILE * py, 2.8, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.strokeStyle = "rgba(40,90,32,0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + GRASS_TILE * 0.64, sy + GRASS_TILE * 0.36);
      ctx.lineTo(sx + GRASS_TILE * 0.64, sy + GRASS_TILE * 0.52);
      ctx.stroke();
    }

    if (tile.flower) {
      const fx = sx + GRASS_TILE * 0.35;
      const fy = sy + GRASS_TILE * 0.42;
      const petal = tile.flowerHue > 0.5 ? "#f48fb1" : "#fff59d";
      ctx.strokeStyle = "rgba(50,100,40,0.8)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fx, fy + 6);
      ctx.lineTo(fx, fy);
      ctx.stroke();
      ctx.fillStyle = petal;
      for (let p = 0; p < 5; p++) {
        const pa = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(pa) * 3, fy + Math.sin(pa) * 3, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#ffeb3b";
      ctx.beginPath();
      ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGrassBattlefield(useCam, grassOnly) {
    const cx = useCam?.x ?? cam.x;
    const cy = useCam?.y ?? cam.y;
    const pad = GRASS_TILE * 3;
    const left = cx - w * 0.5 - pad;
    const top = cy - robloxViewY() - pad;
    const right = cx + w * 0.5 + pad;
    const bottom = cy + robloxViewY() + pad;
    const playField = grassOnly ?? playing;

    drawSkyBackdrop();
    if (playField) drawGrassBaseFillWorld(cx, cy);
    else drawGrassBaseFill();

    grassTiles.forEach((tile) => {
      const wx = tile.col * GRASS_TILE;
      const wy = tile.row * GRASS_TILE;
      if (wx + GRASS_TILE < left || wx > right || wy + GRASS_TILE < top || wy > bottom) return;
      const sx = wx - cx + w * 0.5;
      const sy = wy - cy + robloxViewY();
      ctx.fillStyle = tile.color;
      ctx.fillRect(sx, sy, GRASS_TILE + 1, GRASS_TILE + 1);
      drawGrassTileDetail(sx, sy, tile);
    });

    drawArenaEdgeBorder(cx, cy, playField);
  }

  function drawArenaLighting(useCam) {
    if (!playing) return;
    const theme = mapTheme || DEFAULT_MAP_THEME;
    const tint = theme.backdrop === "volcano" ? "rgba(255,180,120,0.12)"
      : theme.backdrop === "nebula" ? "rgba(200,160,255,0.1)"
      : theme.backdrop === "arctic" ? "rgba(220,240,255,0.12)"
      : "rgba(255,248,220,0.14)";
    const light = ctx.createRadialGradient(w * 0.68, h * 0.12, 20, w * 0.5, h * 0.5, Math.max(w, h) * 0.85);
    light.addColorStop(0, tint);
    light.addColorStop(0.45, "rgba(255,255,255,0.05)");
    light.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, w, h);

    const vignette = ctx.createRadialGradient(w * 0.5, robloxViewY(), Math.min(w, h) * 0.25, w * 0.5, robloxViewY(), Math.max(w, h) * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, theme.vignette);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  function drawPoisonZone(useCam) {
    if (isGodBossMode()) return;
    const theme = mapTheme || DEFAULT_MAP_THEME;
    const p = theme.poison;
    const cx = useCam?.x ?? cam.x;
    const cy = useCam?.y ?? cam.y;
    const mx = CENTER_X - cx + w * 0.5;
    const my = CENTER_Y - cy + robloxViewY();
    const pulse = 0.88 + Math.sin(animT * 1.8) * 0.12;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.arc(mx, my, poisonR * pulse, 0, Math.PI * 2, true);
    ctx.fillStyle = p.outer;
    ctx.fill("evenodd");
    ctx.restore();

    const edge = ctx.createRadialGradient(mx, my, poisonR * 0.9, mx, my, poisonR * 1.12);
    edge.addColorStop(0, "rgba(80,40,120,0)");
    edge.addColorStop(0.35, p.edge[0]);
    edge.addColorStop(0.65, p.edge[1]);
    edge.addColorStop(1, "rgba(40,20,60,0)");
    ctx.fillStyle = edge;
    ctx.beginPath();
    ctx.arc(mx, my, poisonR * 1.12, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const a = animT * 0.4 + (i / 8) * Math.PI * 2;
      const r = poisonR + 20 + Math.sin(animT * 2 + i) * 12;
      const fx = mx + Math.cos(a) * r;
      const fy = my + Math.sin(a) * r;
      const fog = ctx.createRadialGradient(fx, fy, 0, fx, fy, 38);
      fog.addColorStop(0, p.fog);
      fog.addColorStop(1, "rgba(80,40,120,0)");
      ctx.fillStyle = fog;
      ctx.beginPath();
      ctx.arc(fx, fy, 38, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = p.stroke;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(mx, my, poisonR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(200,140,255,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mx, my, poisonR - 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawRock(sx, sy, rw, rh, seed) {
    const theme = mapTheme || DEFAULT_MAP_THEME;
    const [r0, r1, r2, r3] = theme.rock;
    const s = seed || 0;
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.beginPath();
    ctx.ellipse(sx + rw * 0.52 + 4, sy + rh + 6, rw * 0.5, rh * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    const baseG = ctx.createLinearGradient(sx, sy, sx + rw, sy + rh);
    baseG.addColorStop(0, r0);
    baseG.addColorStop(0.25, r1);
    baseG.addColorStop(0.55, r2);
    baseG.addColorStop(1, r3);
    ctx.fillStyle = baseG;
    ctx.beginPath();
    ctx.moveTo(sx + rw * 0.08, sy + rh * 0.92);
    ctx.lineTo(sx + rw * 0.02, sy + rh * 0.38);
    ctx.quadraticCurveTo(sx + rw * 0.15, sy + rh * 0.05, sx + rw * 0.42, sy + 2);
    ctx.quadraticCurveTo(sx + rw * 0.78, sy + rh * 0.02, sx + rw * 0.96, sy + rh * 0.35);
    ctx.lineTo(sx + rw, sy + rh * 0.82);
    ctx.quadraticCurveTo(sx + rw * 0.72, sy + rh, sx + rw * 0.35, sy + rh * 0.96);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(0,0,0,0.28)";
    ctx.lineWidth = 1.2;
    [[0.22, 0.38, 0.58, 0.58], [0.45, 0.22, 0.72, 0.48], [0.18, 0.62, 0.42, 0.78]].forEach(([x1, y1, x2, y2], i) => {
      ctx.beginPath();
      ctx.moveTo(sx + rw * x1, sy + rh * y1);
      ctx.lineTo(sx + rw * x2, sy + rh * y2);
      ctx.stroke();
    });

    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.ellipse(sx + rw * 0.32, sy + rh * 0.18, rw * 0.24, rh * 0.15, -0.35, 0, Math.PI * 2);
    ctx.fill();

    if ((s % 3) !== 1) {
      ctx.fillStyle = "rgba(72,110,58,0.55)";
      ctx.beginPath();
      ctx.ellipse(sx + rw * 0.72, sy + rh * 0.78, rw * 0.18, rh * 0.1, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(90,130,72,0.45)";
      ctx.beginPath();
      ctx.arc(sx + rw * 0.68, sy + rh * 0.72, rw * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBushCluster(sx, sy, bw, bh) {
    const theme = mapTheme || DEFAULT_MAP_THEME;
    const [b0, b1, b2] = theme.bush;
    ctx.fillStyle = "rgba(0,0,0,0.26)";
    ctx.beginPath();
    ctx.ellipse(sx + bw * 0.5, sy + bh + 4, bw * 0.44, bh * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(45,80,30,0.85)";
    ctx.fillRect(sx + bw * 0.35, sy + bh * 0.55, bw * 0.08, bh * 0.42);
    ctx.fillRect(sx + bw * 0.58, sy + bh * 0.6, bw * 0.06, bh * 0.38);

    const clusters = [
      [0.2, 0.45, 18, b0], [0.48, 0.3, 21, b1],
      [0.74, 0.48, 17, b2], [0.35, 0.65, 16, b1],
      [0.62, 0.58, 15, b0], [0.5, 0.42, 14, b0],
    ];
    clusters.forEach(([px, py, r, light], i) => {
      const cx = sx + bw * px;
      const cy = sy + bh * py;
      const g = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.45, 1, cx, cy, r);
      g.addColorStop(0, light);
      g.addColorStop(0.45, b2);
      g.addColorStop(1, "#264d1a");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      for (let l = 0; l < 4; l++) {
        const la = (l / 4) * Math.PI * 2 + i * 0.5;
        ctx.fillStyle = "rgba(140,200,110,0.35)";
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(la) * r * 0.55, cy + Math.sin(la) * r * 0.45 - 2, r * 0.22, r * 0.14, la, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "rgba(180,230,140,0.4)";
      ctx.beginPath();
      ctx.arc(cx - r * 0.28, cy - r * 0.38, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawWaterPool(sx, sy, pw, ph) {
    const g = ctx.createRadialGradient(sx + pw * 0.45, sy + ph * 0.4, 4, sx + pw * 0.5, sy + ph * 0.5, Math.max(pw, ph) * 0.55);
    g.addColorStop(0, "rgba(120,220,255,0.55)");
    g.addColorStop(0.5, "rgba(40,160,220,0.42)");
    g.addColorStop(1, "rgba(20,100,180,0.18)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(sx + pw * 0.5, sy + ph * 0.5, pw * 0.48, ph * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(180,240,255,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawCrate(sx, sy, rw, rh) {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(sx + 4, sy + rh + 2, rw, 6);
    ctx.fillStyle = "#8d6e63";
    ctx.fillRect(sx, sy, rw, rh);
    ctx.strokeStyle = "#5d4037";
    ctx.lineWidth = 3;
    ctx.strokeRect(sx + 2, sy + 2, rw - 4, rh - 4);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + rw, sy + rh);
    ctx.moveTo(sx + rw, sy);
    ctx.lineTo(sx, sy + rh);
    ctx.stroke();
  }

  function drawCrystal(sx, sy, rw, rh) {
    const theme = mapTheme || DEFAULT_MAP_THEME;
    const c = theme.rock[0];
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(sx + rw * 0.5, sy + rh + 4, rw * 0.4, rh * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(sx + rw * 0.5, sy);
    ctx.lineTo(sx + rw, sy + rh * 0.55);
    ctx.lineTo(sx + rw * 0.72, sy + rh);
    ctx.lineTo(sx + rw * 0.28, sy + rh);
    ctx.lineTo(sx, sy + rh * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawObstacle(wall, useCam) {
    const cx = useCam?.x ?? cam.x;
    const cy = useCam?.y ?? cam.y;
    const sx = wall.x - cx + w * 0.5;
    const sy = wall.y - cy + robloxViewY();
    if (sx + wall.w < -60 || sx > w + 60 || sy + wall.h < -60 || sy > h + 60) return;

    if (wall.kind === "bush") {
      drawBushCluster(sx, sy, wall.w, wall.h);
    } else if (wall.kind === "water") {
      drawWaterPool(sx, sy, wall.w, wall.h);
    } else if (wall.kind === "crate") {
      drawCrate(sx, sy, wall.w, wall.h);
    } else if (wall.kind === "crystal") {
      drawCrystal(sx, sy, wall.w, wall.h);
    } else {
      drawRock(sx, sy, wall.w, wall.h, wall.x * 3 + wall.y);
    }
  }

  function isBlockingWall(kind) {
    return kind === "rock" || kind === "crate" || kind === "crystal";
  }

  function hitsRock(x, y, r) {
    return WALLS.some((wall) => isBlockingWall(wall.kind) && x + r > wall.x && x - r < wall.x + wall.w && y + r > wall.y && y - r < wall.y + wall.h);
  }

  function inBush(x, y) {
    return WALLS.some((wall) => wall.kind === "bush" && x > wall.x && x < wall.x + wall.w && y > wall.y && y < wall.y + wall.h);
  }

  function clampArena(ent) {
    ent.x = Math.max(50, Math.min(ARENA_W - 50, ent.x));
    ent.y = Math.max(50, Math.min(ARENA_H - 50, ent.y));
  }

  function clampToSafeZone(ent, margin) {
    const pad = margin ?? 24;
    const dx = ent.x - CENTER_X;
    const dy = ent.y - CENTER_Y;
    const dist = Math.hypot(dx, dy);
    const maxR = Math.max(POISON_MIN, poisonR - pad);
    if (dist <= maxR || dist === 0) return;
    const scale = maxR / dist;
    ent.x = CENTER_X + dx * scale;
    ent.y = CENTER_Y + dy * scale;
  }

  function spawnPos(isPlayer) {
    if (isPlayer) return { x: CENTER_X, y: PLAYER_SPAWN_Y };
    return null;
  }

  function spawnPlayer() {
    const maxHp = brawlerMaxHp();
    const pos = spawnPos(true);
    player = { x: pos.x, y: pos.y, hp: maxHp, maxHp, angle: -Math.PI / 2, dead: false, hidden: false };
    snapCameraToPlayer();
  }

  function snapCameraToPlayer() {
    if (!player) return;
    if (isGodBossMode()) {
      const boss = bots.find((b) => b.isGodBoss);
      if (boss) {
        cam.x = (player.x + boss.x) * 0.5;
        cam.y = (player.y + boss.y) * 0.5;
        return;
      }
    }
    cam.x = player.x;
    cam.y = player.y;
  }

  function makeBot(id, kind, x, y, ally, enemyDuo) {
    const maxHp = brawlerMaxHp(kind);
    return {
      id, x, y, hp: maxHp, maxHp, kind,
      ally: !!ally,
      enemyDuo: ally ? null : (enemyDuo ?? null),
      dead: false, shoot: 1 + Math.random() * 2, ai: 0, tx: x, ty: y, hidden: false,
    };
  }

  function pickBuddyKind() {
    const choices = Object.keys(BRAWLERS).filter((k) => k !== brawlerKey && isBrawlerPlayable(k));
    return choices[Math.floor(Math.random() * choices.length)] || "rico";
  }

  function spawnBuddyBot(id) {
    const buddyKind = pickBuddyKind();
    const buddy = makeBot(id || "buddy", buddyKind, CENTER_X + 120, PLAYER_SPAWN_Y - 50, true);
    buddy.label = `${BRAWLERS[buddyKind].name} Buddy`;
    return buddy;
  }

  function hasOnlineTeammate() {
    return remotePlayerAlly() && remotePlayers.length > 0;
  }

  function onlineTeammateAlive() {
    if (!hasOnlineTeammate()) return false;
    const st = remotePlayers[0].state || {};
    return (st.hp ?? st.maxHp ?? 1) > 0;
  }

  function isOnPlayerTeam(ent) {
    return ent === player || !!(ent && ent.ally);
  }

  function isCpuOpponent(ent) {
    return !!ent && ent !== player && !ent.ally && !ent.dead;
  }

  function isTeammate(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.dead || b.dead) return false;
    if (isOnPlayerTeam(a) && isOnPlayerTeam(b)) return true;
    if (a.enemyDuo != null && b.enemyDuo != null && a.enemyDuo === b.enemyDuo) return true;
    if (isCpuOpponent(a) && isCpuOpponent(b)) return true;
    return false;
  }

  function teamAlive() {
    return (player && !player.dead) || aliveAllies().length > 0 || onlineTeammateAlive();
  }

  function syncDuoTeammate() {
    if (!remotePlayerAlly() || !playing) return;
    if (isCoopMpMode()) return;
    const buddyBots = bots.filter((b) => b.ally && /^buddy/.test(b.id));
    if (hasOnlineTeammate()) {
      buddyBots.forEach((b) => {
        const idx = bots.indexOf(b);
        if (idx >= 0) bots.splice(idx, 1);
      });
    } else {
      const want = matchMode === "trio" ? 2 : 1;
      while (bots.filter((b) => b.ally && /^buddy/.test(b.id)).length < want) {
        const n = bots.filter((b) => b.ally).length + 1;
        bots.push(spawnBuddyBot(`buddy${n}`));
      }
    }
    updateHud();
  }

  function isGodBossMode() {
    const id = selectedGameModeId;
    return id === "big-game" || id === "boss-fight" || id === "super-city-rampage";
  }

  function spawnGodBoss() {
    const boss = makeBot("godboss", GOD_BRAWLER_ID, CENTER_X, BOT_SPAWN_Y, false);
    boss.isGodBoss = true;
    boss.label = "?????.exe — THE GOD";
    boss.hp = 32000;
    boss.maxHp = 32000;
    boss.shoot = 0.15;
    boss.scale = 1.65;
    return boss;
  }

  function spawnBots() {
    bots = [];
    if (isGodBossMode()) {
      bots.push(spawnGodBoss());
      if (!isGodBrawler(brawlerKey)) {
        [
          { x: CENTER_X - 320, kind: "bull" },
          { x: CENTER_X + 320, kind: "colt" },
        ].forEach((s, i) => {
          const kind = BRAWLERS[s.kind] ? s.kind : DEFAULT_BRAWLER;
          const minion = makeBot(`godmin${i}`, kind, s.x, BOT_SPAWN_Y + 80, false);
          minion.label = "God's Guard";
          bots.push(minion);
        });
      }
      return;
    }
    if (matchMode === "duo") {
      if (!hasOnlineTeammate()) bots.push(spawnBuddyBot("buddy1"));
      const topY = BOT_SPAWN_Y;
      const e0 = makeBot("enemy0a", "leon", CENTER_X - 90, topY, false, 0);
      e0.label = "Duo Leon";
      const e1 = makeBot("enemy0b", "bull", CENTER_X + 90, topY, false, 0);
      e1.label = "Duo Bull";
      bots.push(e0, e1);
      return;
    }
    if (matchMode === "trio") {
      if (!hasOnlineTeammate()) {
        bots.push(spawnBuddyBot("buddy1"));
        bots.push(spawnBuddyBot("buddy2"));
      }
      const topY = BOT_SPAWN_Y;
      [
        { x: CENTER_X - 200, kind: "surge" },
        { x: CENTER_X, kind: "crow" },
        { x: CENTER_X + 200, kind: "spike" },
      ].forEach((s, i) => bots.push(makeBot(`trio${i}`, s.kind, s.x, topY, false)));
      return;
    }
    const topY = BOT_SPAWN_Y;
    const spread = Math.min(480, ARENA_W * 0.15);
    [
      { x: CENTER_X - spread, kind: "colt" },
      { x: CENTER_X - spread * 0.5, kind: "rico" },
      { x: CENTER_X, kind: "shelly" },
      { x: CENTER_X + spread * 0.5, kind: "bull" },
      { x: CENTER_X + spread, kind: "leon" },
    ].forEach((s, i) => bots.push(makeBot(`bot${i}`, s.kind, s.x, topY, false)));
  }

  function resetMatch() {
    bullets = [];
    poofs = [];
    bursts = [];
    kills = 0;
    touchedPoison = false;
    matchTime = MATCH_SEC;
    poisonR = POISON_START;
    superCd = 0;
    tranqCd = 0;
    meleeCd = 0;
    meleeSwings = [];
    surgeBoostT = 0;
    leonSmokeT = 0;
    spawnPlayer();
    spawnBots();
    snapCameraToPlayer();
    document.getElementById("win-overlay")?.classList.add("hidden");
    updateHud();
  }

  function addPoof(x, y) {
    poofs.push({ x, y, life: 0.6, r: 10 });
  }

  function addBurst(x, y) {
    bursts.push({ x, y, life: 0.5, r: 20 });
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      bullets.push({ x, y, vx: Math.cos(ang) * 200, vy: Math.sin(ang) * 200, dmg: 0, owner: "fx", life: 0.3 });
    }
  }

  function triggerAttackAnim(ent, b) {
    if (!ent || !b) return;
    ent.attackAnim = { kind: b.anim || "recoil", life: 0.2, ang: ent.angle || 0, attack: b.attack, bullet: b.bulletKind };
  }

  function attackOptsForKind(kind, extra) {
    const b = BRAWLERS[kind] || BRAWLERS[DEFAULT_BRAWLER];
    const opts = { ...(extra || {}) };
    if (b.attackRicochet) opts.ricochet = true;
    if (b.maxBounces) opts.maxBounces = b.maxBounces;
    if (b.attackPierce) opts.pierce = true;
    if (b.attackPoison) opts.poison = true;
    if (b.attackExplode) opts.explode = true;
    if (b.attackLob) opts.lob = true;
    if (b.attackDrill) opts.drill = true;
    if (b.attackGravity) opts.gravity = b.attackGravity;
    if (b.explodeRadius) opts.explodeRadius = b.explodeRadius;
    if (b.bulletSpeed) opts.bulletSpeed = opts.bulletSpeed || b.bulletSpeed;
    if (b.bulletLife) opts.life = b.bulletLife;
    if (b.attack === "shotgun") opts.proximity = true;
    if (kind === brawlerKey) {
      const leg = playerFireOpts();
      if (leg) Object.assign(opts, leg);
    }
    return opts;
  }

  function spawnBullet(ent, angle, dmg, owner, kind, extraOpts) {
    const b = BRAWLERS[kind] || BRAWLERS[DEFAULT_BRAWLER];
    const opts = attackOptsForKind(kind, extraOpts);
    const pellets = opts.pellets ?? b.pellets ?? 1;
    const spread = opts.spread ?? b.spread ?? 0.08;
    const base = dmg / Math.max(1, pellets);
    const speedMult = (opts.bulletSpeed || b.bulletSpeed || 1) * MOD.bulletSpeed;
    const kindName = b.bulletKind || "bullet";
    const life = opts.life || b.bulletLife || 1.35;
    for (let i = 0; i < pellets; i++) {
      const off = pellets === 1 ? 0 : (i - (pellets - 1) / 2) * spread;
      const a = angle + off;
      const spd = 620 * speedMult;
      bullets.push({
        x: ent.x, y: ent.y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        dmg: base,
        owner,
        life,
        kind: kindName,
        brawlerKind: kind,
        proximity: !!opts.proximity,
        ricochet: !!opts.ricochet,
        maxBounces: opts.maxBounces ?? (opts.ricochet ? 1 : 0),
        bounceCount: 0,
        pierce: !!opts.pierce,
        pierceLeft: opts.pierce ? 3 : 0,
        poison: !!opts.poison,
        explode: !!opts.explode,
        explodeRadius: opts.explodeRadius || b.explodeRadius || 0,
        lob: !!opts.lob,
        gravity: opts.gravity || b.attackGravity || 0,
        drill: !!opts.drill,
        drillPhase: 0,
        originX: ent.x,
        originY: ent.y,
        maxDist: opts.drill ? 260 : 0,
        dist: 0,
      });
    }
  }

  function hitRadiusForBullet(b) {
    const k = b.kind || "bullet";
    if (k === "rocket" || k === "dynamite" || k === "bomb" || k === "mine" || k === "case") return 30;
    if (k === "arrow" || k === "beam" || k === "laser") return 22;
    if (k === "knife" || k === "dart" || k === "spike" || k === "card") return 20;
    if (k === "pellet" || k === "sand" || k === "flame" || k === "snow") return 18;
    if (k === "boomerang") return 26;
    return 24;
  }

  function explodeAt(x, y, radius, dmg, owner, bullet) {
    addBurst(x, y);
    const hitRadius = radius || 48;
    const apply = (ent, fromYou) => {
      if (!ent || ent.dead) return;
      if (Math.hypot(ent.x - x, ent.y - y) > hitRadius + 20) return;
      let finalDmg = dmg * (1 - Math.min(1, Math.hypot(ent.x - x, ent.y - y) / (hitRadius + 1)) * 0.35);
      if (bullet?.proximity) finalDmg = proximityBulletDmg(finalDmg, ent);
      if (fromYou && isPlayerGod()) eliminate(ent, true);
      else if (fromYou) damageEntity(ent, finalDmg, true);
      else damageEntity(ent, finalDmg, false);
    };
    if (owner === "you") {
      bots.forEach((bot) => { if (!bot.dead && !bot.ally) apply(bot, true); });
    } else {
      if (player && !player.dead) apply(player, false);
      bots.forEach((bot) => {
        if (bot.dead || bot.id === owner) return;
        const shooter = bots.find((bb) => bb.id === owner);
        if (shooter && isTeammate(shooter, bot)) return;
        apply(bot, false);
      });
    }
  }

  function meleeHitFrom(ent, angle, owner, kind, dmg) {
    const b = BRAWLERS[kind] || BRAWLERS[DEFAULT_BRAWLER];
    const range = b.meleeRange || MELEE_RANGE;
    const arc = b.meleeArc || MELEE_ARC;
    const tryHit = (target, fromYou) => {
      if (!target || target.dead) return;
      if (fromYou && target.ally) return;
      const dx = target.x - ent.x;
      const dy = target.y - ent.y;
      const dist = Math.hypot(dx, dy);
      if (dist > range + 24) return;
      let diff = Math.atan2(dy, dx) - angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > arc) return;
      if (fromYou && isPlayerGod()) eliminate(target, true);
      else if (fromYou) applyPlayerBulletHit(target, dmg, null);
      else damageEntity(target, dmg, false);
    };
    if (owner === "you") bots.forEach((bot) => tryHit(bot, true));
    else if (player && !player.dead && !isTeammate(ent, player)) tryHit(player, false);
    bots.forEach((bot) => {
      if (bot.dead || bot.id === owner) return;
      const shooter = bots.find((bb) => bb.id === owner);
      if (shooter && isTeammate(shooter, bot)) return;
      tryHit(bot, false);
    });
  }

  function fireBrawlerAttack(ent, angle, owner, kind, dmgMult, extraOpts) {
    const b = BRAWLERS[kind] || BRAWLERS[DEFAULT_BRAWLER];
    const dmg = b.dmg * (dmgMult || 1);
    triggerAttackAnim(ent, b);
    if (b.meleeAttack) {
      playBang();
      const range = b.meleeRange || MELEE_RANGE;
      const arc = b.meleeArc || MELEE_ARC;
      meleeSwings.push({ x: ent.x, y: ent.y, ang: angle, life: 0.28, r: range, arc, kind: b.bulletKind, anim: b.anim });
      meleeHitFrom(ent, angle, owner, kind, dmg);
      return;
    }
    playBang();
    spawnBullet(ent, angle, dmg, owner, kind, extraOpts);
  }

  function fireFrom(ent, angle, dmg, pellets, spread, owner, opts) {
    const kind = owner === "you" ? brawlerKey : (bots.find((bot) => bot.id === owner)?.kind || DEFAULT_BRAWLER);
    spawnBullet(ent, angle, dmg, owner, kind, { ...(opts || {}), pellets, spread });
    if (ent) triggerAttackAnim(ent, BRAWLERS[kind]);
    playBang();
  }

  function tryShoot() {
    if (!player || player.dead || shootCd > 0 || !attackHeld) return;
    fireBrawlerAttack(player, player.angle, "you", brawlerKey, 1);
    shootCd = playerFireCooldown(brawler().rate);
  }

  function tryMelee() {
    if (!player || player.dead) return;
    if (brawlerKey !== "sirius" && !BRAWLERS[brawlerKey]?.meleeDmg && brawlerKey !== GOD_BRAWLER_ID && brawlerKey !== COCO_BRAWLER_ID) return;
    if (meleeCd > 0) return;
    const b = brawler();
    const ang = player.angle;
    const mb = cocoBonus() || siriusBonus() || questionExeBonus();
    const range = mb?.meleeRange ?? MELEE_RANGE;
    const arc = mb?.meleeArc ?? MELEE_ARC;
    meleeCd = mb?.meleeCd ?? MELEE_COOLDOWN;
    playBang();
    meleeSwings.push({ x: player.x, y: player.y, ang, life: 0.28, r: range, arc });

    const hit = (ent) => {
      if (ent.dead || ent.ally) return;
      const dx = ent.x - player.x;
      const dy = ent.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > range + 24) return;
      let diff = Math.atan2(dy, dx) - ang;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) <= arc) applyPlayerBulletHit(ent, b.meleeDmg || 980);
    };
    bots.forEach(hit);
  }

  function updateAimFromMove() {
    const { dx, dy } = getMoveInput();
    if (!player || Math.hypot(dx, dy) < 0.15) return;
    player.angle = Math.atan2(dy, dx);
  }

  function superCooldownForBrawler() {
    const customCd = brawler().superCd;
    if (customCd != null) return customCd;
    const legCd = legendaryBonus()?.superCd;
    return legCd || SUPER_COOLDOWN;
  }

  function superOpts(profile, extra) {
    const o = { ...(extra || {}) };
    if (profile.ricochet) { o.ricochet = true; o.maxBounces = profile.maxBounces || 4; }
    if (profile.pierce) o.pierce = true;
    if (profile.proximity) o.proximity = true;
    if (profile.poison) o.poison = true;
    if (profile.explode) { o.explode = true; o.explodeRadius = profile.explodeRadius || 52; }
    if (profile.bulletSpeed) o.bulletSpeed = profile.bulletSpeed;
    return o;
  }

  function executeSuperProfile(profile, b) {
    const ang = player.angle;
    const dmg = b.superDmg;
    const o = (x) => superOpts(profile, x);
    switch (profile.type) {
      case "dash":
        player.x += Math.cos(ang) * (profile.distance || 200);
        player.y += Math.sin(ang) * (profile.distance || 200);
        clampArena(player);
        clampToSafeZone(player);
        fireFrom(player, ang, dmg, profile.shots || 8, profile.spread || 0.5, "you", o());
        if (profile.melee) tryMelee();
        break;
      case "ring":
      case "flame_ring":
      case "ice_ring":
      case "sand_ring":
      case "beam_ring":
        for (let i = 0; i < (profile.count || 16); i++) {
          fireFrom(player, (i / (profile.count || 16)) * Math.PI * 2, dmg, profile.pellets || 1, 0, "you", o());
        }
        break;
      case "fan_line":
        for (let i = 0; i < (profile.count || 12); i++) {
          fireFrom(player, ang, dmg, 1, (i - (profile.count || 12) / 2) * (profile.spread || 0.015), "you", o());
        }
        break;
      case "burst_fan":
      case "burst_forward":
      case "flame_fan":
      case "ice_fan":
      case "lightning_fan":
      case "claw_burst":
      case "poison_fan":
        for (let i = 0; i < (profile.count || 10); i++) {
          fireFrom(player, ang + (i - (profile.count || 10) / 2) * (profile.arc || profile.spread || 0.14), dmg, profile.pellets || 1, 0, "you", o());
        }
        break;
      case "stealth": {
        const lb = leonBonus() || LEON_BONUS;
        leonSmokeT = profile.smokeTime || lb.smokeTime || 2.5;
        if (player) player.hidden = true;
        for (let i = 0; i < (profile.count || 8); i++) {
          fireFrom(player, ang + (i - (profile.count || 8) / 2) * (profile.arc || 0.28), dmg, 1, 0, "you", o({ bulletSpeed: lb.bulletSpeed }));
        }
        break;
      }
      case "shotgun":
        fireFrom(player, ang, dmg, profile.pellets || 10, profile.spread || 0.08, "you", o({ proximity: true }));
        break;
      case "pounce": {
        const kb = kitBonus() || KIT_BONUS;
        player.x += Math.cos(ang) * (profile.distance || kb.pounceDist);
        player.y += Math.sin(ang) * (profile.distance || kb.pounceDist);
        clampArena(player);
        clampToSafeZone(player);
        for (let i = 0; i < (profile.count || 14); i++) {
          fireFrom(player, ang + (i - 7) * (profile.arc || 0.12), dmg, 1, 0, "you", o({ bulletSpeed: kb.bulletSpeed }));
        }
        break;
      }
      case "boost_ring": {
        const sb = surgeBonus() || SURGE_BONUS;
        surgeBoostT = profile.boostTime || sb.boostTime || 4;
        for (let i = 0; i < (profile.count || 24); i++) {
          fireFrom(player, (i / (profile.count || 24)) * Math.PI * 2, dmg, 1, 0, "you", o({ bulletSpeed: sb.bulletSpeed }));
        }
        break;
      }
      case "lob_triple":
        for (let i = -1; i <= 1; i++) {
          fireFrom(player, ang + i * (profile.spread || 0.28), dmg, 1, 0, "you", o({ proximity: true, bulletSpeed: 0.82 }));
        }
        break;
      case "nova": {
        const nb = starNovaBonus() || STARNOVA_BONUS;
        for (let i = 0; i < (profile.ringCount || 16); i++) {
          fireFrom(player, (i / (profile.ringCount || 16)) * Math.PI * 2, dmg, 1, 0, "you", o({ bulletSpeed: nb.bulletSpeed }));
        }
        for (let i = 0; i < (profile.coneCount || 5); i++) {
          fireFrom(player, ang + (i - 2) * 0.14, dmg * 1.08, 2, 0.08, "you", o({ bulletSpeed: nb.bulletSpeed }));
        }
        break;
      }
      case "dual_ring": {
        const gb = glowyBonus() || GLOWY_BONUS;
        for (let i = 0; i < (profile.ringCount || 20); i++) {
          fireFrom(player, (i / (profile.ringCount || 20)) * Math.PI * 2, dmg * 0.92, 1, 0, "you", o({ bulletSpeed: gb.bulletSpeed }));
        }
        for (let i = 0; i < (profile.coneCount || 8); i++) {
          fireFrom(player, ang + (i - 3.5) * 0.08, dmg * 1.12, 1, 0, "you", o({ bulletSpeed: (gb.bulletSpeed || 1) * 1.1 }));
        }
        break;
      }
      case "sirius": {
        const sOpts = o({ ricochet: true, maxBounces: 6, bulletSpeed: 1.4 });
        for (let i = 0; i < 18; i++) fireFrom(player, ang + (i - 8.5) * 0.06, dmg, 1, 0, "you", sOpts);
        for (let i = 0; i < 30; i++) fireFrom(player, (i / 30) * Math.PI * 2, dmg * 0.95, 1, 0, "you", sOpts);
        tryMelee();
        player.angle += 0.55;
        tryMelee();
        player.angle -= 0.55;
        break;
      }
      case "god_exe": {
        const qe = questionExeBonus() || QUESTIONEXE_BONUS;
        const opts = o({ ricochet: true, maxBounces: qe.maxBounces, bulletSpeed: qe.bulletSpeed, pierce: true });
        for (let i = 0; i < 40; i++) fireFrom(player, (i / 40) * Math.PI * 2, dmg, 1, 0, "you", opts);
        for (let i = 0; i < 21; i++) fireFrom(player, ang + (i - 10) * 0.05, dmg * 1.15, 7, 0.1, "you", opts);
        tryMelee();
        break;
      }
      case "oohlala": {
        const ob = oohLaLaBonus() || OOHLALA_BONUS;
        const opts = o({ bulletSpeed: ob.bulletSpeed, pierce: true });
        for (let i = 0; i < 16; i++) fireFrom(player, ang + (i - 7.5) * 0.07, dmg, 8, 0.12, "you", opts);
        for (let i = 0; i < 12; i++) fireFrom(player, (i / 12) * Math.PI * 2, dmg * 0.95, 3, 0.18, "you", opts);
        break;
      }
      case "coco": {
        const cb = cocoBonus() || COCO_BONUS;
        const opts = o({ ricochet: true, maxBounces: cb.maxBounces, bulletSpeed: cb.bulletSpeed, pierce: true });
        for (let i = 0; i < 48; i++) fireFrom(player, (i / 48) * Math.PI * 2, dmg, 1, 0, "you", opts);
        for (let i = 0; i < 24; i++) fireFrom(player, ang + (i - 11.5) * 0.045, dmg * 1.2, 10, 0.08, "you", opts);
        tryMelee();
        tryMelee();
        break;
      }
      case "void_burst":
      case "phoenix":
      case "star_devour":
      case "abyss_wave": {
        const opts = o({ ricochet: profile.ricochet, pierce: profile.pierce, bulletSpeed: profile.bulletSpeed || 1.35 });
        const n = profile.count || 32;
        for (let i = 0; i < n; i++) fireFrom(player, (i / n) * Math.PI * 2, dmg, profile.pellets || 1, 0, "you", opts);
        for (let i = 0; i < Math.floor(n / 2); i++) {
          fireFrom(player, ang + (i - n / 4) * 0.06, dmg * 1.1, profile.pellets || 3, 0.1, "you", opts);
        }
        break;
      }
      case "spiral":
        for (let i = 0; i < (profile.count || 14); i++) {
          fireFrom(player, ang + i * 0.42, dmg, profile.pellets || 1, 0, "you", o());
        }
        break;
      case "cross":
        for (let i = 0; i < 4; i++) {
          fireFrom(player, ang + i * (Math.PI / 2), dmg, profile.pellets || 4, profile.spread || 0.2, "you", o());
        }
        break;
      case "ricochet_burst":
        for (let i = 0; i < (profile.count || 12); i++) {
          fireFrom(player, ang + (i - (profile.count || 12) / 2) * 0.1, dmg, 1, 0, "you", o({ ricochet: true, maxBounces: 3 }));
        }
        break;
      case "pierce_line":
        for (let i = 0; i < (profile.count || 8); i++) {
          fireFrom(player, ang + (i - (profile.count || 8) / 2) * 0.04, dmg, 1, 0, "you", o({ pierce: true, bulletSpeed: 1.3 }));
        }
        break;
      case "lob_spread":
        for (let i = 0; i < (profile.count || 5); i++) {
          fireFrom(player, ang + (i - 2) * (profile.spread || 0.22), dmg, 1, 0, "you", o({ proximity: true, bulletSpeed: 0.8, explode: true }));
        }
        break;
      case "sniper_volley":
      case "rocket_burst":
      case "cactus":
      case "mine_ring":
      case "portal_pull":
      case "hammer_swing":
      case "hand_grab":
      case "wall_bloom":
      case "nova_light":
      case "shotgun_super":
      case "wave_burst":
      case "dash_shot":
        for (let i = 0; i < (profile.count || 9); i++) {
          const a = profile.type === "cross" ? ang + i * (Math.PI / 2)
            : ang + (i - (profile.count || 9) / 2) * (profile.spread || 0.12);
          fireFrom(player, a, dmg, profile.pellets || (profile.type === "shotgun_super" ? 6 : 1), profile.spread || 0, "you", o());
        }
        if (profile.melee || profile.type === "hammer_swing") tryMelee();
        break;
      default:
        fireFrom(player, ang, dmg, profile.pellets || 9, profile.spread || 0.45, "you", o());
    }
  }

  function useSuper() {
    if (!player || player.dead) return;
    if (superCd > 0) {
      showToast(`Super recharging… ${Math.ceil(superCd)}s`);
      return;
    }
    const b = brawler();
    const profile = b.superProfile || window.BS_ATTACKS?.getSuperProfile(brawlerKey) || { type: "burst_forward", count: 9, spread: 0.45 };
    executeSuperProfile(profile, b);
    superCd = superCooldownForBrawler();
    updateHud();
  }

  function spawnTranqShots(profile) {
    const ang = player.angle;
    const count = profile.count || 1;
    const spread = profile.spread || 0;
    for (let i = 0; i < count; i++) {
      const off = count === 1 ? 0 : (i - (count - 1) / 2) * spread;
      const a = ang + off;
      const spd = (profile.speed || 540) * MOD.bulletSpeed;
      bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        dmg: profile.dmg || 160,
        owner: "you-tranq",
        life: profile.life || 1.4,
        tranq: true,
        tranqDuration: profile.duration || 3.5,
        tranqRadius: profile.radius || 26,
        kind: profile.kind || "dart",
        tranqColor: profile.color || "#4dd0e1",
        boomerang: profile.kind === "boomerang",
        boomerangPhase: 0,
        originX: player.x,
        originY: player.y,
        maxDist: profile.kind === "boomerang" ? 220 : 0,
        dist: 0,
      });
    }
  }

  function useTranquilizer() {
    if (!player || player.dead) return;
    const profile = brawler().tranqProfile || window.BS_ATTACKS?.getTranqProfile(brawlerKey) || { kind: "dart", speed: 540, dmg: 160, life: 1.4, duration: 3.5, cooldown: TRANQ_COOLDOWN };
    if (tranqCd > 0) {
      showToast(`${profile.label || "Tranquilizer"} recharging… ${Math.ceil(tranqCd)}s`);
      return;
    }
    playBang();
    spawnTranqShots(profile);
    tranqCd = profile.cooldown || TRANQ_COOLDOWN;
    showToast(`💉 ${profile.label || "Tranquilizer"}!`);
    updateHud();
  }

  function isTranqed(ent) {
    return !!(ent && ent.tranqUntil && animT < ent.tranqUntil);
  }

  function applyTranqHit(ent, dmg, bullet) {
    if (ent.dead || ent.ally) return;
    ent.tranqUntil = animT + (bullet?.tranqDuration || 3.5);
    if (isPlayerGod()) eliminate(ent, true);
    else damageEntity(ent, dmg, true);
  }

  function eliminate(ent, killerYou) {
    ent.dead = true;
    ent.hp = 0;
    addPoof(ent.x, ent.y);
    if (killerYou && ent.isGodBoss && !hasGodBrawlerUnlocked()) {
      unlockGodBrawler();
      showToast("❓ THE GOD falls — ?????.exe unlocked!");
    }
    if (killerYou && ent !== player && !ent.ally) kills++;
    if (ent === player) {
      if (!isTeamMode() || !teamAlive()) endMatch(false);
      else showToast("You're out! Teammate still fighting!");
      return;
    }
    if (ent.ally && isTeamMode() && player.dead && !teamAlive()) {
      endMatch(false);
    }
  }

  function damageEntity(ent, dmg, fromYou) {
    if (ent.dead) return;
    ent.hp -= dmg;
    if (ent.hp <= 0) eliminate(ent, fromYou);
    updateHud();
    checkWin();
  }

  function proximityBulletDmg(baseDmg, target) {
    if (!player || !target) return baseDmg;
    const dist = Math.hypot(target.x - player.x, target.y - player.y);
    const near = 70;
    const far = 380;
    const minMult = 0.35;
    const maxMult = 2.6;
    if (dist <= near) return baseDmg * maxMult;
    if (dist >= far) return baseDmg * minMult;
    const t = 1 - (dist - near) / (far - near);
    return baseDmg * (minMult + t * (maxMult - minMult));
  }

  function applyPlayerBulletHit(ent, dmg, bullet) {
    if (ent.dead || ent.ally) return;
    if (isPlayerGod()) eliminate(ent, true);
    else {
      let finalDmg = bullet?.proximity ? proximityBulletDmg(dmg, ent) : dmg;
      const leg = legendaryBonus();
      if (leg?.dmgMult) finalDmg *= leg.dmgMult;
      damageEntity(ent, finalDmg, true);
    }
  }

  function inPoison(x, y) {
    return Math.hypot(x - CENTER_X, y - CENTER_Y) > poisonR;
  }

  function updatePoisonRadius() {
    if (isGodBossMode()) {
      poisonR = POISON_START;
      return;
    }
    const elapsed = MATCH_SEC - matchTime;
    const t = Math.min(1, Math.max(0, elapsed / MATCH_SEC));
    poisonR = POISON_START - (POISON_START - POISON_MIN) * t;
  }

  function getMoveInput() {
    let dx = moveJoy.dx;
    let dy = moveJoy.dy;
    if (keys.ArrowLeft) dx -= 1;
    if (keys.ArrowRight || keys.d || keys.D) dx += 1;
    if (keys.ArrowUp || keys.w || keys.W) dy -= 1;
    if (keys.ArrowDown || keys.s || keys.S) dy += 1;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    return { dx, dy };
  }

  function aliveBots() {
    return bots.filter((b) => !b.dead && !b.ally);
  }

  function aliveAllies() {
    return bots.filter((b) => !b.dead && b.ally);
  }

  function checkWin() {
    if (!playing) return;
    const enemies = aliveBots();
    if (isTeamMode()) {
      if (enemies.length === 0 && teamAlive()) endMatch(true);
      else if (!teamAlive()) endMatch(false);
    } else if (player && !player.dead && enemies.length === 0) {
      endMatch(true);
    }
  }

  function endMatch(won) {
    if (!playing) return;
    playing = false;
    setPlayAtmosphere(false);
    window.GameSFX?.play(won ? "win" : "lose");
    const flawless = won && player && !player.dead && player.hp >= player.maxHp;
    let coins = won ? 80 + kills * 15 : 25 + kills * 8;
    let charXp = won ? 100 : 20 + kills * 4;
    let blingGain = won ? WIN_BLING_REWARD : 0;
    let energyGain = won ? WIN_ENERGY_REWARD : 0;
    if (flawless) {
      coins += FLAWLESS_COINS;
      charXp += FLAWLESS_XP;
      blingGain += FLAWLESS_BLING;
      energyGain += FLAWLESS_ENERGY;
    }
    addCoins(coins);
    if (blingGain > 0) addBling(blingGain);
    if (energyGain > 0) addEnergyBlasts(energyGain);
    checkQuestProgress(won);
    addPassXp(won ? 90 + kills * 12 : 35 + kills * 5);
    addCharXp(brawlerKey, charXp);
    const mode = getActiveGameMode();
    const bonusText = won ? ` · +${blingGain} Bling ★ · +${energyGain} Energy ⚡` : "";
    const flawlessText = flawless
      ? `\n💎 FLAWLESS! 100% HP — +${FLAWLESS_BLING} Bling · +${FLAWLESS_ENERGY} Energy · +${FLAWLESS_COINS} coins · +${FLAWLESS_XP} XP`
      : "";
    document.getElementById("win-title").textContent = flawless ? "Flawless Victory!" : won ? "Victory!" : "Oops!";
    document.getElementById("win-msg").textContent = won
      ? `${mode.win || "Victory!"} +${coins} coins 🪙 · +${charXp} XP${bonusText}${flawlessText}`
      : `Better luck next time! +${coins} coins anyway 🪙 · Win a match for 100 Bling ★ & 100 Energy ⚡`;
    document.getElementById("win-overlay")?.classList.remove("hidden");
    if (window.GameMP) GameMP.stop();
  }

  function updateHud() {
    const hpEl = document.getElementById("hp-display");
    const aliveEl = document.getElementById("alive-display");
    const timerEl = document.getElementById("timer-display");
    if (player && hpEl) {
      const pct = player.dead ? 0 : Math.max(0, Math.round((player.hp / player.maxHp) * 100));
      hpEl.textContent = `❤️ ${pct}%`;
    }
    if (aliveEl) {
      const enemies = aliveBots().length;
      if (isTeamMode()) {
        const team = (player && !player.dead ? 1 : 0) + aliveAllies().length + (onlineTeammateAlive() ? 1 : 0);
        aliveEl.textContent = `👥 ${team} team · ${enemies} foes`;
      } else {
        const left = (player && !player.dead ? 1 : 0) + enemies;
        aliveEl.textContent = `👊 ${left} left`;
      }
    }
    if (timerEl) {
      if (matchTime <= 60) {
        timerEl.classList.remove("hidden");
        timerEl.textContent = `⏱️ ${Math.ceil(matchTime)}s`;
      } else {
        timerEl.classList.add("hidden");
      }
    }
    const superBtn = document.getElementById("super-btn");
    if (superBtn) {
      if (superCd > 0) {
        superBtn.classList.remove("ready");
        superBtn.classList.add("cooldown");
        superBtn.disabled = true;
        superBtn.textContent = `${Math.ceil(superCd)}s`;
      } else {
        superBtn.classList.add("ready");
        superBtn.classList.remove("cooldown");
        superBtn.disabled = false;
        superBtn.textContent = "⚡ SUPER!";
      }
    }
  }

  function collectBotThreats(bot) {
    const threats = [];
    bullets.forEach((b) => {
      if (b.owner === "fx" || b.owner === bot.id) return;
      if (b.owner === "you" || b.owner === "you-tranq") {
        if (bot.ally) return;
      } else {
        const shooter = bots.find((bb) => bb.id === b.owner);
        if (shooter && isTeammate(bot, shooter)) return;
      }
      const spd = Math.hypot(b.vx, b.vy);
      if (spd < 1) return;
      const dx = bot.x - b.x;
      const dy = bot.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 460) return;
      const bAng = Math.atan2(b.vy, b.vx);
      const toBot = Math.atan2(dy, dx);
      let diff = toBot - bAng;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > 0.95) return;
      const tti = dist / spd;
      if (tti > 1.85 || b.life < tti * 0.75) return;
      const urgency = b.owner === "you" ? 1.35 : 1;
      threats.push({ vx: b.vx, vy: b.vy, weight: (2.1 * urgency) / (tti + 0.05), tti });
    });

    if (player && !player.dead && !bot.ally) {
      const dx = bot.x - player.x;
      const dy = bot.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 520 && dist > 1) {
        const toBot = Math.atan2(dy, dx);
        let aimDiff = toBot - (player.angle || 0);
        while (aimDiff > Math.PI) aimDiff -= Math.PI * 2;
        while (aimDiff < -Math.PI) aimDiff += Math.PI * 2;
        if (Math.abs(aimDiff) < 0.42) {
          const perp = aimDiff >= 0 ? 1 : -1;
          threats.push({
            vx: -Math.sin(toBot) * 260 * perp,
            vy: Math.cos(toBot) * 260 * perp,
            weight: 2.8,
            tti: 0.15,
          });
        }
        if (player.attackAnim?.life > 0 && dist < 420) {
          const away = Math.atan2(dy, dx);
          threats.push({ vx: Math.cos(away) * 280, vy: Math.sin(away) * 280, weight: 3.8, tti: 0.04 });
        }
      }

      meleeSwings.forEach((sw) => {
        if (Math.hypot(sw.x - player.x, sw.y - player.y) > 55) return;
        const dx = bot.x - sw.x;
        const dy = bot.y - sw.y;
        const dist = Math.hypot(dx, dy);
        const reach = (sw.r || MELEE_RANGE) + 40;
        if (dist > reach) return;
        let diff = Math.atan2(dy, dx) - sw.ang;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) > (sw.arc || MELEE_ARC) + 0.4) return;
        const away = Math.atan2(dy, dx);
        threats.push({ vx: Math.cos(away) * 220, vy: Math.sin(away) * 220, weight: 3.4, tti: 0.08 });
      });

      const pb = BRAWLERS[brawlerKey];
      if (pb?.meleeAttack) {
        const pd = Math.hypot(player.x - bot.x, player.y - bot.y);
        if (pd < (pb.meleeRange || MELEE_RANGE) + 36 && player.attackAnim?.life > 0) {
          const away = Math.atan2(bot.y - player.y, bot.x - player.x);
          threats.push({ vx: Math.cos(away) * 240, vy: Math.sin(away) * 240, weight: 3.6, tti: 0.05 });
        }
      }

      if (player.attackAnim?.life > 0 && !pb?.meleeAttack) {
        const pd = Math.hypot(player.x - bot.x, player.y - bot.y);
        if (pd < 340) {
          const away = Math.atan2(bot.y - player.y, bot.x - player.x);
          threats.push({ vx: Math.cos(away) * 160, vy: Math.sin(away) * 160, weight: 1.4, tti: 0.2 });
        }
      }
    }

    return threats;
  }

  function botDodgeDir(threats) {
    let ox = 0;
    let oy = 0;
    threats.forEach((t) => {
      const spd = Math.hypot(t.vx, t.vy) || 1;
      ox += (-t.vy / spd) * t.weight;
      oy += (t.vx / spd) * t.weight;
    });
    const len = Math.hypot(ox, oy);
    if (len < 0.01) return { x: 0, y: 0 };
    return { x: ox / len, y: oy / len };
  }

  function nearestCover(bot, fromX, fromY) {
    let best = null;
    let bestDist = Infinity;
    WALLS.forEach((wall) => {
      if (wall.kind !== "rock" && wall.kind !== "crate" && wall.kind !== "crystal") return;
      const cx = wall.x + wall.w / 2;
      const cy = wall.y + wall.h / 2;
      const d = Math.hypot(cx - bot.x, cy - bot.y);
      if (d > 240 || d >= bestDist) return;
      bestDist = d;
      const away = Math.atan2(bot.y - fromY, bot.x - fromX);
      best = { x: cx + Math.cos(away) * 38, y: cy + Math.sin(away) * 38 };
    });
    return best;
  }

  function pickMoveGoal(bot, target) {
    if (inPoison(bot.x, bot.y)) return { x: CENTER_X, y: CENTER_Y };

    if (!target) {
      if (bot.ally && player && !player.dead) {
        const d = Math.hypot(player.x - bot.x, player.y - bot.y);
        if (d > 170) return { x: player.x + 75, y: player.y - 35 };
        const flank = Math.atan2(player.y - bot.y, player.x - bot.x) + Math.PI / 2;
        return { x: bot.x + Math.cos(flank) * 55, y: bot.y + Math.sin(flank) * 55 };
      }
      if (bot.enemyDuo != null) {
        const partner = bots.find((b) => !b.dead && b.enemyDuo === bot.enemyDuo && b !== bot);
        if (partner) return { x: partner.x + 90, y: partner.y + 30 };
      }
      return { x: CENTER_X, y: CENTER_Y };
    }

    const hpPct = bot.hp / bot.maxHp;
    const tDist = Math.hypot(target.x - bot.x, target.y - bot.y);
    const bStats = BRAWLERS[bot.kind] || BRAWLERS[DEFAULT_BRAWLER];
    const isMelee = !!bStats.meleeAttack;
    const ideal = bot.isGodBoss ? 420 : isMelee ? (bStats.meleeRange || MELEE_RANGE) * 0.78 : 250;
    const ang = Math.atan2(target.y - bot.y, target.x - bot.x);
    const flankSign = ((bot.id.charCodeAt(0) + (bot.enemyDuo || 0)) % 2) ? 1 : -1;
    const strafePhase = animT * 2.2 + bot.id.charCodeAt(0);
    const playerThreat = target === player && player && !player.dead;
    const playerHp = playerThreat ? player.hp / player.maxHp : 1;

    if (!bot.ally && playerThreat) {
      const cover = nearestCover(bot, player.x, player.y);
      if (cover && (hpPct < 0.55 || (player.attackAnim?.life > 0 && tDist < 320))) {
        return cover;
      }
    }

    if (!bot.ally && hpPct < 0.45 && playerThreat) {
      const bush = WALLS.find((w) => w.kind === "bush");
      if (bush && !inBush(bot.x, bot.y)) {
        return { x: bush.x + bush.w / 2, y: bush.y + bush.h / 2 };
      }
      return { x: bot.x - Math.cos(ang) * 130, y: bot.y - Math.sin(ang) * 130 };
    }

    if (tDist < ideal * 0.55 && !isMelee) {
      return { x: bot.x - Math.cos(ang) * 115, y: bot.y - Math.sin(ang) * 115 };
    }

    if (playerThreat && tDist < ideal * 1.35 && !isMelee && hpPct > playerHp * 0.85) {
      const strafe = Math.cos(strafePhase) * 110;
      return {
        x: bot.x + Math.cos(ang + Math.PI / 2) * strafe,
        y: bot.y + Math.sin(ang + Math.PI / 2) * strafe,
      };
    }

    if (tDist > ideal * 1.05 || isMelee) {
      const approachAng = ang + Math.sin(strafePhase) * 0.4;
      return {
        x: target.x - Math.cos(approachAng) * ideal + Math.cos(ang + Math.PI / 2) * flankSign * 55,
        y: target.y - Math.sin(approachAng) * ideal + Math.sin(ang + Math.PI / 2) * flankSign * 55,
      };
    }

    return {
      x: bot.x + Math.cos(ang + Math.PI / 2) * flankSign * 95,
      y: bot.y + Math.sin(ang + Math.PI / 2) * flankSign * 95,
    };
  }

  function scoreTarget(bot, ent) {
    const d = Math.hypot(ent.x - bot.x, ent.y - bot.y);
    const wounded = ent.maxHp ? (1 - ent.hp / ent.maxHp) * 140 : 0;
    const focusPlayer = ent === player ? 35 : 0;
    const hiddenPenalty = ent.hidden && ent !== player ? 60 : 0;
    return d - wounded - focusPlayer + hiddenPenalty;
  }

  function findTarget(bot) {
    const candidates = [];
    if (player && !player.dead && !isTeammate(bot, player)
        && (!player.hidden || Math.hypot(player.x - bot.x, player.y - bot.y) < 120)) {
      candidates.push(player);
    }
    bots.forEach((b) => {
      if (!b.dead && !isTeammate(bot, b)) candidates.push(b);
    });
    if (!candidates.length) return null;
    if (bot.ally || bot.enemyDuo != null) {
      const playerSide = candidates.filter((c) => c === player || c.ally);
      const pool = playerSide.length ? playerSide : candidates;
      return pool.reduce((best, f) => {
        const s = scoreTarget(bot, f);
        return !best || s < best.s ? { ent: f, s } : best;
      }, null)?.ent;
    }
    return candidates.reduce((best, f) => {
      const s = scoreTarget(bot, f);
      return !best || s < best.s ? { ent: f, s } : best;
    }, null)?.ent;
  }

  function updateBots(dt) {
    bots.forEach((bot) => {
      if (bot.dead) return;
      bot.hidden = inBush(bot.x, bot.y);
      const threats = collectBotThreats(bot);
      const dodge = botDodgeDir(threats);
      const dodgePower = Math.min(1.65, 0.5 + threats.length * 0.32);
      const target = findTarget(bot);
      const inCombat = threats.length > 0 || (target && Math.hypot(target.x - bot.x, target.y - bot.y) < 380);

      bot.ai -= dt;
      if (inCombat || bot.ai <= 0) {
        if (!inCombat) bot.ai = 0.14 + Math.random() * 0.18;
        const goal = pickMoveGoal(bot, target);
        bot.tx = goal.x;
        bot.ty = goal.y;
      }

      let moveX = bot.tx - bot.x;
      let moveY = bot.ty - bot.y;
      if (threats.length) {
        moveX += dodge.x * 155 * dodgePower;
        moveY += dodge.y * 155 * dodgePower;
      }

      const dist = Math.hypot(moveX, moveY) || 1;
      const sedated = isTranqed(bot);
      let sp = (BRAWLERS[bot.kind].speed * BOT_SPEED_MULT) * dt;
      if (sedated) sp *= 0.22;
      if (threats.length) sp *= 1.18;

      let nx = bot.x + (moveX / dist) * sp;
      let ny = bot.y + (moveY / dist) * sp;
      if (!hitsRock(nx, bot.y, 22)) bot.x = nx;
      else if (threats.length) {
        bot.x += dodge.x * sp * 1.05;
        if (hitsRock(bot.x, bot.y, 22)) bot.x -= dodge.y * sp * 0.6;
      }
      if (!hitsRock(bot.x, ny, 22)) bot.y = ny;
      else if (threats.length) {
        bot.y += dodge.y * sp * 1.05;
        if (hitsRock(bot.x, bot.y, 22)) bot.y += dodge.x * sp * 0.6;
      }
      clampArena(bot);
      clampToSafeZone(bot);

      bot.shoot -= dt;
      if (target) bot.angle = Math.atan2(target.y - bot.y, target.x - bot.x);
      else if (bot.ally && player && !player.dead) bot.angle = Math.atan2(player.y - bot.y, player.x - bot.x);

      if (target && bot.shoot <= 0 && !sedated) {
        const tDist = Math.hypot(target.x - bot.x, target.y - bot.y);
        const bStats = BRAWLERS[bot.kind] || BRAWLERS[DEFAULT_BRAWLER];
        const isMelee = !!bStats.meleeAttack;
        const maxRange = bot.isGodBoss ? 620 : isMelee ? (bStats.meleeRange || MELEE_RANGE) + 20 : 400;
        const minRange = isMelee ? 40 : 90;
        const hasLoS = !hitsRock(
          (bot.x + target.x) / 2,
          (bot.y + target.y) / 2,
          8
        );
        const safeToShoot = threats.length <= 2 || (bot.hidden && !bot.ally) || tDist < 140;

        if (tDist < maxRange && tDist > minRange && (hasLoS || tDist < 200) && (safeToShoot || tDist < 150)) {
          let ang = Math.atan2(target.y - bot.y, target.x - bot.x);
          if (target.vx != null || target.vy != null) {
            const leadT = Math.min(0.35, tDist / 520);
            ang = Math.atan2(
              target.y + (target.vy || 0) * leadT - bot.y,
              target.x + (target.vx || 0) * leadT - bot.x
            );
          }
          bot.angle = ang;
          const dmgMult = bot.isGodBoss ? 1.35 : bot.ally ? 0.9 : 0.94;
          fireBrawlerAttack(bot, ang, bot.id, bot.kind, dmgMult);
          bot.shoot = bot.isGodBoss ? 0.24 : bot.ally ? BOT_SHOOT_COOLDOWN * 0.82 : BOT_SHOOT_COOLDOWN;
        }
      }
    });
  }

  function update(dt) {
    if (!playing) return;
    if (inWorld) {
      updateWorld(dt);
      return;
    }
    animT += dt;
    matchTime -= dt;
    superCd = Math.max(0, superCd - dt);
    tranqCd = Math.max(0, tranqCd - dt);
    meleeCd = Math.max(0, meleeCd - dt);
    surgeBoostT = Math.max(0, surgeBoostT - dt);
    leonSmokeT = Math.max(0, leonSmokeT - dt);
    updatePoisonRadius();

    if (matchTime <= 0) {
      if (isTeamMode()) {
        if (teamAlive() && aliveBots().length === 0) endMatch(true);
        else if (!teamAlive()) endMatch(false);
        else endMatch(false);
      } else if (!player.dead && aliveBots().length === 0) {
        endMatch(true);
      } else if (player.dead) {
        endMatch(false);
      } else {
        endMatch(aliveBots().length === 0);
      }
      return;
    }

    if (!player.dead) {
      const prevPx = player.x;
      const prevPy = player.y;
      player.hidden = inBush(player.x, player.y) || (brawlerKey === "leon" && leonSmokeT > 0);
      const move = getMoveInput();
      const sp = brawler().speed * playerSpeedMult() * dt;
      let nx = player.x + move.dx * sp;
      let ny = player.y + move.dy * sp;
      if (!hitsRock(nx, player.y, 20)) player.x = nx;
      if (!hitsRock(player.x, ny, 20)) player.y = ny;
      clampArena(player);
      clampToSafeZone(player);
      player.vx = (player.x - prevPx) / Math.max(dt, 0.001);
      player.vy = (player.y - prevPy) / Math.max(dt, 0.001);
      updateAimFromMove();
    }

    shootCd = Math.max(0, shootCd - dt);
    if (player?.attackAnim) {
      player.attackAnim.life -= dt;
      if (player.attackAnim.life <= 0) player.attackAnim = null;
    }
    bots.forEach((bot) => {
      if (bot.attackAnim) {
        bot.attackAnim.life -= dt;
        if (bot.attackAnim.life <= 0) bot.attackAnim = null;
      }
    });
    tryShoot();
    updateBots(dt);

    bots.forEach((bot) => {
      if (!bot.dead && inPoison(bot.x, bot.y)) damageEntity(bot, 140 * dt, false);
    });

    bullets = bullets.filter((b) => {
      if (b.owner === "fx") {
        b.life -= dt;
        return b.life > 0;
      }
      if (b.lob && b.gravity) b.vy += b.gravity * dt;
      if (b.drill) {
        b.dist += Math.hypot(b.vx, b.vy) * dt;
        if (b.drillPhase === 0 && b.dist >= b.maxDist) {
          b.drillPhase = 1;
          b.vx *= -1;
          b.vy *= -1;
        }
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0) return false;
      if (hitsRock(b.x, b.y, 4)) {
        const limit = b.maxBounces ?? (b.ricochet ? 1 : 0);
        if (b.ricochet && (b.bounceCount || 0) < limit) {
          b.bounceCount = (b.bounceCount || 0) + 1;
          b.vx *= -0.94;
          b.vy *= -0.94;
          b.dmg *= 0.95;
          b.life = Math.min(b.life + 0.25, 1.55);
          return true;
        }
        return false;
      }
      if (b.owner === "you-tranq") {
        if (b.boomerang) {
          b.dist += Math.hypot(b.vx, b.vy) * dt;
          if (b.boomerangPhase === 0 && b.dist >= (b.maxDist || 220)) {
            b.boomerangPhase = 1;
            const backAng = Math.atan2(player.y - b.y, player.x - b.x);
            const spd = Math.hypot(b.vx, b.vy);
            b.vx = Math.cos(backAng) * spd;
            b.vy = Math.sin(backAng) * spd;
          }
        }
        const hitR = b.tranqRadius || 26;
        for (const bot of bots) {
          if (bot.dead || bot.ally) continue;
          if (Math.hypot(bot.x - b.x, bot.y - b.y) < hitR) {
            applyTranqHit(bot, b.dmg, b);
            return false;
          }
        }
        if (remotePlayerAlly()) {
          for (const p of remotePlayers) {
            const st = p.state || {};
            if (typeof st.x !== "number") continue;
            if (Math.hypot(st.x - b.x, st.y - b.y) < 26) return false;
          }
        }
        return true;
      }
      if (b.owner === "you") {
        for (const bot of bots) {
          if (bot.dead || bot.ally) continue;
          if (Math.hypot(bot.x - b.x, bot.y - b.y) < hitRadiusForBullet(b)) {
            applyPlayerBulletHit(bot, b.dmg, b);
            if (b.explode) { explodeAt(b.x, b.y, b.explodeRadius, b.dmg * 1.15, b.owner, b); return false; }
            if (b.pierce && b.pierceLeft > 0) { b.pierceLeft -= 1; continue; }
            return false;
          }
        }
        if (remotePlayerAlly()) {
          for (const p of remotePlayers) {
            const st = p.state || {};
            if (typeof st.x !== "number") continue;
            if (Math.hypot(st.x - b.x, st.y - b.y) < 26) return false;
          }
        }
        return true;
      }
      const shooter = bots.find((bot) => bot.id === b.owner);
      if (shooter?.ally) {
        for (const bot of bots) {
          if (!bot.dead && !bot.ally && Math.hypot(bot.x - b.x, bot.y - b.y) < hitRadiusForBullet(b)) {
            damageEntity(bot, b.dmg, false);
            if (b.explode) { explodeAt(b.x, b.y, b.explodeRadius, b.dmg * 1.1, b.owner, b); return false; }
            return false;
          }
        }
        return true;
      }
      if (player && !player.dead && !isTeammate(shooter, player) && Math.hypot(player.x - b.x, player.y - b.y) < hitRadiusForBullet(b)) {
        damageEntity(player, b.dmg, false);
        if (b.explode) { explodeAt(b.x, b.y, b.explodeRadius, b.dmg * 1.1, b.owner, b); return false; }
        return false;
      }
      for (const bot of bots) {
        if (bot.dead || b.owner === bot.id) continue;
        if (shooter && isTeammate(shooter, bot)) continue;
        if (Math.hypot(bot.x - b.x, bot.y - b.y) < hitRadiusForBullet(b)) {
          damageEntity(bot, b.dmg, false);
          if (b.explode) { explodeAt(b.x, b.y, b.explodeRadius, b.dmg * 1.1, b.owner, b); return false; }
          if (b.pierce && b.pierceLeft > 0) { b.pierceLeft -= 1; continue; }
          return false;
        }
      }
      return true;
    });

    meleeSwings = meleeSwings.filter((s) => { s.life -= dt; return s.life > 0; });

    poofs = poofs.filter((p) => { p.life -= dt; p.r += 60 * dt; return p.life > 0; });
    bursts = bursts.filter((p) => { p.life -= dt; p.r += 120 * dt; return p.life > 0; });

    if (player && !player.dead) {
      if (isGodBossMode()) {
        const boss = bots.find((b) => b.isGodBoss && !b.dead);
        if (boss) {
          const tx = (player.x + boss.x) * 0.5;
          const ty = (player.y + boss.y) * 0.5;
          if (window.AllOutCamera) {
            AllOutCamera.follow(cam, tx, ty, dt, 0, 0, 5);
          } else {
            cam.x += (tx - cam.x) * Math.min(1, dt * 5);
            cam.y += (ty - cam.y) * Math.min(1, dt * 5);
          }
        } else if (window.AllOutCamera) {
          AllOutCamera.follow(cam, player.x, player.y, dt, 0, 0, 6);
        } else {
          cam.x += (player.x - cam.x) * Math.min(1, dt * 6);
          cam.y += (player.y - cam.y) * Math.min(1, dt * 6);
        }
      } else if (window.AllOutCamera) {
        AllOutCamera.follow(cam, player.x, player.y, dt, 0, 0, 6);
      } else {
        cam.x += (player.x - cam.x) * Math.min(1, dt * 6);
        cam.y += (player.y - cam.y) * Math.min(1, dt * 6);
      }
    }

    updateHud();
    checkWin();

    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) document.getElementById("toast")?.classList.add("hidden");
    }
  }

  function drawBrawlerStyleLocal(kind, radius) {
    const b = BRAWLERS[kind] || BRAWLERS[DEFAULT_BRAWLER];
    if (b.style === "fire") {
      const fg = ctx.createRadialGradient(0, -10, 2, 0, -8, radius * 0.45);
      fg.addColorStop(0, "#ffeb3b");
      fg.addColorStop(1, "#e65100");
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(0, -10, radius * 0.38, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.style === "diamond") {
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.55);
      ctx.lineTo(radius * 0.32, -radius * 0.05);
      ctx.lineTo(0, radius * 0.45);
      ctx.lineTo(-radius * 0.32, -radius * 0.05);
      ctx.closePath();
      ctx.fill();
    } else if (b.style === "tank") {
      ctx.fillStyle = "#37474f";
      ctx.fillRect(-radius * 0.75, -radius * 0.15, radius * 1.5, radius * 0.55);
      ctx.fillStyle = "#546e7a";
      ctx.fillRect(-radius * 0.55, -radius * 0.35, radius * 1.1, radius * 0.25);
    } else if (b.style === "kit") {
      ctx.fillStyle = "#ff8a65";
      ctx.beginPath();
      ctx.moveTo(-10, -22);
      ctx.lineTo(-4, -14);
      ctx.lineTo(-12, -12);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, -22);
      ctx.lineTo(4, -14);
      ctx.lineTo(12, -12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#212121";
      ctx.beginPath();
      ctx.ellipse(0, -12, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(-5, -11, 2, 2.5, 0, 0, Math.PI * 2);
      ctx.ellipse(5, -11, 2, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#212121";
      ctx.beginPath();
      ctx.arc(-5, -11, 1, 0, Math.PI * 2);
      ctx.arc(5, -11, 1, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.style === "ninja") {
      ctx.fillStyle = "#212121";
      ctx.fillRect(-radius * 0.6, -radius * 0.55, radius * 1.2, radius * 0.22);
      ctx.fillStyle = "#455a64";
      ctx.fillRect(-radius * 0.15, -radius * 0.62, radius * 0.3, radius * 0.12);
    } else if (b.style === "surge") {
      ctx.strokeStyle = "#ffeb3b";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-4, -18);
      ctx.lineTo(0, -8);
      ctx.lineTo(4, -18);
      ctx.moveTo(0, -8);
      ctx.lineTo(0, 2);
      ctx.stroke();
      ctx.fillStyle = "#00e676";
      ctx.beginPath();
      ctx.arc(0, 4, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.style === "star") {
      ctx.fillStyle = "#fff59d";
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * radius * 0.38;
        const y = Math.sin(a) * radius * 0.38 - 8;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#f9a825";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (b.style === "colt") {
      ctx.fillStyle = "#1565c0";
      ctx.fillRect(10, -2, 14, 5);
      ctx.fillRect(22, -1, 6, 3);
    } else if (b.style === "edgar") {
      ctx.fillStyle = "#9c27b0";
      ctx.beginPath();
      ctx.moveTo(-6, -10);
      ctx.quadraticCurveTo(-14, 2, -8, 16);
      ctx.lineTo(-2, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#212121";
      ctx.fillRect(8, -4, 10, 4);
    } else if (b.style === "dynamike") {
      ctx.fillStyle = "#d84315";
      ctx.beginPath();
      ctx.arc(10, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffcc80";
      ctx.fillRect(8, -8, 4, 3);
      ctx.fillStyle = "#bf360c";
      ctx.fillRect(9, 5, 2, 4);
    } else if (b.style === "starnova") {
      ctx.fillStyle = "#ea80fc";
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 - Math.PI / 4;
        const x = Math.cos(a) * radius * 0.34;
        const y = Math.sin(a) * radius * 0.34 - 10;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(0, -10, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.style === "glowy") {
      ctx.fillStyle = "rgba(0, 229, 255, 0.45)";
      ctx.beginPath();
      ctx.arc(0, -10, radius * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(0, -10, radius * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#18ffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -10, radius * 0.28, 0, Math.PI * 2);
      ctx.stroke();
    } else if (b.style === "cactus") {
      ctx.fillStyle = "#689f38";
      ctx.beginPath();
      ctx.arc(0, -12, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-radius * 0.5, -8, 4, 10);
      ctx.fillRect(radius * 0.35, -10, 4, 8);
    } else if (b.style === "crow") {
      ctx.fillStyle = "#4527a0";
      ctx.beginPath();
      ctx.moveTo(-8, -18);
      ctx.lineTo(8, -18);
      ctx.lineTo(0, -8);
      ctx.closePath();
      ctx.fill();
    } else if (b.style === "mortis") {
      ctx.fillStyle = "#00897b";
      ctx.fillRect(8, -4, 16, 6);
      ctx.fillStyle = "#004d40";
      ctx.fillRect(8, -6, 4, 8);
    } else if (b.style === "sniper") {
      ctx.strokeStyle = "#ad1457";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(12, 2);
      ctx.lineTo(28, 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(28, 2, 3, 0, Math.PI * 2);
      ctx.stroke();
    } else if (b.style === "rocket") {
      ctx.fillStyle = "#ef6c00";
      ctx.fillRect(8, -2, 18, 8);
      ctx.fillStyle = "#ff5252";
      ctx.beginPath();
      ctx.moveTo(26, -2);
      ctx.lineTo(32, 2);
      ctx.lineTo(26, 6);
      ctx.closePath();
      ctx.fill();
    } else if (b.style === "void") {
      ctx.fillStyle = "#1a0033";
      ctx.beginPath();
      ctx.arc(0, -10, radius * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7c4dff";
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(0, -10, radius * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#ea80fc";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -10, radius * 0.32, 0, Math.PI * 2);
      ctx.stroke();
    } else if (b.style === "exe") {
      const t = performance.now() * 0.003;
      const glyph = Math.sin(t * 7) > 0.25 ? "?" : "!";
      ctx.font = `bold ${Math.round(radius * 0.55)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffd700";
      ctx.shadowColor = "#ff6f00";
      ctx.shadowBlur = 10;
      ctx.fillText(glyph, 0, -10);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#212121";
      ctx.lineWidth = 2;
      ctx.strokeRect(-radius * 0.42, -radius * 0.55, radius * 0.84, radius * 0.5);
      ctx.fillStyle = "rgba(255, 215, 0, 0.18)";
      ctx.fillRect(-radius * 0.42, -radius * 0.55, radius * 0.84, radius * 0.5);
    } else if (b.style === "oohlala") {
      ctx.fillStyle = "#ec407a";
      ctx.font = `bold ${Math.round(radius * 0.38)}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Ooh", -8, -14);
      ctx.fillText("La", 8, -6);
      ctx.fillStyle = "#f8bbd0";
      ctx.beginPath();
      ctx.arc(-10, -8, 4, 0, Math.PI * 2);
      ctx.arc(10, -12, 3, 0, Math.PI * 2);
      ctx.arc(0, 2, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.style === "dog") {
      ctx.fillStyle = b.dark || "#5D4037";
      ctx.beginPath();
      ctx.ellipse(-6, -2, 4, 6, -0.3, 0, Math.PI * 2);
      ctx.ellipse(2, -1, 4, 6, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = b.color || "#8B6914";
      ctx.beginPath();
      ctx.ellipse(10, -8, 7, 6, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.ellipse(16, -7, 2.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.style === "coco") {
      ctx.fillStyle = "#6d4c41";
      ctx.beginPath();
      ctx.ellipse(0, -8, radius * 0.38, radius * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#4e342e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.28, -14);
      ctx.lineTo(radius * 0.28, -14);
      ctx.moveTo(-radius * 0.2, -4);
      ctx.lineTo(radius * 0.2, -4);
      ctx.stroke();
      ctx.fillStyle = "#fff8e1";
      ctx.font = `bold ${Math.round(radius * 0.34)}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("COCO", 0, 4);
      ctx.font = `${Math.round(radius * 0.42)}px system-ui`;
      ctx.fillText("🥥", 0, -18);
    } else {
      ctx.fillStyle = b.color || "#78909c";
      ctx.beginPath();
      ctx.arc(0, -10, radius * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawAttackEffect(ctx, anim, t, b) {
    const alpha = Math.min(1, t);
    const colors = window.BS_ATTACKS?.bulletColors(anim.bullet || b.bulletKind || "bullet") || { core: "#ffc107", glow: "#ff9800" };
    switch (anim.kind) {
      case "shotgun":
        ctx.fillStyle = `rgba(255,213,79,${alpha * 0.75})`;
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(32, -10);
        ctx.lineTo(32, 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(24, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        return -5 * (1 - t);
      case "throw":
        ctx.fillStyle = colors.glow || "#ff9800";
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(20 + (1 - t) * 8, -6 + Math.sin(t * 12) * 3, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return 3 * (1 - t);
      case "slash":
      case "swing":
        ctx.strokeStyle = colors.core || "#fff";
        ctx.lineWidth = 4;
        ctx.globalAlpha = alpha * 0.85;
        ctx.beginPath();
        ctx.arc(8, 0, 22, -1.1, 1.1);
        ctx.stroke();
        ctx.globalAlpha = 1;
        return 0;
      case "punch":
      case "kick":
        ctx.fillStyle = `rgba(255,204,128,${alpha * 0.7})`;
        ctx.beginPath();
        ctx.ellipse(24, 0, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        return 4 * (1 - t);
      case "bite":
        ctx.fillStyle = `rgba(129,199,132,${alpha * 0.75})`;
        ctx.beginPath();
        ctx.arc(18, 0, 8, 0.2, Math.PI - 0.2);
        ctx.fill();
        return 2 * (1 - t);
      case "cast":
        ctx.fillStyle = colors.glow || "#ba68c8";
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.arc(16, 0, 8 + (1 - t) * 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return 0;
      case "recoil":
      default:
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.35})`;
        ctx.fillRect(12, -3, 10 + (1 - t) * 6, 6);
        return -6 * (1 - t);
    }
  }

  function drawProjectile(b, s, isYou) {
    const ang = Math.atan2(b.vy, b.vx);
    const colors = window.BS_ATTACKS?.bulletColors(b.kind || "bullet") || { core: "#ffc107", glow: "#ff9800", trail: "#ffe082" };
    const isTranq = b.owner === "you-tranq";
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(ang);

    if (isTranq) {
      const c = b.tranqColor || "#4dd0e1";
      const kind = b.kind || "dart";
      ctx.fillStyle = c;
      if (kind === "net") {
        ctx.strokeStyle = c;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-8, -8); ctx.lineTo(8, 8);
        ctx.moveTo(8, -8); ctx.lineTo(-8, 8);
        ctx.stroke();
      } else if (kind === "bubble") {
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-2, -2, 3, 0, Math.PI * 2);
        ctx.stroke();
      } else if (kind === "boomerang") {
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(0, -6);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 6);
        ctx.closePath();
        ctx.fill();
      } else if (kind === "needle") {
        ctx.fillRect(-10, -1.5, 14, 3);
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(10, -3);
        ctx.lineTo(10, 3);
        ctx.closePath();
        ctx.fill();
      } else if (kind === "lightning") {
        ctx.beginPath();
        ctx.moveTo(-4, -8);
        ctx.lineTo(2, -1);
        ctx.lineTo(-2, 0);
        ctx.lineTo(6, 8);
        ctx.lineWidth = 3;
        ctx.strokeStyle = c;
        ctx.stroke();
      } else if (kind === "petal") {
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.ellipse(0, 5, 3, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, kind === "bolt" ? 8 : 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    const kind = b.kind || "bullet";
    if (kind === "rocket" || kind === "bomb" || kind === "dynamite" || kind === "case") {
      ctx.fillStyle = colors.glow;
      ctx.fillRect(-10, -4, 16, 8);
      ctx.fillStyle = colors.core;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(14, -5);
      ctx.lineTo(14, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `rgba(255,120,60,${0.5 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(-12, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "arrow") {
      ctx.strokeStyle = colors.trail;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();
      ctx.fillStyle = colors.glow;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(4, -4);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "knife" || kind === "dart" || kind === "card") {
      ctx.fillStyle = colors.glow;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-8, -3);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-8, 3);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "beam" || kind === "laser" || kind === "light") {
      ctx.strokeStyle = colors.core;
      ctx.lineWidth = kind === "light" ? 5 : 4;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(12, 0);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (kind === "boomerang") {
      ctx.strokeStyle = colors.glow;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0.3, Math.PI * 1.7);
      ctx.stroke();
    } else if (kind === "mine" || kind === "dynamite") {
      ctx.fillStyle = colors.glow;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(-2, -10, 4, 4);
    } else if (kind === "bottle" || kind === "oil" || kind === "berry" || kind === "seed" || kind === "egg" || kind === "toast" || kind === "bone") {
      ctx.fillStyle = colors.glow;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.core;
      ctx.fillRect(-2, -9, 4, 5);
    } else if (kind === "coin") {
      ctx.fillStyle = colors.core;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.glow;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (kind === "spark" || kind === "star" || kind === "gem") {
      ctx.fillStyle = colors.core;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const x = Math.cos(a) * 7;
        const y = Math.sin(a) * 7;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    } else if (kind === "wave" || kind === "sand" || kind === "snow" || kind === "flame" || kind === "toxic" || kind === "water") {
      ctx.fillStyle = colors.glow;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (kind === "pellet" || kind === "bee" || kind === "peep") {
      ctx.fillStyle = colors.core;
      ctx.beginPath();
      ctx.arc(0, 0, kind === "bee" ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "spike" || kind === "claw" || kind === "blade") {
      ctx.fillStyle = colors.glow;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, -4);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "fist" || kind === "kick" || kind === "bat" || kind === "scythe" || kind === "sword") {
      ctx.fillStyle = colors.core;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "glitch") {
      const j = (Math.random() - 0.5) * 5;
      ctx.fillStyle = colors.core;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(Math.random() > 0.45 ? "?" : "!", j, j * 0.4);
      ctx.strokeStyle = colors.glow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10 + j, -4);
      ctx.lineTo(8 + j, 2);
      ctx.lineTo(-4 + j, 7);
      ctx.closePath();
      ctx.stroke();
    } else if (kind === "sparkle") {
      ctx.fillStyle = colors.core;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const x = Math.cos(a) * 7;
        const y = Math.sin(a) * 7;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    } else if (kind === "coconut") {
      ctx.fillStyle = colors.core;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.glow;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-5, -2);
      ctx.lineTo(5, -2);
      ctx.moveTo(-4, 2);
      ctx.lineTo(4, 2);
      ctx.stroke();
    } else {
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 9);
      glow.addColorStop(0, colors.core);
      glow.addColorStop(0.4, colors.glow);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.trail;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(-4, 0);
      ctx.stroke();
    }

    if (b.poison) {
      ctx.strokeStyle = "rgba(129,199,132,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (b.lob) {
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    if (!isYou && b.owner !== "you") {
      ctx.fillStyle = "rgba(255,140,100,0.25)";
      ctx.beginPath();
      ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDogBrawlerBody(s, ang, kind, isYou, ally, ent) {
    const b = BRAWLERS[kind] || BRAWLERS[DEFAULT_BRAWLER];
    const fur = b.color || "#8B6914";
    const furDark = b.dark || "#5D4037";
    const furLight = b.skin || "#A1887F";
    const bodyScale = ent?.scale || 1;
    const scale = bodyScale * (isYou ? 1.08 : 1);
    const wag = Math.sin(performance.now() * 0.008) * 0.35;

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.ellipse(4, 22, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(ang);

    let recoilX = 0;
    if (ent?.attackAnim?.life > 0) {
      const t = ent.attackAnim.life / 0.2;
      recoilX = drawAttackEffect(ctx, ent.attackAnim, t, b);
    }
    ctx.translate(recoilX, 0);

    ctx.strokeStyle = furDark;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-14, 4);
    ctx.quadraticCurveTo(-24, 4 + wag * 10, -28, -2 + wag * 8);
    ctx.stroke();

    ctx.fillStyle = furDark;
    ctx.beginPath();
    ctx.ellipse(-8, 12, 5, 7, 0.3, 0, Math.PI * 2);
    ctx.ellipse(-2, 14, 5, 7, -0.2, 0, Math.PI * 2);
    ctx.fill();

    const bodyG = ctx.createLinearGradient(-12, -8, 16, 16);
    bodyG.addColorStop(0, furLight);
    bodyG.addColorStop(0.5, fur);
    bodyG.addColorStop(1, furDark);
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.ellipse(0, 4, 16, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.ellipse(8, 12, 5, 7, -0.25, 0, Math.PI * 2);
    ctx.ellipse(14, 11, 5, 7, 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.arc(8, -8, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = furLight;
    ctx.beginPath();
    ctx.ellipse(18, -6, 8, 6, 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = furDark;
    ctx.beginPath();
    ctx.ellipse(4, -16, 6, 9, -0.5, 0, Math.PI * 2);
    ctx.ellipse(12, -17, 6, 9, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6D4C41";
    ctx.beginPath();
    ctx.ellipse(4, -15, 3, 5, -0.5, 0, Math.PI * 2);
    ctx.ellipse(12, -16, 3, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(6, -10, 2.5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(11, -10, 2.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#212121";
    ctx.beginPath();
    ctx.arc(6.5, -9.5, 1.4, 0, Math.PI * 2);
    ctx.arc(11.5, -9.5, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.ellipse(24, -6, 3, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#FFD54F";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(8, -2, 9, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.fillStyle = "#FFD54F";
    ctx.beginPath();
    ctx.arc(8, 4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    const gunG = ctx.createLinearGradient(14, -2, 34, 2);
    gunG.addColorStop(0, "#78909c");
    gunG.addColorStop(0.4, "#455a64");
    gunG.addColorStop(1, "#263238");
    ctx.fillStyle = gunG;
    ctx.fillRect(20, -3, 16, 5);
    ctx.fillStyle = "#37474f";
    ctx.fillRect(34, -4, 5, 7);
    ctx.fillStyle = "#111";
    ctx.fillRect(38, -1.5, 5, 2);

    if (isYou) {
      if (isPlayerGod()) {
        ctx.strokeStyle = "#fff59d";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 2, 27, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255, 215, 0, 0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 2, 31, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = "#ffd54f";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 2, 24, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (ally) {
      ctx.strokeStyle = "#69f0ae";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 2, 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = "#a1887f";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#6d4c41";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 2, 32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  function drawBrawlerBody(s, ang, kind, isYou, ally, ent) {
    const b = BRAWLERS[kind] || BRAWLERS[DEFAULT_BRAWLER];
    if (b.style === "dog") {
      drawDogBrawlerBody(s, ang, kind, isYou, ally, ent);
      return;
    }
    const bodyScale = ent?.scale || 1;
    const scale = bodyScale * (isYou ? 1.08 : 1);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.ellipse(4, 22, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(ang);

    let recoilX = 0;
    if (ent?.attackAnim?.life > 0) {
      const t = ent.attackAnim.life / 0.2;
      recoilX = drawAttackEffect(ctx, ent.attackAnim, t, b);
    }
    ctx.translate(recoilX, 0);

    const pantsG = ctx.createLinearGradient(-12, 8, 12, 22);
    pantsG.addColorStop(0, b.pants || "#37474f");
    pantsG.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = pantsG;
    ctx.fillRect(-11, 8, 9, 16);
    ctx.fillRect(2, 8, 9, 16);

    const shirtG = ctx.createLinearGradient(-14, -8, 14, 12);
    shirtG.addColorStop(0, b.shirt || b.color);
    shirtG.addColorStop(0.6, b.color);
    shirtG.addColorStop(1, b.dark);
    ctx.fillStyle = shirtG;
    ctx.beginPath();
    ctx.ellipse(0, 2, 15, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = b.dark;
    ctx.beginPath();
    ctx.ellipse(-12, 4, 5, 8, 0.4, 0, Math.PI * 2);
    ctx.ellipse(12, 4, 5, 8, -0.4, 0, Math.PI * 2);
    ctx.fill();

    const headG = ctx.createRadialGradient(-4, -16, 2, 0, -14, 13);
    headG.addColorStop(0, b.skin || "#ffcc80");
    headG.addColorStop(0.75, b.skin || "#c68642");
    headG.addColorStop(1, "#8d6e63");
    ctx.fillStyle = headG;
    ctx.beginPath();
    ctx.arc(0, -14, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = b.hair || b.dark;
    ctx.beginPath();
    ctx.arc(0, -17, 12, Math.PI * 1.02, Math.PI * 1.98);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-4, -14, 2.2, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(4, -14, 2.2, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#263238";
    ctx.beginPath();
    ctx.arc(-4, -14, 1.1, 0, Math.PI * 2);
    ctx.arc(4, -14, 1.1, 0, Math.PI * 2);
    ctx.fill();

    drawBrawlerStyleLocal(kind, 19);

    if (isYou) {
      if (isPlayerGod()) {
        ctx.strokeStyle = "#fff59d";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 2, 27, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255, 215, 0, 0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 2, 31, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = "#ffd54f";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 2, 24, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (ally) {
      ctx.strokeStyle = "#69f0ae";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 2, 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = b.skin || "#c68642";
    ctx.beginPath();
    ctx.ellipse(14, 3, 5, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    const gunG = ctx.createLinearGradient(14, -2, 34, 2);
    gunG.addColorStop(0, "#78909c");
    gunG.addColorStop(0.4, "#455a64");
    gunG.addColorStop(1, "#263238");
    ctx.fillStyle = gunG;
    ctx.fillRect(14, -2.5, 18, 5);
    ctx.fillStyle = "#37474f";
    ctx.fillRect(30, -3, 6, 6);
    ctx.fillStyle = "#111";
    ctx.fillRect(34, -1, 6, 2);

    if (kind === "surge") {
      ctx.fillStyle = "rgba(0, 230, 118, 0.35)";
      ctx.beginPath();
      ctx.arc(0, 2, 24, 0, Math.PI * 2);
      ctx.fill();
    }

    if (kind === "starnova") {
      ctx.fillStyle = "rgba(224, 64, 251, 0.28)";
      ctx.beginPath();
      ctx.arc(0, 2, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    if (kind === "glowy") {
      ctx.fillStyle = "rgba(0, 229, 255, 0.22)";
      ctx.beginPath();
      ctx.arc(0, 2, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(24, 255, 255, 0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 2, 24, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (kind === "kit") {
      ctx.fillStyle = "#ffab91";
      ctx.beginPath();
      ctx.moveTo(-8, 18);
      ctx.quadraticCurveTo(-14, 24, -10, 28);
      ctx.lineTo(-4, 22);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(8, 18);
      ctx.quadraticCurveTo(14, 24, 10, 28);
      ctx.lineTo(4, 22);
      ctx.closePath();
      ctx.fill();
    }

    if (kind === "sirius") {
      ctx.fillStyle = "#cfd8dc";
      ctx.fillRect(-32, -1.5, 18, 3);
      ctx.fillStyle = "#ffd54f";
      ctx.fillRect(-34, -4, 5, 8);
      ctx.fillStyle = "#78909c";
      ctx.fillRect(-14, -2.5, 4, 5);
    }

    if (GOD_PLAYABLE_IDS.includes(kind) || ent?.isGodBoss) {
      ctx.strokeStyle = kind === COCO_BRAWLER_ID ? "#a1887f" : kind === OOHLALA_BRAWLER_ID ? "#f48fb1" : "#ffd700";
      ctx.lineWidth = kind === COCO_BRAWLER_ID ? 4 : ent?.isGodBoss ? 5 : 3;
      ctx.shadowColor = kind === COCO_BRAWLER_ID ? "#6d4c41" : "#ff6f00";
      ctx.shadowBlur = ent?.isGodBoss ? 18 : kind === COCO_BRAWLER_ID ? 14 : 10;
      ctx.beginPath();
      ctx.arc(0, 2, ent?.isGodBoss ? 36 : kind === COCO_BRAWLER_ID ? 32 : 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (ent?.isGodBoss) {
        ctx.fillStyle = "rgba(255, 215, 0, 0.12)";
        ctx.beginPath();
        ctx.arc(0, 2, 40, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawBrawler(ent, kind, isYou) {
    if (ent.dead) return;
    const b = BRAWLERS[kind] || BRAWLERS[DEFAULT_BRAWLER];
    const s = worldToScreen(ent.x, ent.y);
    if (s.x < -100 || s.x > w + 100 || s.y < -100 || s.y > h + 100) return;

    const hidden = ent.hidden && !isYou;
    if (hidden) ctx.globalAlpha = 0.35;

    drawBrawlerBody(s, ent.angle || 0, kind, isYou, ent.ally, ent);

    if (isTranqed(ent)) {
      ctx.save();
      ctx.strokeStyle = "rgba(77, 208, 225, 0.85)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    const pct = ent.hp / ent.maxHp;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(s.x - 24, s.y - 46, 48, 7);
    ctx.fillStyle = "#333";
    ctx.fillRect(s.x - 23, s.y - 45, 46, 5);
    ctx.fillStyle = pct > 0.5 ? "#66bb6a" : "#ef5350";
    ctx.fillRect(s.x - 23, s.y - 45, 46 * pct, 5);

    ctx.font = "700 10px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    const label = isYou ? playerName() : ent.label || (ent.ally ? `${b.name} Buddy` : b.name);
    const labelY = ent.isGodBoss ? s.y - 62 : s.y - 52;
    ctx.font = ent.isGodBoss ? "700 12px system-ui,sans-serif" : "700 10px system-ui,sans-serif";
    ctx.strokeText(label, s.x, labelY);
    ctx.fillStyle = ent.isGodBoss ? "#ffd700" : "#fff";
    ctx.fillText(label, s.x, labelY);
    ctx.globalAlpha = 1;
  }

  function draw() {
    if (!ctx) return;
    if (inWorld) {
      drawWorldScene();
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
    ctx.clearRect(0, 0, w, h);
    initGrass();
    drawGrassBattlefield(undefined, true);
    drawPoisonZone();
    WALLS.forEach((wall) => drawObstacle(wall));

    meleeSwings.forEach((sw) => {
      const s = worldToScreen(sw.x, sw.y);
      const alpha = Math.min(1, sw.life / 0.24);
      const colors = window.BS_ATTACKS?.bulletColors(sw.kind || "fist") || { core: "#ffeb3b", glow: "#ff9800" };
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(sw.ang);
      ctx.strokeStyle = sw.anim === "slash" || sw.anim === "swing"
        ? `rgba(${sw.kind === "scythe" ? "0,200,180" : "255,236,120"},${alpha * 0.9})`
        : `rgba(255,236,120,${alpha * 0.85})`;
      ctx.lineWidth = sw.anim === "punch" || sw.anim === "kick" ? 7 : 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, sw.r * 0.82, -sw.arc * 0.9, sw.arc * 0.9);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.55})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, sw.r * 0.7, -sw.arc * 0.75, sw.arc * 0.75);
      ctx.stroke();
      ctx.restore();
    });

    bursts.forEach((p) => {
      const s = worldToScreen(p.x, p.y);
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, p.r * 1.6);
      g.addColorStop(0, `rgba(255,250,220,${p.life * 1.2})`);
      g.addColorStop(0.35, `rgba(255,160,60,${p.life * 0.85})`);
      g.addColorStop(0.7, `rgba(220,80,30,${p.life * 0.4})`);
      g.addColorStop(1, "rgba(180,40,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, p.r * 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(80,40,20,${p.life * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + p.r * 0.4, p.r * 0.9, p.r * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    poofs.forEach((p) => {
      const s = worldToScreen(p.x, p.y);
      ctx.fillStyle = `rgba(120,100,80,${p.life * 0.5})`;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + p.r * 0.3, p.r * 1.1, p.r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(200,190,170,${p.life * 0.75})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, p.r * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${p.life * 0.45})`;
      ctx.beginPath();
      ctx.arc(s.x - p.r * 0.25, s.y - p.r * 0.35, p.r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    });

    bullets.forEach((b) => {
      if (b.owner === "fx") return;
      const s = worldToScreen(b.x, b.y);
      drawProjectile(b, s, b.owner === "you");
    });

    bots.forEach((bot) => drawBrawler(bot, bot.kind, false));
    remotePlayers.forEach((p) => {
      const st = p.state || {};
      if (typeof st.x !== "number") return;
      const isAlly = remotePlayerAlly();
      drawBrawler({
        x: st.x, y: st.y,
        hp: st.hp || 2000, maxHp: st.maxHp || 2000,
        angle: st.angle || 0, dead: false, hidden: false,
        ally: isAlly,
        label: isAlly ? (p.name || "Teammate") : (p.name || "Player"),
      }, st.brawler || "rico", false);
    });
    if (player) drawBrawler(player, brawlerKey, true);
    drawArenaLighting();
    if (window.GameRealism) {
      const focus = player ? worldToScreen(player.x, player.y) : { x: w * 0.5, y: robloxViewY() };
      GameRealism.postFrame(ctx, w, h, {
        animT,
        focusX: focus.x,
        focusY: focus.y,
        vignette: 0.24,
        grainCount: Math.min(200, Math.floor((w * h) / 3200)),
        haze: true,
        horizon: 0.42,
      });
    }
  }

  function setPlayAtmosphere(active) {
    const atm = document.querySelector("#game-wrap .gr-atmosphere");
    if (atm) atm.style.display = active ? "none" : "";
  }

  function loop(now) {
    if (!playing) return;
    const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0.016);
    lastFrame = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function initMultiplayer() {
    if (!window.GameMP) return;
    if (typeof markGameMpCustom === "function") markGameMpCustom();
    GameMP.init({
      game: "mini-brawl-stars",
      subroom: mpSubroom(),
      getName: playerName,
      getState: () => ({
        x: player?.x || 0, y: player?.y || 0,
        hp: player?.hp || 0, maxHp: player?.maxHp || 1,
        angle: player?.angle || 0, brawler: brawlerKey, kills,
        mode: selectedGameModeId,
      }),
      onPeers(peers, count) {
        remotePlayers = peers;
        syncDuoTeammate();
        const el = document.getElementById("online-display");
        if (el) {
          if (remotePlayerAlly() && peers.length > 0) {
            el.textContent = `👥 Team: ${peers.map((p) => p.name || "Friend").join(", ")}`;
          } else if (peers.length > 0) {
            el.textContent = `👥 ${count} brawlers online`;
          } else {
            el.textContent = count > 1 ? `👥 ${count} online` : "👥 Solo";
          }
          el.classList.toggle("live", count > 1);
        }
      },
    });
    GameMP.start();
  }

  function getMergeRecipe(resultId) {
    return MERGE_RECIPES.find((r) => r.resultId === resultId);
  }

  function mergeRecipeStatus(recipe) {
    if (isGodBrawlerUnlocked(recipe.resultId)) return "done";
    if (canMergeRecipe(recipe)) return "ready";
    return "locked";
  }

  function mergeRecipeRowMeta(recipe) {
    const result = BRAWLERS[recipe.resultId];
    const ingredients = recipe.ingredients.map((id) => BRAWLERS[id]?.name || id).join(" + ");
    return {
      resultName: result?.name || recipe.label,
      emoji: result?.emoji || "⚗️",
      rarity: result?.rarity || "god",
      ingredients,
    };
  }

  function isMergeMenuOpen() {
    return !document.getElementById("world-merge-overlay")?.classList.contains("hidden");
  }

  function buildMergeMenu() {
    const list = document.getElementById("world-merge-list");
    if (!list) return;
    list.innerHTML = MERGE_RECIPES.map((recipe) => {
      const status = mergeRecipeStatus(recipe);
      const meta = mergeRecipeRowMeta(recipe);
      const statusLabel = status === "done" ? "Unlocked" : status === "ready" ? "Ready" : "Locked";
      const actionBtn = status === "ready"
        ? `<button type="button" class="world-merge-action-btn" data-merge-result="${recipe.resultId}">Merge</button>`
        : `<span class="world-merge-recipe-status">${statusLabel}</span>`;
      return `
        <div class="world-merge-recipe world-merge-recipe-${status} world-merge-recipe-rarity-${meta.rarity}">
          <span class="world-merge-recipe-emoji" aria-hidden="true">${meta.emoji}</span>
          <span class="world-merge-recipe-body">
            <span class="world-merge-recipe-name">${meta.resultName}</span>
            <span class="world-merge-recipe-ingredients">${meta.ingredients} → ${meta.resultName}</span>
          </span>
          ${actionBtn}
        </div>
      `;
    }).join("");
  }

  function handleMergeMenuPick(resultId) {
    if (!resultId) return;
    const recipe = getMergeRecipe(resultId);
    if (!recipe) return;
    const status = mergeRecipeStatus(recipe);
    if (status === "done") {
      showToast(`${recipe.label} is already unlocked!`);
      return;
    }
    if (status === "locked") {
      showToast(`Need ${mergeRecipeRowMeta(recipe).ingredients} unlocked first!`);
      return;
    }
    tryMergeRecipe(resultId);
  }

  function openMergeMenu() {
    if (!inWorld || !nearMergeMachine()) return;
    buildMergeMenu();
    document.getElementById("world-merge-overlay")?.classList.remove("hidden");
  }

  function closeMergeMenu() {
    document.getElementById("world-merge-overlay")?.classList.add("hidden");
  }

  function canMergeRecipe(recipe) {
    return recipe.ingredients.every((id) => isBrawlerPlayable(id));
  }

  function runMergeFx() {
    mergeFxTimer = 2.8;
    addBurst(MERGE_MACHINE.x, MERGE_MACHINE.y);
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      bullets.push({
        x: MERGE_MACHINE.x,
        y: MERGE_MACHINE.y,
        vx: Math.cos(ang) * (180 + Math.random() * 120),
        vy: Math.sin(ang) * (180 + Math.random() * 120),
        dmg: 0,
        owner: "fx",
        life: 0.45 + Math.random() * 0.25,
      });
    }
  }

  function tryMergeRecipe(resultId) {
    if (!inWorld) return;
    if (!isMergeMenuOpen() && !nearMergeMachine()) return;
    const recipe = getMergeRecipe(resultId);
    if (!recipe) return;
    if (isGodBrawlerUnlocked(resultId)) {
      showToast(`${recipe.label} is already unlocked!`);
      return;
    }
    if (!canMergeRecipe(recipe)) {
      const names = recipe.ingredients.map((id) => BRAWLERS[id]?.name || id).join(" + ");
      showToast(`Need ${names} unlocked to merge into ${recipe.label}!`);
      return;
    }
    if (resultId === GOD_BRAWLER_ID) unlockGodBrawler();
    else if (resultId === OOHLALA_BRAWLER_ID) unlockOohLaLa();
    else if (resultId === COCO_BRAWLER_ID) unlockCoco();
    else unlockModGodBrawler(resultId);
    runMergeFx();
    const resultName = resultId === COCO_BRAWLER_ID ? "Ultra God Brawler · Coco" : recipe.label;
    showToast(`⚗️ MERGE COMPLETE — ${recipe.ingredients.map((id) => BRAWLERS[id]?.name).join(" + ")} → ${resultName}!`);
    updateWorldHud();
    updateBrawlerUnlockUI();
    if (isMergeMenuOpen()) buildMergeMenu();
  }

  function canUseMergeMachine() {
    return MERGE_RECIPES.some((r) => !isGodBrawlerUnlocked(r.resultId) && canMergeRecipe(r));
  }

  function nearMergeMachine() {
    if (!player) return false;
    return Math.hypot(player.x - MERGE_MACHINE.x, player.y - MERGE_MACHINE.y) < MERGE_INTERACT_DIST;
  }

  function hitsMergeMachine(x, y, r) {
    const bodyR = MERGE_MACHINE.size * 0.42;
    return Math.hypot(x - MERGE_MACHINE.x, y - MERGE_MACHINE.y) < bodyR + r;
  }

  function updateWorldHud() {
    const back = document.getElementById("world-back-btn");
    const mergeActions = document.getElementById("world-merge-actions");
    const hud = document.getElementById("world-hud");
    const label = document.getElementById("world-hud-label");
    back?.classList.toggle("hidden", !inWorld);
    hud?.classList.toggle("hidden", !inWorld);
    const showMerge = inWorld && nearMergeMachine();
    mergeActions?.classList.toggle("hidden", !showMerge);
    if (!showMerge) closeMergeMenu();
    if (label && inWorld) {
      if (showMerge) {
        const ready = MERGE_RECIPES.filter((r) => !isGodBrawlerUnlocked(r.resultId) && canMergeRecipe(r));
        label.textContent = ready.length
          ? `⚗️ ${ready.length} merge${ready.length === 1 ? "" : "s"} ready — tap Merge or press E`
          : isCocoUnlocked() && MERGE_RECIPES.every((r) => isGodBrawlerUnlocked(r.resultId))
            ? "Merge Machine — all merges complete!"
            : "Merge Machine — open Merge menu to see recipes";
      } else {
        label.textContent = "🌍 Brawl World — walk to the Merge Machine";
      }
    }
    const aliveEl = document.getElementById("alive-display");
    if (aliveEl && inWorld) aliveEl.textContent = "🌍 Brawl World";
  }

  function tryMergeGodBrawler() {
    tryMergeRecipe(GOD_BRAWLER_ID);
  }

  function drawMergeMachine() {
    const s = worldToScreen(MERGE_MACHINE.x, MERGE_MACHINE.y);
    const pulse = 0.94 + Math.sin(animT * 2.8) * 0.06;
    const sz = MERGE_MACHINE.size * pulse;
    const ready = canUseMergeMachine();
    ctx.save();
    ctx.translate(s.x, s.y);

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, sz * 0.38, sz * 0.52, sz * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    const baseG = ctx.createLinearGradient(-sz * 0.5, -sz * 0.2, sz * 0.5, sz * 0.45);
    baseG.addColorStop(0, "#78909c");
    baseG.addColorStop(0.5, "#546e7a");
    baseG.addColorStop(1, "#37474f");
    ctx.fillStyle = baseG;
    ctx.fillRect(-sz * 0.48, sz * 0.05, sz * 0.96, sz * 0.22);

    const bodyG = ctx.createLinearGradient(0, -sz * 0.55, 0, sz * 0.15);
    bodyG.addColorStop(0, ready ? "#fff176" : "#90a4ae");
    bodyG.addColorStop(0.45, ready ? "#ff9800" : "#607d8b");
    bodyG.addColorStop(1, "#455a64");
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.42, sz * 0.08);
    ctx.lineTo(-sz * 0.36, -sz * 0.38);
    ctx.quadraticCurveTo(0, -sz * 0.58, sz * 0.36, -sz * 0.38);
    ctx.lineTo(sz * 0.42, sz * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#263238";
    ctx.lineWidth = 4;
    ctx.stroke();

    const hopper = (ox, emoji, label) => {
      ctx.fillStyle = "#37474f";
      ctx.fillRect(ox - sz * 0.14, -sz * 0.32, sz * 0.28, sz * 0.22);
      ctx.fillStyle = "#546e7a";
      ctx.beginPath();
      ctx.moveTo(ox - sz * 0.16, -sz * 0.32);
      ctx.lineTo(ox, -sz * 0.48);
      ctx.lineTo(ox + sz * 0.16, -sz * 0.32);
      ctx.closePath();
      ctx.fill();
      ctx.font = `${Math.round(sz * 0.14)}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(emoji, ox, -sz * 0.36);
      ctx.fillStyle = "#eceff1";
      ctx.font = `bold ${Math.round(sz * 0.055)}px system-ui`;
      ctx.fillText(label, ox, -sz * 0.12);
    };
    hopper(-sz * 0.34, "⭐", "Sirius");
    hopper(-sz * 0.1, "🐱", "Kit");
    hopper(sz * 0.1, "🔥", "Shelly");
    hopper(sz * 0.34, "🤠", "Colt");

    ctx.fillStyle = "#eceff1";
    ctx.font = `bold ${Math.round(sz * 0.048)}px system-ui`;
    ctx.fillText("→ ❓", -sz * 0.22, sz * 0.2);
    ctx.fillText("→ 💃", sz * 0.22, sz * 0.2);

    const cocoRecipe = getMergeRecipe(COCO_BRAWLER_ID);
    const ultraReady = cocoRecipe && !isCocoUnlocked() && canMergeRecipe(cocoRecipe);
    const bothGods = isGodBrawlerUnlocked(GOD_BRAWLER_ID) && isGodBrawlerUnlocked(OOHLALA_BRAWLER_ID);
    if (bothGods || ultraReady) {
      ctx.fillStyle = ultraReady ? "#fff8e1" : "#cfd8dc";
      ctx.font = `bold ${Math.round(sz * 0.06)}px system-ui`;
      ctx.fillText("❓ + 💃", 0, sz * 0.38);
      ctx.font = `900 ${Math.round(sz * 0.055)}px system-ui`;
      ctx.fillText(ultraReady ? "→ 🥥 COCO" : "→ 🥥 Ultra God", 0, sz * 0.44);
    }

    const coreGlow = ctx.createRadialGradient(0, -sz * 0.02, 4, 0, -sz * 0.02, sz * 0.2);
    coreGlow.addColorStop(0, ultraReady ? "#d7ccc8" : ready ? "#fff59d" : "#b0bec5");
    coreGlow.addColorStop(0.5, ultraReady ? "#8d6e63" : ready ? "#ffd700" : "#78909c");
    coreGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(0, -sz * 0.02, sz * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = ready ? "#ffd700" : "#cfd8dc";
    ctx.font = `bold ${Math.round(sz * 0.2)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const glyph = mergeFxTimer > 0 ? "!" : "?";
    ctx.fillText(glyph, 0, -sz * 0.02);

    ctx.fillStyle = "#eceff1";
    ctx.font = `900 ${Math.round(sz * 0.08)}px system-ui`;
    ctx.fillText("MERGE MACHINE", 0, sz * 0.28);

    if (ready || ultraReady) {
      ctx.strokeStyle = `rgba(${ultraReady ? "141, 110, 99" : "255, 215, 0"}, ${0.45 + Math.sin(animT * 5) * 0.25})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, -sz * 0.02, sz * 0.34, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (mergeFxTimer > 0) {
      ctx.strokeStyle = `rgba(255, 215, 0, ${mergeFxTimer * 0.8})`;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(0, -sz * 0.02, sz * (0.4 + (2.8 - mergeFxTimer) * 0.25), 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function updateWorld(dt) {
    animT += dt;
    mergeFxTimer = Math.max(0, mergeFxTimer - dt);
    if (!player) return;
    const move = getMoveInput();
    const sp = brawler().speed * playerSpeedMult() * dt;
    let nx = player.x + move.dx * sp;
    let ny = player.y + move.dy * sp;
    if (!hitsRock(nx, player.y, 20) && !hitsMergeMachine(nx, player.y, 22)) player.x = nx;
    if (!hitsRock(player.x, ny, 20) && !hitsMergeMachine(player.x, ny, 22)) player.y = ny;
    clampArena(player);
    if (window.AllOutCamera) {
      AllOutCamera.follow(cam, player.x, player.y, dt, move.dx, move.dy, 9);
    } else {
      cam.x += (player.x - cam.x) * Math.min(1, dt * 9);
      cam.y += (player.y - cam.y) * Math.min(1, dt * 9);
    }
    if (Math.hypot(move.dx, move.dy) > 0.12) player.angle = Math.atan2(move.dy, move.dx);
    bullets = bullets.filter((b) => {
      if (b.owner !== "fx") return false;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      return b.life > 0;
    });
    poofs = poofs.filter((p) => { p.life -= dt; p.r += 60 * dt; return p.life > 0; });
    bursts = bursts.filter((p) => { p.life -= dt; p.r += 120 * dt; return p.life > 0; });
    updateWorldHud();
  }

  function drawWorldScene() {
    initGrass();
    drawGrassBattlefield(undefined, true);
    WALLS.forEach((wall) => drawObstacle(wall));
    drawMergeMachine();

    bursts.forEach((p) => {
      const s = worldToScreen(p.x, p.y);
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, p.r * 1.6);
      g.addColorStop(0, `rgba(255,250,220,${p.life * 1.2})`);
      g.addColorStop(0.35, `rgba(255,215,0,${p.life * 0.85})`);
      g.addColorStop(1, "rgba(180,40,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, p.r * 1.6, 0, Math.PI * 2);
      ctx.fill();
    });

    poofs.forEach((p) => {
      const s = worldToScreen(p.x, p.y);
      ctx.fillStyle = `rgba(255,215,0,${p.life * 0.65})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, p.r * 1.1, 0, Math.PI * 2);
      ctx.fill();
    });

    bullets.forEach((b) => {
      if (b.owner !== "fx") return;
      const s = worldToScreen(b.x, b.y);
      ctx.fillStyle = `rgba(255,215,0,${Math.min(1, b.life * 2)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    if (player) drawBrawler(player, brawlerKey, true);
    drawArenaLighting();
    if (window.GameRealism) {
      const focus = player ? worldToScreen(player.x, player.y) : { x: w * 0.5, y: robloxViewY() };
      GameRealism.postFrame(ctx, w, h, {
        animT,
        focusX: focus.x,
        focusY: focus.y,
        vignette: 0.2,
        grainCount: 120,
        haze: true,
      });
    }
  }

  function startWorld() {
    inWorld = true;
    saveName();
    brawlerKey = document.querySelector(".brawler-card.selected")?.dataset.brawler || DEFAULT_BRAWLER;
    if (!isBrawlerPlayable(brawlerKey)) brawlerKey = DEFAULT_BRAWLER;
    buildWorldMap();
    hideMainMenu();
    document.getElementById("app")?.classList.add("playing", "in-world");
    playing = true;
    bullets = [];
    bots = [];
    poofs = [];
    bursts = [];
    kills = 0;
    mergeFxTimer = 0;
    moveJoy.dx = 0;
    moveJoy.dy = 0;
    spawnPlayer();
    player.x = CENTER_X;
    player.y = CENTER_Y + 380;
    ensurePlayerSpawnClear();
    player.angle = -Math.PI / 2;
    cam.x = player.x;
    cam.y = player.y;
    document.getElementById("super-btn")?.classList.add("hidden");
    document.getElementById("attack-btn")?.classList.add("hidden");
    document.getElementById("melee-btn")?.classList.add("hidden");
    document.getElementById("timer-display")?.classList.add("hidden");
    updateWorldHud();
    resize();
    lastFrame = performance.now();
    if (window.GameMP) GameMP.stop();
    enterFullscreen();
    showToast("🌍 Mini Brawl World — walk to the Merge Machine!");
    requestAnimationFrame(loop);
  }

  function stopWorld() {
    inWorld = false;
    playing = false;
    setPlayAtmosphere(false);
    mergeFxTimer = 0;
    closeMergeMenu();
    bullets = [];
    document.getElementById("app")?.classList.remove("playing", "in-world");
    document.getElementById("world-back-btn")?.classList.add("hidden");
    document.getElementById("world-merge-actions")?.classList.add("hidden");
    document.getElementById("world-hud")?.classList.add("hidden");
    attackHeld = false;
    showMainMenu();
  }

  function enterFullscreen() {
    window.AllOutFullscreen?.request(document.documentElement).catch(() => {});
  }

  function startGame() {
    inWorld = false;
    enterFullscreen();
    saveName();
    brawlerKey = document.querySelector(".brawler-card.selected")?.dataset.brawler || DEFAULT_BRAWLER;
    if (!isBrawlerPlayable(brawlerKey)) brawlerKey = DEFAULT_BRAWLER;
    applySelectedGameMode();
    const mode = getActiveGameMode();
    hideMainMenu();
    document.getElementById("super-btn")?.classList.remove("hidden");
    document.getElementById("attack-btn")?.classList.remove("hidden");
    updatePlayControls();
    document.getElementById("app")?.classList.add("playing");
    playing = true;
    generateArenaMap();
    resetMatch();
    resize();
    setPlayAtmosphere(true);
    lastFrame = performance.now();
    initMultiplayer();
    requestAnimationFrame(loop);
    const mapTag = ` · ${currentMapName}`;
    if (brawlerKey === GOD_BRAWLER_ID) {
      showToast(`❓ ?????.exe — glitch bullets, melee, and one-shot power!${mapTag}`);
    } else if (brawlerKey === OOHLALA_BRAWLER_ID) {
      showToast(`💃 Ooh La La — sparkle shots one-shot everyone!${mapTag}`);
    } else if (brawlerKey === COCO_BRAWLER_ID) {
      showToast(`🥥 Coco — Ultra God devours all! Coconut barrage + one-shot power!${mapTag}`);
    } else if (isGodBossMode() && !isGodBrawler(brawlerKey)) {
      showToast(`👹 Face THE GOD — defeat ?????.exe to unlock the God Brawler!${mapTag}`);
    } else if (isPlayerGod()) {
      showToast(`⚡ GOD — your bullets one-shot enemies! Teammates are safe.${mapTag}`);
    } else if (isTeamMode()) {
      if (hasOnlineTeammate()) {
        showToast(`${remotePlayers[0].name || "Friend"} is on your team! · ${mode.name}${mapTag}`);
      } else {
        const buddy = aliveAllies()[0];
        showToast(buddy ? `${BRAWLERS[buddy.kind].name} Buddy joined! · ${mode.name}${mapTag}` : `${mode.name} — team mode!${mapTag}`);
      }
    } else {
      showToast(`${mode.toast || `${mode.emoji} ${mode.name} — modded!`}${mapTag}`);
    }
  }

  function stopGame() {
    if (inWorld) {
      stopWorld();
      return;
    }
    playing = false;
    document.getElementById("app")?.classList.remove("playing");
    setPlayAtmosphere(false);
    document.getElementById("super-btn")?.classList.add("hidden");
    document.getElementById("attack-btn")?.classList.add("hidden");
    document.getElementById("melee-btn")?.classList.add("hidden");
    attackHeld = false;
    if (window.GameMP) GameMP.stop();
    showMainMenu();
  }

  function showMainMenu() {
    document.getElementById("main-menu")?.classList.remove("hidden");
    updateMenuCoins();
    updatePassMenuHint();
    updateCharRankUI();
    updateMenuHeroLabels();
    updateBrawlerUnlockUI();
    updateGameModeUI();
    resizeMenuHeroCanvas();
    startMenuPreview();
  }

  function hideMainMenu() {
    document.getElementById("main-menu")?.classList.add("hidden");
    stopMenuPreview();
  }

  function startMenuPreview() {
    if (menuPreviewId) return;
    initGrass();
    menuCamAngle = 0;
    const previewBrawlers = [
      { x: CENTER_X - 120, y: CENTER_Y + 40, kind: "colt" },
      { x: CENTER_X + 80, y: CENTER_Y - 30, kind: "rico" },
      { x: CENTER_X - 40, y: CENTER_Y + 120, kind: "bull" },
    ];
    const tick = (now) => {
      if (playing) { menuPreviewId = null; return; }
      menuCamAngle += 0.0015;
      const previewCam = { x: ARENA_W / 2 + Math.cos(menuCamAngle) * 180, y: ARENA_H / 2 + Math.sin(menuCamAngle) * 120 };
      animT = now / 1000;
      drawGrassBattlefield(previewCam);
      drawPoisonZone(previewCam);
      WALLS.slice(0, 10).forEach((wall) => drawObstacle(wall, previewCam));
      const savedCam = { x: cam.x, y: cam.y };
      cam.x = previewCam.x;
      cam.y = previewCam.y;
      previewBrawlers.forEach((f, i) => {
        const bob = Math.sin(animT * 2 + i) * 3;
        drawBrawler({ x: f.x, y: f.y + bob, hp: 2000, maxHp: 2000, angle: animT + i, dead: false, hidden: false, ally: false }, f.kind, i === 0);
      });
      cam.x = savedCam.x;
      cam.y = savedCam.y;
      drawArenaLighting(previewCam);
      drawMenuHeroBrawler(now);
      menuPreviewId = requestAnimationFrame(tick);
    };
    menuPreviewId = requestAnimationFrame(tick);
  }

  function stopMenuPreview() {
    if (menuPreviewId) { cancelAnimationFrame(menuPreviewId); menuPreviewId = null; }
  }

  function openHubPanel(title, html) {
    const overlay = document.getElementById("hub-panel-overlay");
    const titleEl = document.getElementById("hub-panel-title");
    const bodyEl = document.getElementById("hub-panel-body");
    if (!overlay || !titleEl || !bodyEl) return;
    titleEl.classList.remove("quest-panel-title");
    titleEl.textContent = title;
    bodyEl.innerHTML = html;
    overlay.classList.remove("hidden");
  }

  function closeHubPanel() {
    document.getElementById("hub-panel-overlay")?.classList.add("hidden");
  }

  function bindHubButtons() {
    migrateQuestProgress();
    updateQuestMenuHint();
    updatePassMenuHint();

    document.getElementById("brawl-pass-btn")?.addEventListener("click", openBrawlPass);
    document.getElementById("brawl-pass-close")?.addEventListener("click", closeBrawlPass);
    document.getElementById("hub-quests-top-btn")?.addEventListener("click", () => openQuestsPanel("regular"));
    document.getElementById("hub-quests-btn")?.addEventListener("click", () => openQuestsPanel("regular"));
    document.getElementById("hub-bs-quests-btn")?.addEventListener("click", () => openQuestsPanel("regular"));
    document.getElementById("hub-shop-btn")?.addEventListener("click", () => openShopPanel("regular"));
    document.getElementById("hub-games-btn")?.addEventListener("click", openGamesPanel);
    document.getElementById("selected-game-mode-btn")?.addEventListener("click", openGamesPanel);
    document.getElementById("hub-panel-close")?.addEventListener("click", closeHubPanel);
  }

  function bindEvents() {
    document.getElementById("play-btn")?.addEventListener("click", startGame);
    document.getElementById("level-up-btn")?.addEventListener("click", tryLevelUp);
    document.getElementById("play-world-btn")?.addEventListener("click", startWorld);
    document.getElementById("world-back-btn")?.addEventListener("click", stopWorld);
    document.getElementById("world-merge-open-btn")?.addEventListener("click", openMergeMenu);
    document.getElementById("world-merge-close-btn")?.addEventListener("click", closeMergeMenu);
    document.getElementById("world-merge-list")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-merge-result]");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      handleMergeMenuPick(btn.getAttribute("data-merge-result"));
    });
    document.getElementById("world-merge-list")?.addEventListener("pointerdown", (e) => {
      const btn = e.target.closest(".world-merge-action-btn");
      if (btn) e.preventDefault();
    });
    document.getElementById("again-btn")?.addEventListener("click", () => {
      playing = true;
      generateArenaMap();
      resetMatch();
      lastFrame = performance.now();
      initMultiplayer();
      requestAnimationFrame(loop);
      updatePlayControls();
      document.getElementById("win-overlay")?.classList.add("hidden");
      showToast(`New map: ${currentMapName}`);
    });
    document.getElementById("menu-btn")?.addEventListener("click", () => {
      stopGame();
      document.getElementById("win-overlay")?.classList.add("hidden");
    });
    document.getElementById("super-btn")?.addEventListener("click", useSuper);
    document.getElementById("melee-btn")?.addEventListener("click", tryMelee);
    document.getElementById("settings-btn")?.addEventListener("click", () => document.getElementById("settings-overlay")?.classList.remove("hidden"));
    document.getElementById("close-settings-btn")?.addEventListener("click", () => document.getElementById("settings-overlay")?.classList.add("hidden"));
    document.getElementById("reset-rank-btn")?.addEventListener("click", () => {
      if (window.confirm("Reset ALL brawlers to Wood ★ (1 star, 0 XP)?")) {
        resetAllCharRank();
        document.getElementById("settings-overlay")?.classList.add("hidden");
      }
    });
    document.getElementById("fullscreen-btn")?.addEventListener("click", () => {
      window.AllOutFullscreen?.toggle(document.documentElement).catch(() => {});
    });
    document.getElementById("leave-game-btn")?.addEventListener("click", () => { window.location.href = "../../index.html"; });

    const attackBtn = document.getElementById("attack-btn");
    const setAttack = (on) => { attackHeld = on; attackBtn?.classList.toggle("held", on); };
    attackBtn?.addEventListener("pointerdown", (e) => { e.preventDefault(); attackBtn.setPointerCapture(e.pointerId); setAttack(true); });
    attackBtn?.addEventListener("pointerup", (e) => { if (attackBtn.hasPointerCapture(e.pointerId)) attackBtn.releasePointerCapture(e.pointerId); setAttack(false); });
    attackBtn?.addEventListener("pointercancel", () => setAttack(false));

    if (window.AllOutControls) {
      AllOutControls.bindMoveStick(moveJoy, "move-base", "move-knob");
      AllOutControls.bindKeyboard(keys);
    }
    window.addEventListener("keydown", (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space" || e.key === "f" || e.key === "F") { attackHeld = true; attackBtn?.classList.add("held"); }
      if (!playing) return;
      if (inWorld && (e.key === "e" || e.key === "E") && !e.repeat) {
        e.preventDefault();
        if (nearMergeMachine()) {
          if (isMergeMenuOpen()) closeMergeMenu();
          else openMergeMenu();
        }
        return;
      }
      if (inWorld) return;
      if ((e.key === "s" || e.key === "S") && !e.repeat) { e.preventDefault(); useSuper(); }
      if ((e.key === "t" || e.key === "T") && !e.repeat) { e.preventDefault(); useTranquilizer(); }
      if ((e.key === "a" || e.key === "A") && !e.repeat) { e.preventDefault(); tryMelee(); }
    });
    window.addEventListener("keyup", (e) => {
      if (e.code === "Space" || e.key === "f" || e.key === "F") { attackHeld = false; attackBtn?.classList.remove("held"); }
    });
    window.addEventListener("resize", resize);
    bindHubButtons();
  }

  canvas = document.getElementById("game-canvas");
  ctx = canvas?.getContext("2d");
  wrap = document.getElementById("game-wrap");
  bindEvents();
  resize();
  __bapDeferInit(function () {
    initGrass();
    migrateLegacyUnlocks();
    syncPassUnlocks();
    buildRosterUI();
    buildGodBanner();
    selectedGameModeId = loadGameModeId();
    brawlerKey = loadSelectedBrawlerId();
    updateGameModeUI();
    updateMenuCoins();
    updatePassMenuHint();
    updateCharRankUI();
    updateBrawlerUnlockUI();
    applySavedBrawlerSelection();
    if (new URLSearchParams(window.location.search).has("resetRank")) {
      resetAllCharRank();
      window.history.replaceState({}, "", window.location.pathname);
    }
    showMainMenu();
  });
})();
