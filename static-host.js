(function () {
  "use strict";
  var host = typeof location !== "undefined" ? location.hostname : "";
  window.PRO_GAMES = window.PRO_GAMES || {};
  window.PRO_GAMES.staticHost = /\.github\.io$/i.test(host);
})();
