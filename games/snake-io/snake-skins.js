// Snake.io skin catalog — 106 unique snakes with names, colors, and descriptions.
(function () {
  "use strict";

  const STARTER_SKINS = [
    { name: "Sun Stripe", colors: ["#ffeb3b", "#f9a825"], desc: "A cheerful yellow snake that shines like sunlight on the blue arena." },
    { name: "Crimson Fang", colors: ["#f44336", "#c62828"], desc: "A fierce red serpent — classic slither style built for bold players." },
    { name: "Royal Violet", colors: ["#9c27b0", "#6a1b9a"], desc: "Purple scales with a regal look, perfect for ruling the leaderboard." },
    { name: "Golden Glow", colors: ["#fff59d", "#fbc02d"], desc: "Soft gold body that glides smoothly and stands out in crowded lobbies." },
    { name: "Ocean Wave", colors: ["#2196f3", "#1565c0"], desc: "Cool blue tones that blend with the arena — until you start growing." },
    { name: "Jungle Leaf", colors: ["#4caf50", "#2e7d32"], desc: "Fresh green scales inspired by forest vipers and leafy camouflage." },
  ];

  const PREFIXES = [
    "Neon", "Shadow", "Crystal", "Thunder", "Frost", "Blaze", "Cosmic", "Toxic",
    "Midnight", "Solar", "Lunar", "Storm", "Mystic", "Wild", "Ancient", "Turbo",
    "Pixel", "Chrome", "Velvet", "Sand", "Coral", "Jade", "Onyx", "Pearl",
    "Copper", "Silver", "Amber", "Ruby", "Sapphire", "Emerald", "Obsidian", "Ivory",
    "Plasma", "Vapor", "Glitch", "Hyper", "Ultra", "Mega", "Mini", "Giant",
  ];

  const TYPES = [
    "Viper", "Cobra", "Python", "Adder", "Mamba", "Rattler", "Boa", "Asp",
    "Noodle", "Serpent", "Coil", "Fang", "Scale", "Hiss", "Glide", "Dash",
    "Loop", "Worm", "Slither", "Vortex", "Comet", "Pulse", "Spark", "Drift",
  ];

  const DESC_BITS = [
    "Striped body built for fast turns and sharp boosts.",
    "High-contrast scales that stay visible at any zoom level.",
    "A fan-favorite look inspired by classic arcade snakes.",
    "Smooth two-tone pattern made for long unranked runs.",
    "Eye-catching colors that pop against the blue floor.",
    "Balanced palette — easy to track while you hunt orbs.",
    "Rare-inspired design with a unique head-to-tail fade.",
    "Made for players who love flashy, competitive style.",
    "Subtle shimmer effect when you boost across the map.",
    "Legendary community skin with a bold personality.",
  ];

  function hslPair(h, s, l) {
    return [`hsl(${h}, ${s}%, ${l}%)`, `hsl(${(h + 38) % 360}, ${Math.max(40, s - 8)}%, ${Math.max(18, l - 20)}%)`];
  }

  function buildExtraSkins(count) {
    const skins = [];
    const used = new Set(STARTER_SKINS.map((s) => s.name.toLowerCase()));

    for (let i = 0; i < count; i++) {
      let name;
      let tries = 0;
      do {
        const pre = PREFIXES[(i * 7 + tries) % PREFIXES.length];
        const typ = TYPES[(i * 11 + tries * 3) % TYPES.length];
        name = `${pre} ${typ}`;
        tries++;
      } while (used.has(name.toLowerCase()) && tries < 80);
      used.add(name.toLowerCase());

      const hue = Math.round((i * 137.508) % 360);
      const sat = 52 + (i % 38);
      const light = 42 + (i % 24);
      const desc = `${name} — ${DESC_BITS[i % DESC_BITS.length]} ${i % 3 === 0 ? "Great for ranked climbs." : i % 3 === 1 ? "Ideal for casual unranked fun." : "Collect them all!"}`;

      skins.push({ name, colors: hslPair(hue, sat, light), desc });
    }
    return skins;
  }

  const SNAKE_SKIN_OPTIONS = STARTER_SKINS.concat(buildExtraSkins(100));

  window.SNAKE_SKIN_OPTIONS = SNAKE_SKIN_OPTIONS;
})();
