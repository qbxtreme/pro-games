(function () {
  "use strict";

  const FLAG_KEY = "proMaxGearAppliedV1";

  const CAPTURE_GEAR = ["gear1", "gear2", "income1", "income2", "hp1", "special1"];
  const DINO_GEAR = ["tranq1", "tranq2", "snack", "gift", "fence", "arena"];
  const FISHERMON_GEAR = ["rod1", "rod2", "bait", "cooler", "anchor", "net"];
  const MONSTER_GEAR = ["horns", "crown", "flame", "aura"];
  const MEME_CAR_IDS = ["rizz", "skibidi", "sigma", "toilet", "fanum", "gigachad", "ohio", "grimace"];
  const EGG_IDS = ["common", "rare", "epic", "legendary", "mythic", "divine"];

  const BRAINROT_GAMES = ["save-a-brainrot"];

  function load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (_) {
      return false;
    }
  }

  function merge(key, patch) {
    const prev = load(key) || {};
    return save(key, Object.assign({}, prev, patch));
  }

  function bossList(max) {
    return Array.from({ length: max + 1 }, (_, i) => i);
  }

  function captureSave(expansionIds, zoneMax) {
    return {
      level: 50,
      exp: 0,
      coins: 999999,
      zone: zoneMax,
      bossesBeaten: bossList(zoneMax),
      expansions: expansionIds.slice(),
      rebirths: 5,
      bones: 999,
      fat: 999,
    };
  }

  function eggInventory() {
    const inv = {};
    EGG_IDS.forEach((id) => {
      inv[id] = 99;
    });
    return inv;
  }

  function patchDragonForestSave(prev) {
    if (!window.BecomeAProOwner?.isActive(prev?.trainerName)) return prev || {};
    const data = Object.assign({}, prev || {});
    data.pets = (data.pets || []).map((p) => ({ ...p }));
    const isGoodie = (p) => p.name && String(p.name).toLowerCase().includes("goodie");
    let goodie = data.pets.find(isGoodie);
    if (!goodie) {
      goodie = data.pets.find((p) => p.element === "fire");
      if (goodie) goodie.name = "Goodie";
      else {
        goodie = {
          id: Date.now(),
          element: "fire",
          emoji: "🔥",
          species: "Fire Dragon",
          name: "Goodie",
          level: "Infinity",
          stars: 5,
          xp: 0,
          powerBonus: 35,
          eggTier: "divine",
          shiny: false,
        };
        data.pets.push(goodie);
      }
    }
    goodie.eggTier = "divine";
    goodie.powerBonus = 35;
    goodie.level = "Infinity";
    goodie.xp = 0;
    goodie.stars = 5;
    goodie.species = goodie.species || "Fire Dragon";
    data.battlePetId = goodie.id;
    data.startersDone = true;
    data.playerLevel = "Infinity";
    data.playerXP = 0;
    return data;
  }

  function applyAll() {
    let count = 0;

    const captureGames = [
      { key: "fishermon", gear: FISHERMON_GEAR, zones: 7 },
      { key: "mob-battle", gear: DINO_GEAR, zones: 6 },
      ...BRAINROT_GAMES.map((id) => ({ key: id, gear: CAPTURE_GEAR, zones: 4 })),
    ];

    captureGames.forEach(({ key, gear, zones }) => {
      if (merge(key, captureSave(gear, zones))) count++;
    });

    if (merge("raisingAMonster", {
      level: 50,
      exp: 0,
      coins: 999999,
      zone: 4,
      bossesBeaten: bossList(4),
      upgrades: MONSTER_GEAR.slice(),
    })) count++;

    if (merge("dogFatSimulator", {
      foodTier: 7,
      coins: 999999999,
      fat: 999999,
      bestFat: 999999,
      rebirths: 10,
      trophies: 99,
      upgrades: { chew: 20, bite: 15, sell: 10, auto: 1 },
    })) count++;

    if (merge("memeCarRaceSave", {
      money: 999999999,
      owned: MEME_CAR_IDS.slice(),
      selected: "grimace",
      bestSolo: 999999,
      pvpWins: 999,
    })) count++;

    if (save("dragonForestSave", patchDragonForestSave(Object.assign({
      coins: 999999,
      wins: 9999,
      playerLevel: "Infinity",
      playerXP: 0,
      eggInventory: eggInventory(),
      snackInventory: 999,
      starDustInventory: 999,
      worldTwoUnlocked: true,
      currentWorld: 2,
    }, load("dragonForestSave") || {})))) count++;

    const statGames = {
      "100-buttons": { bestTier: 10, presses: 9999 },
    };

    Object.entries(statGames).forEach(([key, patch]) => {
      if (merge(key, patch)) count++;
    });

    try {
      localStorage.setItem("snakeIoBest", "999999");
      count++;
    } catch (_) {}
    if (merge("snakeIoHubStats", { gamesPlayed: 999, totalLength: 999999 })) count++;

    localStorage.setItem(FLAG_KEY, String(Date.now()));
    return { count };
  }

  function applyIfNeeded(showToast) {
    const result = applyAll();
    if (typeof showToast === "function") {
      showToast(`⚡ Max gear unlocked across ${result.count} game saves!`);
    }
    return result;
  }

  window.ProMaxGear = {
    applyAll,
    applyIfNeeded,
    FLAG_KEY,
  };
})();
