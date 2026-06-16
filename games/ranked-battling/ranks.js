(function () {
  "use strict";

  const SAVE_VERSION = 3;
  const XP_STEP = 500;

  const RANKS = [
    "E",
    "D",
    "C",
    "B",
    "A",
    "S",
    "S-E",
    "S-D",
    "S-F",
    "S-C",
    "S-B",
    "S-A",
    "S-S",
    "S-S-E",
    "S-S-D",
    "S-S-F",
    "S-S-C",
    "S-S-B",
    "S-S-A",
    "S-S-S",
    "SSS-E",
    "SSS-D",
    "SSS-F",
    "SSS-C",
    "SSS-B",
    "SSS-A",
    "SSS-S",
    "SSSE",
    "SSSD",
    "SSSF",
    "SSSC",
    "SSSB",
    "SSSA",
    "SSSS",
    "SSSSE",
    "SSSSD",
    "SSSSF",
    "SSSSC",
    "SSSSB",
    "SSSSA",
    "SSSSS",
  ];

  const BASE_COLORS = [0x78909c, 0x8d6e63, 0x66bb6a, 0x42a5f5, 0xab47bc, 0xffc107];

  function lerpColor(a, b, t) {
    const ar = (a >> 16) & 255;
    const ag = (a >> 8) & 255;
    const ab = a & 255;
    const br = (b >> 16) & 255;
    const bg = (b >> 8) & 255;
    const bb = b & 255;
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return (r << 16) | (g << 8) | bl;
  }

  function rankColorIndex(rankIndex) {
    const i = Math.max(0, Math.min(rankIndex, RANKS.length - 1));
    if (i < 6) return BASE_COLORS[i];
    if (i < 13) return lerpColor(0xffc107, 0xff9800, (i - 6) / 6);
    if (i < 20) return lerpColor(0xff9800, 0xff7043, (i - 13) / 6);
    if (i < 27) return lerpColor(0xff7043, 0xff5722, (i - 20) / 6);
    if (i < 34) return lerpColor(0xff5722, 0xd500f9, (i - 27) / 6);
    return lerpColor(0xd500f9, 0xffffff, (i - 34) / 6);
  }

  function giantNames(rank) {
    return [`${rank}-Titan`, `${rank}-Warden`, `${rank}-Colossus`, `${rank}-Guardian`];
  }

  function clampRankIndex(rankIndex) {
    const i = Number(rankIndex);
    if (!Number.isFinite(i)) return 0;
    return Math.max(0, Math.min(Math.floor(i), RANKS.length - 1));
  }

  /** XP needed to reach the next rank; grows by 500 each rank (E→D: 500, D→C: 1000, …). */
  function xpToNextRank(rankIndex) {
    return XP_STEP * (clampRankIndex(rankIndex) + 1);
  }

  function migrateLegacySave(parsed) {
    let version = parsed.saveVersion ?? 1;
    let rankIndex = clampRankIndex(parsed.rankIndex);

    if (version >= SAVE_VERSION) {
      parsed.rankIndex = rankIndex;
      parsed.saveVersion = SAVE_VERSION;
      return parsed;
    }

    if (version < 2) {
      if (rankIndex > 7) {
        rankIndex = Math.min(rankIndex, RANKS.length - 1);
      } else if (rankIndex === 6) {
        rankIndex = 13;
      } else if (rankIndex === 7) {
        rankIndex = 19;
      }
      version = 2;
    }

    if (version < 3) {
      rankIndex = 0;
      parsed.xp = 0;
      version = 3;
    }

    parsed.rankIndex = rankIndex;
    parsed.saveVersion = SAVE_VERSION;
    return parsed;
  }

  window.RankedRanks = {
    RANKS,
    SAVE_VERSION,
    XP_STEP,
    MAX_INDEX: RANKS.length - 1,
    PEAK: RANKS[RANKS.length - 1],
    rankColorIndex,
    giantNames,
    clampRankIndex,
    xpToNextRank,
    migrateLegacySave,
  };
})();
