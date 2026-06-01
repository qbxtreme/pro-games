(function () {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game");
  const engine = window.AllOutEngine;

  if (gameId && engine?.localGamePath) {
    window.location.replace("/" + engine.localGamePath(gameId));
    return;
  }

  window.location.replace("/");
})();
