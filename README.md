# pro-games

Browser game hub with multiple mini-games, local multiplayer, and optional Stripe payments.

## Run locally

```bash
npm install
cp .env.example .env
# Add your Stripe test key to .env (optional for payments)
npm start
```

Open [http://localhost:8080](http://localhost:8080).

## GitHub Pages (solo play)

Live site: **https://qbxtreme.github.io/pro-games/**

Pages serves static files only. Games, local saves, and Pro Tokens in the browser work. Multiplayer, chat, cloud save sync, Stripe checkout, and “Make a game” submissions need `npm start` on a server.

## Environment

Copy `.env.example` to `.env`. Never commit `.env` — it is gitignored.
