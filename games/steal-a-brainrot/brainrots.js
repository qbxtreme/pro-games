/** Steal a BrainRot — character catalog (Roblox-inspired names & tiers) */
(function () {
  "use strict";

  const RARITY = {
    common: { label: "Common", color: "#9e9e9e", glow: "#bdbdbd", weight: 5200 },
    rare: { label: "Rare", color: "#42a5f5", glow: "#64b5f6", weight: 2800 },
    epic: { label: "Epic", color: "#ab47bc", glow: "#ce93d8", weight: 1200 },
    legendary: { label: "Legendary", color: "#ffb300", glow: "#ffd54f", weight: 400 },
    mythic: { label: "Mythic", color: "#ef5350", glow: "#ff7043", weight: 200 },
    god: { label: "Brainrot God", color: "#e040fb", glow: "#ea80fc", weight: 15 },
    secret: { label: "Secret", color: "#212121", glow: "#f48fb1", weight: 4 },
    og: { label: "OG", color: "#fff176", glow: "#ffffff", weight: 1 },
  };

  function br(id, name, emoji, rarity, cost, income) {
    return { id, name, emoji, rarity, cost, income };
  }

  const LIST = [
    // Common
    br("noobini_pizzanini", "Noobini Pizzanini", "🍕", "common", 25, 1),
    br("lirili_larila", "Lirilì Larilà", "🦒", "common", 250, 3),
    br("tim_cheese", "Tim Cheese", "🧀", "common", 500, 5),
    br("fluriflura", "Fluriflura", "🌸", "common", 750, 7),
    br("talpa_di_fero", "Talpa Di Fero", "🦡", "common", 1000, 9),
    br("svinina_bombardino", "Svinina Bombardino", "🐷", "common", 1200, 10),
    br("raccooni_jandelini", "Raccooni Jandelini", "🦝", "common", 1400, 12),
    br("pipi_kiwi", "Pipi Kiwi", "🥝", "common", 1500, 13),
    br("pipi_corni", "Pipi Corni", "🌽", "common", 1700, 14),
    br("tartaragno", "Tartaragno", "🐢", "common", 1800, 13),
    // Rare
    br("trippi_troppi", "Trippi Troppi", "🐟", "rare", 2000, 15),
    br("tung_tung_sahur", "Tung Tung Tung Sahur", "🥁", "rare", 3000, 25),
    br("gangster_footera", "Gangster Footera", "👟", "rare", 4000, 30),
    br("bandito_bobritto", "Bandito Bobritto", "🎸", "rare", 5000, 35),
    br("boneca_ambalabu", "Boneca Ambalabu", "🪆", "rare", 6500, 40),
    br("cacto_hipopotamo", "Cacto Hipopotamo", "🌵", "rare", 8000, 50),
    br("ta_ta_ta_sahur", "Ta Ta Ta Ta Sahur", "🎵", "rare", 9000, 55),
    br("tric_trac_baraboom", "Tric Trac Baraboom", "💥", "rare", 9500, 65),
    br("pipi_avocado", "Pipi Avocado", "🥑", "rare", 10000, 70),
    br("cupcake_koala", "Cupcake Koala", "🧁", "rare", 11000, 60),
    br("pinealotto", "Pinealotto Fruttarino", "🍍", "rare", 12000, 75),
    // Epic
    br("cappuccino_assassino", "Cappuccino Assassino", "☕", "epic", 10000, 75),
    br("brr_brr_patapim", "Brr Brr Patapim", "❄️", "epic", 12500, 100),
    br("trulimero", "Trulimero Trulicina", "🎪", "epic", 15000, 125),
    br("bambini_crostini", "Bambini Crostini", "🥖", "epic", 18000, 130),
    br("bananita_dolphinita", "Bananita Dolphinita", "🐬", "epic", 20000, 150),
    br("perochello", "Perochello Lemonchello", "🍋", "epic", 22000, 160),
    br("brri_brri", "Brri Brri Bicus Dicus Bombicus", "🎺", "epic", 25000, 175),
    br("avocadini_guffo", "Avocadini Guffo", "🦉", "epic", 28000, 225),
    br("salamino_penguino", "Salamino Penguino", "🐧", "epic", 30000, 250),
    br("ti_ti_ti_sahur", "Ti Ti Ti Sahur", "🎶", "epic", 32000, 225),
    br("avocadini_antilopini", "Avocadini Antilopini", "🦌", "epic", 35000, 115),
    br("wombo_rollo", "Wombo Rollo", "🌀", "epic", 38000, 275),
    // Legendary
    br("sigma_boy", "Sigma Boy", "🗿", "legendary", 50000, 1300),
    br("chimpazini", "Chimpazini Bananini", "🐒", "legendary", 75000, 900),
    br("burbaloni", "Burbaloni Loliloli", "🫧", "legendary", 35000, 200),
    br("glorbo", "Glorbo Fruttodrillo", "🍉", "legendary", 100000, 750),
    br("pandaccini", "Pandaccini Bananini", "🐼", "legendary", 85000, 1200),
    br("strawberelli", "Strawberelli Flamingelli", "🦩", "legendary", 95000, 1100),
    br("sigma_girl", "Sigma Girl", "👸", "legendary", 120000, 1800),
    br("lionel_cactusoli", "Lionel Cactusoli", "🌵", "legendary", 90000, 950),
    // Mythic
    br("frigo_camelo", "Frigo Camelo", "🐫", "mythic", 300000, 1400),
    br("orangutini", "Orangutini Ananassini", "🦧", "mythic", 400000, 1700),
    br("bombardiro", "Bombardiro Crocodilo", "🐊", "mythic", 450000, 2100),
    br("rhino_toasterino", "Rhino Toasterino", "🦏", "mythic", 500000, 2500),
    br("te_te_te_sahur", "Te Te Te Sahur", "🎤", "mythic", 550000, 3000),
    br("cocofanto", "Cocofanto Elefanto", "🐘", "mythic", 600000, 3500),
    // Brainrot God
    br("odin_din", "Odin Din Din Dun", "⚡", "god", 5000000, 75000),
    br("trippi_troppa", "Trippi Troppi Troppa Trippa", "🐙", "god", 8000000, 120000),
    br("girafa_celestre", "Girafa Celestre", "🦒", "god", 12000000, 200000),
    br("tralalero", "Tralalero Tralala", "🦈", "god", 20000000, 350000),
    br("pakrahmatmamat", "Pakrahmatmamat", "👹", "god", 35000000, 500000),
    // Secret
    br("la_vacca", "La Vacca Staturno Saturnita", "🐄", "secret", 100000000, 1500000),
    br("job_job_job", "Job Job Job Sahur", "💼", "secret", 150000000, 2000000),
    br("nuclearo", "Nuclearo Dinossauro", "☢️", "secret", 200000000, 2500000),
    br("blackhole_goat", "Blackhole Goat", "🐐", "secret", 250000000, 3000000),
    br("fragola_lala", "Fragola la la la", "🍓", "secret", 300000000, 3500000),
    // OG
    br("strawberry_elephant", "Strawberry Elephant", "🐘", "og", 500000000000, 300000000),
    br("meowl", "Meowl", "🐱", "og", 350000000000, 275000000),
    br("skibidi_toilet", "Skibidi Toilet", "🚽", "og", 400000000000, 280000000),
    br("headless_horseman", "Headless Horseman", "🎃", "og", 450000000000, 290000000),
    br("john_pork", "John Pork", "🐷", "og", 500000000000, 310000000),
  ];

  const BY_RARITY = {};
  LIST.forEach((b) => {
    if (!BY_RARITY[b.rarity]) BY_RARITY[b.rarity] = [];
    BY_RARITY[b.rarity].push(b);
  });

  window.StealBrainrotCatalog = {
    RARITY,
    LIST,
    BY_RARITY,
    pickFromRarity(rarity) {
      const pool = BY_RARITY[rarity];
      if (!pool?.length) return LIST[0];
      return pool[Math.floor(Math.random() * pool.length)];
    },
  };
})();
