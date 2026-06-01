window.CAPTURE_DEFAULTS = {
  "starterMob": "mob0",
  "rareMobType": "goldenRare",
  "specialGearId": "special1",
  "loadingTips": [
    "Buy & steal brainrots, upgrade parts, and create crazy combinations!",
    "Explore every zone in Evolve a Brainrot!",
    "Upgrade gear in the Pro Shop to get stronger!",
    "Team up with friends — up to 8 players online!",
    "Beat mythic bosses to unlock new worlds!"
  ],
  "zones": [
    {
      "id": 0,
      "name": "🏠 Home Base",
      "mobLevel": 0,
      "reqLevel": 1,
      "isPier": true,
      "floor": "hsl(48, 55%, 42%)",
      "floorAlt": "hsl(85, 55%, 50%)",
      "decor": "pier",
      "skyTop": "hsl(48, 55%, 45%)",
      "skyBot": "hsl(78, 70%, 75%)",
      "mobs": [],
      "bossColor": "hsl(122, 55%, 58%)"
    },
    {
      "id": 1,
      "name": "🌍 Open Field",
      "mobLevel": 1,
      "reqLevel": 1,
      "floor": "hsl(85, 55%, 50%)",
      "floorAlt": "hsl(122, 55%, 58%)",
      "decor": "ocean",
      "skyTop": "hsl(48, 50%, 40%)",
      "skyBot": "hsl(48, 65%, 70%)",
      "mobs": [
        "mob0",
        "mob1",
        "mob2"
      ],
      "bossType": "bossAlpha",
      "bossColor": "hsl(159, 55%, 42%)"
    },
    {
      "id": 2,
      "name": "🏝️ Outpost",
      "mobLevel": 5,
      "reqLevel": 4,
      "floor": "hsl(122, 55%, 58%)",
      "floorAlt": "hsl(159, 55%, 42%)",
      "decor": "coral",
      "skyTop": "hsl(68, 50%, 43%)",
      "skyBot": "hsl(73, 65%, 70%)",
      "mobs": [
        "mob3",
        "mob4",
        "mob5"
      ],
      "bossType": "bossBeta",
      "bossColor": "hsl(196, 55%, 50%)"
    },
    {
      "id": 3,
      "name": "🌋 Hot Zone",
      "mobLevel": 10,
      "reqLevel": 8,
      "floor": "hsl(159, 55%, 42%)",
      "floorAlt": "hsl(196, 55%, 50%)",
      "decor": "lava",
      "skyTop": "hsl(88, 50%, 46%)",
      "skyBot": "hsl(98, 65%, 70%)",
      "mobs": [
        "mob6",
        "mob7",
        "mob8"
      ],
      "bossType": "bossGamma",
      "bossColor": "hsl(233, 55%, 58%)"
    },
    {
      "id": 4,
      "name": "🌀 Depths",
      "mobLevel": 15,
      "reqLevel": 12,
      "floor": "hsl(196, 55%, 50%)",
      "floorAlt": "hsl(233, 55%, 58%)",
      "decor": "depths",
      "skyTop": "hsl(108, 50%, 49%)",
      "skyBot": "hsl(123, 65%, 70%)",
      "mobs": [
        "mob9",
        "mob10",
        "mob11"
      ],
      "bossType": "bossDelta",
      "bossColor": "hsl(48, 55%, 42%)"
    },
    {
      "id": 5,
      "name": "❄️ Frost Land",
      "mobLevel": 20,
      "reqLevel": 16,
      "floor": "hsl(233, 55%, 58%)",
      "floorAlt": "hsl(48, 55%, 42%)",
      "decor": "ice",
      "skyTop": "hsl(128, 50%, 52%)",
      "skyBot": "hsl(148, 65%, 70%)",
      "mobs": [
        "mob12",
        "mob13",
        "mob14"
      ],
      "bossType": "bossOmega",
      "bossColor": "hsl(85, 55%, 50%)"
    },
    {
      "id": 6,
      "name": "⚔️ Battle Bay",
      "mobLevel": 0,
      "reqLevel": 5,
      "isPvp": true,
      "floor": "hsl(159, 55%, 42%)",
      "floorAlt": "hsl(196, 55%, 50%)",
      "decor": "ocean",
      "skyTop": "hsl(248, 45%, 35%)",
      "skyBot": "hsl(268, 55%, 55%)",
      "mobs": [],
      "bossColor": "#880e4f"
    }
  ],
  "mobTypes": {
    "mob0": {
      "name": "Scout",
      "emoji": "⭐",
      "color": "hsl(48, 55%, 42%)",
      "kind": "unit",
      "hp": 47,
      "atk": 9,
      "exp": 17,
      "coins": 7,
      "rx": 16,
      "ry": 14
    },
    "mob1": {
      "name": "Raider",
      "emoji": "🔥",
      "color": "hsl(85, 55%, 50%)",
      "kind": "unit",
      "hp": 55,
      "atk": 11,
      "exp": 21,
      "coins": 9,
      "rx": 20,
      "ry": 17
    },
    "mob2": {
      "name": "Guard",
      "emoji": "💎",
      "color": "hsl(122, 55%, 58%)",
      "kind": "unit",
      "hp": 63,
      "atk": 13,
      "exp": 25,
      "coins": 11,
      "rx": 24,
      "ry": 20,
      "evolve": "mobEvo0",
      "evolveLv": 8
    },
    "mob3": {
      "name": "Champion",
      "emoji": "🎯",
      "color": "hsl(159, 55%, 42%)",
      "kind": "unit",
      "hp": 71,
      "atk": 15,
      "exp": 29,
      "coins": 13,
      "rx": 28,
      "ry": 14
    },
    "mob4": {
      "name": "Elite",
      "emoji": "🛡️",
      "color": "hsl(196, 55%, 50%)",
      "kind": "unit",
      "hp": 79,
      "atk": 17,
      "exp": 33,
      "coins": 15,
      "rx": 16,
      "ry": 17
    },
    "mob5": {
      "name": "Master",
      "emoji": "⚡",
      "color": "hsl(233, 55%, 58%)",
      "kind": "unit",
      "hp": 99,
      "atk": 21,
      "exp": 42,
      "coins": 19,
      "rx": 20,
      "ry": 20
    },
    "mob6": {
      "name": "Legend",
      "emoji": "🌟",
      "color": "hsl(48, 55%, 42%)",
      "kind": "unit",
      "hp": 107,
      "atk": 23,
      "exp": 46,
      "coins": 21,
      "rx": 24,
      "ry": 14
    },
    "mob7": {
      "name": "Mythic",
      "emoji": "💥",
      "color": "hsl(85, 55%, 50%)",
      "kind": "unit",
      "hp": 115,
      "atk": 25,
      "exp": 50,
      "coins": 23,
      "rx": 28,
      "ry": 17
    },
    "mob8": {
      "name": "Scout 2",
      "emoji": "👾",
      "color": "hsl(122, 55%, 58%)",
      "kind": "unit",
      "hp": 123,
      "atk": 27,
      "exp": 54,
      "coins": 25,
      "rx": 16,
      "ry": 20
    },
    "mob9": {
      "name": "Raider 2",
      "emoji": "🦾",
      "color": "hsl(159, 55%, 42%)",
      "kind": "unit",
      "hp": 131,
      "atk": 29,
      "exp": 58,
      "coins": 27,
      "rx": 20,
      "ry": 14
    },
    "mob10": {
      "name": "Guard 2",
      "emoji": "🎪",
      "color": "hsl(196, 55%, 50%)",
      "kind": "unit",
      "hp": 151,
      "atk": 33,
      "exp": 67,
      "coins": 31,
      "rx": 24,
      "ry": 17
    },
    "mob11": {
      "name": "Champion 2",
      "emoji": "🎭",
      "color": "hsl(233, 55%, 58%)",
      "kind": "unit",
      "hp": 159,
      "atk": 35,
      "exp": 71,
      "coins": 33,
      "rx": 28,
      "ry": 20
    },
    "mob12": {
      "name": "Elite 2",
      "emoji": "🦑",
      "color": "hsl(48, 55%, 42%)",
      "kind": "unit",
      "hp": 167,
      "atk": 37,
      "exp": 75,
      "coins": 35,
      "rx": 16,
      "ry": 14
    },
    "mob13": {
      "name": "Master 2",
      "emoji": "🛏️",
      "color": "hsl(85, 55%, 50%)",
      "kind": "unit",
      "hp": 175,
      "atk": 39,
      "exp": 79,
      "coins": 37,
      "rx": 20,
      "ry": 17
    },
    "mob14": {
      "name": "Legend 2",
      "emoji": "🧠",
      "color": "hsl(122, 55%, 58%)",
      "kind": "unit",
      "hp": 183,
      "atk": 41,
      "exp": 83,
      "coins": 39,
      "rx": 24,
      "ry": 20
    },
    "mob15": {
      "name": "Mythic 2",
      "emoji": "⭐",
      "color": "hsl(159, 55%, 42%)",
      "kind": "unit",
      "hp": 203,
      "atk": 45,
      "exp": 92,
      "coins": 43,
      "rx": 28,
      "ry": 14
    },
    "mobEvo0": {
      "name": "Scout Prime",
      "emoji": "⭐",
      "color": "hsl(85, 55%, 50%)",
      "kind": "unit",
      "hp": 135,
      "atk": 29,
      "exp": 59,
      "coins": 27,
      "rx": 16,
      "ry": 20
    },
    "goldenRare": {
      "name": "Golden Scout",
      "emoji": "⭐",
      "color": "#ffd54f",
      "kind": "unit",
      "hp": 107,
      "atk": 23,
      "exp": 46,
      "coins": 21,
      "rx": 24,
      "ry": 14,
      "rare": true
    },
    "bossAlpha": {
      "name": "Scout Boss",
      "emoji": "🎯",
      "color": "hsl(122, 55%, 58%)",
      "kind": "boss",
      "hp": 120,
      "atk": 18,
      "exp": 40,
      "coins": 15,
      "rx": 28,
      "ry": 24,
      "cursed": false
    },
    "bossBeta": {
      "name": "Raider Boss",
      "emoji": "🛡️",
      "color": "hsl(159, 55%, 42%)",
      "kind": "boss",
      "hp": 155,
      "atk": 22,
      "exp": 55,
      "coins": 20,
      "rx": 30,
      "ry": 26,
      "cursed": false
    },
    "bossGamma": {
      "name": "Guard Boss",
      "emoji": "⚡",
      "color": "hsl(196, 55%, 50%)",
      "kind": "boss",
      "hp": 190,
      "atk": 26,
      "exp": 70,
      "coins": 25,
      "rx": 32,
      "ry": 28,
      "cursed": false
    },
    "bossDelta": {
      "name": "Champion Boss",
      "emoji": "🌟",
      "color": "hsl(233, 55%, 58%)",
      "kind": "boss",
      "hp": 225,
      "atk": 30,
      "exp": 85,
      "coins": 30,
      "rx": 34,
      "ry": 30,
      "cursed": true
    },
    "bossOmega": {
      "name": "Elite Boss",
      "emoji": "💥",
      "color": "hsl(48, 55%, 42%)",
      "kind": "boss",
      "hp": 260,
      "atk": 34,
      "exp": 100,
      "coins": 35,
      "rx": 36,
      "ry": 32,
      "cursed": false
    },
    "bossFinal": {
      "name": "Master Boss",
      "emoji": "👑",
      "color": "hsl(85, 55%, 50%)",
      "kind": "boss",
      "hp": 295,
      "atk": 38,
      "exp": 115,
      "coins": 40,
      "rx": 38,
      "ry": 34,
      "cursed": false
    },
    "fusionA": {
      "name": "Fusion Scout",
      "emoji": "🧬",
      "color": "hsl(122, 55%, 58%)",
      "kind": "fusion",
      "hp": 151,
      "atk": 33,
      "exp": 67,
      "coins": 31,
      "rx": 24,
      "ry": 17,
      "hybrid": true
    },
    "fusionB": {
      "name": "Fusion Raider",
      "emoji": "🧬",
      "color": "hsl(196, 55%, 50%)",
      "kind": "fusion",
      "hp": 167,
      "atk": 37,
      "exp": 75,
      "coins": 35,
      "rx": 16,
      "ry": 14,
      "hybrid": true
    }
  },
  "fusionRecipes": [
    {
      "parents": [
        "mob0",
        "mob1"
      ],
      "result": "fusionA"
    },
    {
      "parents": [
        "mob3",
        "mob4"
      ],
      "result": "fusionB"
    },
    {
      "parents": [
        "fusionA",
        "mob0"
      ],
      "result": "fusionA"
    },
    {
      "parents": [
        "fusionB",
        "mob3"
      ],
      "result": "fusionB"
    }
  ],
  "gear": [
    {
      "id": "gear1",
      "name": "Pro Gear Mk1",
      "emoji": "⚙️",
      "desc": "+25% catch power!",
      "cost": 60,
      "catch": 0.25
    },
    {
      "id": "gear2",
      "name": "Legend Gear",
      "emoji": "⚙️",
      "desc": "+50% catch power total",
      "cost": 140,
      "catch": 0.25,
      "req": "gear1"
    },
    {
      "id": "income1",
      "name": "Snack Stand",
      "emoji": "🍿",
      "desc": "+2 base coins/sec",
      "cost": 50,
      "income": 2
    },
    {
      "id": "income2",
      "name": "Mega Stand",
      "emoji": "🏪",
      "desc": "+4 base coins/sec",
      "cost": 120,
      "income": 4
    },
    {
      "id": "hp1",
      "name": "Armor Pack",
      "emoji": "🛡️",
      "desc": "+20 max HP",
      "cost": 80,
      "hp": 20
    },
    {
      "id": "special1",
      "name": "Power Move",
      "emoji": "💥",
      "desc": "Unlock special attack — 1 in 3 turns",
      "cost": 150,
      "special": true
    }
  ],
  "ui": {
    "fightBtn": "⚔️ BATTLE!",
    "bossBtn": "👑 MYTHIC!",
    "portalBtn": "🌀 Travel",
    "feedBtn": "🍖 Feed",
    "breedBtn": "🧬 Fuse",
    "rideBtn": "🚀 Boost",
    "pvpBtn": "⚔️ PvP!",
    "shopBtn": "🛒 Pro Shop",
    "shopTitle": "🛒 Pro Shop",
    "shopSubtitle": "Buy brainrots, merge, steal & rebirth!",
    "shopClose": "Back to Base",
    "battleAttack": "⚔️ Attack",
    "battleSpecial": "💥 Power Move",
    "battleFlee": "🏃 Run",
    "defaultName": "Player",
    "starterNickname": "Buddy",
    "trainerFallback": "Player",
    "levelEmoji": "🧠",
    "leaderboardTitle": "🧠 Top Tycoons",
    "pierName": "🏠 Brainrot Base",
    "pierIncome": "base income",
    "feedStation": "🍔 Feed Pen",
    "fusionStation": "🧬 Merge Lab",
    "feedSuccess": "Fed your team! +{exp} EXP 🍖",
    "breedNeedCoins": "Need {cost} coins to fuse! 🪙",
    "breedSuccess": "Fused a {emoji} {name}! 🧬",
    "rideOn": "Boost mode on! 🚀",
    "rideOff": "Boost off.",
    "buyReqFirst": "Buy Pro Gear Mk1 first!",
    "buyOwned": "Owned",
    "buyLocked": "Locked",
    "bought": "Got {name}! {emoji}",
    "playBtn": "Play Now!",
    "stealBtn": "🤫 Steal!",
    "buyBtn": "🛒 Buy Brainrot",
    "rebirthBtn": "♻️ Rebirth",
    "rareTitle": "✨ Rare Brainrots"
  }
};
