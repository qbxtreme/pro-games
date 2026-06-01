// Pro Token payments
// Option A (recommended): run `npm start` with STRIPE_SECRET_KEY in .env
//   Pay Now creates checkout from stripePriceId values in stripe-packs.json.
// Option B: run `npm run setup-payments` once to paste permanent links here.
// GitHub Pages: static-host.js sets PRO_GAMES.staticHost — API checkout is disabled.

window.BECOME_A_PRO_PAYMENTS = {
  useApi: !(window.PRO_GAMES && window.PRO_GAMES.staticHost),
  pack100: "",
  pack500: "",
  pack1200: "",
  pack3000: "",
};
