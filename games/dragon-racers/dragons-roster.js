(function () {
  "use strict";

  function mk(id, name, emoji, rarity, role) {
    return { id, name, emoji, rarity, role };
  }

  const COMMONS = [
    mk("ember", "Ember", "🔥", "common", "Balanced speed"),
    mk("storm", "Storm", "⚡", "common", "Fast sprinter"),
    mk("frost", "Frost", "❄️", "common", "Smooth control"),
    mk("mossy", "Mossy", "🌿", "common", "Forest glider"),
    mk("blaze", "Blaze", "💥", "common", "Turbo burst"),
    mk("coral", "Coral", "🪸", "common", "Reef rider"),
    mk("slate", "Slate", "🪨", "common", "Rock steady"),
    mk("sunny", "Sunny", "☀️", "common", "Sun streak"),
    mk("dusk", "Dusk", "🌙", "common", "Night flyer"),
    mk("pebble", "Pebble", "🐚", "common", "Desert dash"),
    mk("tide", "Tide", "🌊", "common", "Ocean surge"),
    mk("vine", "Vine", "🍃", "common", "Jungle zip"),
  ];

  const RARES = [
    mk("copper", "Copper", "🟤", "rare", "Heat rider"),
    mk("brass", "Brass", "🟡", "rare", "Metal wing"),
    mk("ironclaw", "Ironclaw", "⚙️", "rare", "Steel dive"),
    mk("skyfin", "Skyfin", "🐟", "rare", "Cloud skimmer"),
    mk("cloudwing", "Cloudwing", "☁️", "rare", "Mist glider"),
    mk("mistral", "Mistral", "🌫️", "rare", "Wind cutter"),
    mk("breeze", "Breeze", "🍃", "rare", "Gentle drift"),
    mk("gust", "Gust", "💨", "rare", "Quick gust"),
    mk("whirl", "Whirl", "🌀", "rare", "Spin dash"),
    mk("gale", "Gale", "🌬️", "rare", "Strong tailwind"),
    mk("zephyr", "Zephyr", "🎐", "rare", "Light flyer"),
    mk("current", "Current", "🔵", "rare", "Stream racer"),
    mk("ripple", "Ripple", "〰️", "rare", "Wave rider"),
    mk("sparkle", "Sparkle", "✨", "rare", "Star flash"),
    mk("gleam", "Gleam", "💫", "rare", "Bright streak"),
    mk("shimmer", "Shimmer", "🌟", "rare", "Shining glide"),
  ];

  const SUPER_RARES = [
    mk("thunder", "Thunder", "⛈️", "superRare", "Storm breaker"),
    mk("tempest", "Tempest", "🌪️", "superRare", "Raging flight"),
    mk("cyclone", "Cyclone", "🌀", "superRare", "Vortex spin"),
    mk("hurricane", "Hurricane", "🌊", "superRare", "Mega blast"),
    mk("monsoon", "Monsoon", "🌧️", "superRare", "Rain surge"),
    mk("avalanche", "Avalanche", "🏔️", "superRare", "Ice crash"),
    mk("glacier", "Glacier", "🧊", "superRare", "Frozen rush"),
    mk("crystal", "Crystal", "💎", "superRare", "Gem wing"),
    mk("prism", "Prism", "🔮", "superRare", "Light split"),
    mk("opal", "Opal", "🩵", "superRare", "Soft shine"),
    mk("ruby", "Ruby", "♦️", "superRare", "Crimson jet"),
    mk("sapphire", "Sapphire", "🔷", "superRare", "Blue streak"),
    mk("emerald", "Emerald", "💚", "superRare", "Jade glide"),
    mk("topaz", "Topaz", "🟨", "superRare", "Golden flash"),
    mk("amethyst", "Amethyst", "🟣", "superRare", "Purple dive"),
    mk("onyx", "Onyx", "⬛", "superRare", "Shadow wing"),
  ];

  const EPICS = [
    mk("phoenix", "Phoenix", "🔥", "epic", "Rebirth blaze"),
    mk("wyvern", "Wyvern", "🦅", "epic", "Sky hunter"),
    mk("serpent", "Serpent", "🐍", "epic", "Coil strike"),
    mk("leviathan", "Leviathan", "🐋", "epic", "Deep surge"),
    mk("kraken", "Kraken", "🦑", "epic", "Tentacle dash"),
    mk("griffin", "Griffin", "🦁", "epic", "Noble flight"),
    mk("hydra", "Hydra", "🐲", "epic", "Multi-boost"),
    mk("basilisk", "Basilisk", "👁️", "epic", "Stone gaze"),
    mk("chimera", "Chimera", "🐐", "epic", "Triple breath"),
    mk("pegasus", "Pegasus", "🦄", "epic", "Divine stride"),
    mk("draco", "Draco", "⭐", "epic", "Star tail"),
    mk("vortex", "Vortex", "🕳️", "epic", "Void pull"),
    mk("nebula", "Nebula", "🌌", "epic", "Cosmic mist"),
    mk("comet", "Comet", "☄️", "epic", "Tail blaze"),
    mk("eclipse", "Eclipse", "🌑", "epic", "Dark sun"),
    mk("aurora", "Aurora", "🌈", "epic", "Polar lights"),
  ];

  const LEGENDARIES = [
    mk("celestial", "Celestial", "👼", "legendary", "Heaven wing"),
    mk("cosmic", "Cosmic", "🪐", "legendary", "Galaxy run"),
    mk("stellar", "Stellar", "✴️", "legendary", "Star born"),
    mk("solar", "Solar", "🌞", "legendary", "Sun crown"),
    mk("lunar", "Lunar", "🌕", "legendary", "Moon arc"),
    mk("nova", "Nova", "💥", "legendary", "Blast off"),
    mk("supernova", "Supernova", "🌟", "legendary", "Mega flare"),
    mk("quasar", "Quasar", "🔆", "legendary", "Bright core"),
    mk("pulsar", "Pulsar", "📡", "legendary", "Pulse beat"),
    mk("infinity", "Infinity", "♾️", "legendary", "Endless glide"),
    mk("eternal", "Eternal", "⏳", "legendary", "Timeless"),
    mk("mythic", "Mythic", "📜", "legendary", "Legend flight"),
    mk("ancient", "Ancient", "🏛️", "legendary", "Old power"),
    mk("primordial", "Primordial", "🌋", "legendary", "First flame"),
    mk("titan", "Titan", "🗿", "legendary", "Colossal"),
    mk("sovereign", "Sovereign", "👑", "legendary", "Royal sky"),
  ];

  const ULTRAS = [
    mk("omega", "Omega", "Ω", "ultra", "Final form"),
    mk("alpha", "Alpha", "🐺", "ultra", "Pack leader"),
    mk("genesis", "Genesis", "🌱", "ultra", "World starter"),
    mk("apocalypse", "Apocalypse", "☢️", "ultra", "End wing"),
  ];

  const GODS = [
    mk("deus", "Deus", "⚡", "god", "Divine spark"),
    mk("pantheon", "Pantheon", "🏺", "god", "Many gods"),
    mk("olympus", "Olympus", "⛰️", "god", "Peak flight"),
    mk("celestia", "Celestia", "🕊️", "god", "Holy soar"),
  ];

  const ULTRA_GODS = [
    mk("omnis", "Omnis", "🌐", "ultraGod", "All realms"),
    mk("aeternum", "Aeternum", "♾️", "ultraGod", "Forever flame"),
  ];

  const DRAGON_ROSTER = COMMONS.concat(RARES, SUPER_RARES, EPICS, LEGENDARIES, ULTRAS, GODS, ULTRA_GODS);

  const RARITY_ORDER = ["common", "rare", "superRare", "epic", "legendary", "ultra", "god", "ultraGod"];

  const RARITY_LABELS = {
    common: "Common",
    rare: "Rare",
    superRare: "Super Rare",
    epic: "Epic",
    legendary: "Legendary",
    ultra: "Ultra Legendary",
    god: "God",
    ultraGod: "Ultra God",
  };

  const SHOP_COST_BY_RARITY = {
    common: 100,
    rare: 200,
    superRare: 400,
    epic: 700,
    legendary: 1000,
    ultra: 1500,
    god: 2500,
    ultraGod: 4000,
  };

  const SPEED_BY_RARITY = {
    common: 1,
    rare: 1.06,
    superRare: 1.1,
    epic: 1.14,
    legendary: 1.17,
    ultra: 1.2,
    god: 1.23,
    ultraGod: 1.26,
  };

  function hashId(id) {
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function shopCostFor(rarity) {
    return SHOP_COST_BY_RARITY[rarity] || 100;
  }

  function shopCostForDragon(id) {
    const d = DRAGON_ROSTER.find((x) => x.id === id);
    return d ? shopCostFor(d.rarity) : 100;
  }

  function dragonSpeed(rarity, id) {
    const base = SPEED_BY_RARITY[rarity] || 1;
    const bump = (hashId(id) % 9) * 0.008;
    return Math.round((base + bump) * 1000) / 1000;
  }

  function findDragon(id) {
    return DRAGON_ROSTER.find((d) => d.id === id);
  }

  window.DRDragonRoster = {
    DRAGON_ROSTER,
    RARITY_ORDER,
    RARITY_LABELS,
    SHOP_COST_BY_RARITY,
    SPEED_BY_RARITY,
    shopCostFor,
    shopCostForDragon,
    dragonSpeed,
    findDragon,
    hashId,
  };
})();
