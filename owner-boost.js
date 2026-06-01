// Owner-only Pro boosts (Casey) — other players keep normal levels.
(function () {
  "use strict";

  const KEY = "becomeAProOwnerBoostV1";
  const OWNER_NAMES = ["casey"];
  const NO_PERSIST_NAMES = ["tony", "tonychen"];

  function normalizeName(name) {
    return String(name || "").trim().toLowerCase();
  }

  function nameIsOwner(name) {
    return OWNER_NAMES.includes(normalizeName(name));
  }

  function nameIsNoPersist(name) {
    return NO_PERSIST_NAMES.includes(normalizeName(name));
  }

  function storedNicknames() {
    try {
      return [
        localStorage.getItem("becomeAProChatName"),
        localStorage.getItem("becomeAProMakeGameName"),
      ];
    } catch (_) {
      return [];
    }
  }

  /** True for players who should not keep saved game progress (e.g. Tony). */
  function shouldSkipSave(trainerName) {
    const names = [trainerName].concat(storedNicknames());
    return names.some(nameIsNoPersist);
  }

  function markOwner() {
    try {
      localStorage.setItem(KEY, "1");
    } catch (_) {}
  }

  function fromStoredNames() {
    try {
      const names = storedNicknames();
      if (names.some(nameIsOwner)) {
        markOwner();
        return true;
      }
    } catch (_) {}
    return false;
  }

  function fromDragonSave() {
    try {
      const raw = localStorage.getItem("dragonForestSave");
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (nameIsOwner(data.trainerName)) {
        markOwner();
        return true;
      }
    } catch (_) {}
    return false;
  }

  function isActive(trainerName) {
    try {
      if (localStorage.getItem(KEY) === "1") return true;
    } catch (_) {}
    if (nameIsOwner(trainerName)) {
      markOwner();
      return true;
    }
    if (fromDragonSave()) return true;
    return fromStoredNames();
  }

  window.BecomeAProOwner = {
    isActive,
    markOwner,
    shouldSkipSave,
    KEY,
  };
})();
