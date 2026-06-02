// Shared in-game chat for Become a Pro hub and all games.
(function () {
  const NAME_KEY = "becomeAProChatName";
  const OFFLINE_KEY = "becomeAProChatOffline";
  const POLL_MS = 2500;
  const MAX_TEXT = 120;

  const BOT_NAMES = {
    hub: ["ProBot", "GameFan", "TokenKing"],
    "dragon-plains": ["DragonMaster", "GymLeader", "ShinyHunter"],
    "dragon-racers": ["SkyRider", "GemHunter", "Tailwind"],
    "snake-io": ["SlitherKing", "LongBoi", "CoilMaster"],
    "brawl-stars-mod": ["GemGrabber", "SuperMain", "BrawlKing"],
    "fat-simulator": ["ChonkyDog", "FatPup", "BurgerHound"],
  };

  const BOT_REPLIES = [
    "Let's go!", "GG!", "Nice!", "W chat", "So fun!", "Pro move!",
    "Lol", "No way!", "I'm winning!", "Good luck!",
  ];

  let room = "hub";
  let getNameFn = null;
  let open = false;
  let lastId = 0;
  let pollTimer = null;
  let offline = false;
  let unread = 0;
  let lastSend = 0;

  let root, panel, messagesEl, inputEl, toggleBtn, statusEl;

  function getPlayerName() {
    if (getNameFn) {
      const n = getNameFn();
      if (n && String(n).trim()) return String(n).trim().slice(0, 16);
    }
    try {
      return localStorage.getItem(NAME_KEY) || "Player";
    } catch (_) {
      return "Player";
    }
  }

  function savePlayerName(name) {
    try { localStorage.setItem(NAME_KEY, name.slice(0, 16)); } catch (_) {}
    window.BecomeAProSave?.queueCloudSave?.();
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadOfflineMessages() {
    try {
      const raw = localStorage.getItem(`${OFFLINE_KEY}:${room}`);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function saveOfflineMessages(msgs) {
    try {
      localStorage.setItem(`${OFFLINE_KEY}:${room}`, JSON.stringify(msgs.slice(-80)));
    } catch (_) {}
  }

  function appendMessage(msg, scroll) {
    if (msg.id <= lastId) return;
    lastId = msg.id;

    const div = document.createElement("div");
    const isYou = msg.name === getPlayerName();
    const isSystem = msg.system || msg.name === "System";
    div.className = "game-chat-msg"
      + (isSystem ? " system" : isYou ? " you" : msg.bot ? " bot" : "");
    if (isSystem) {
      div.textContent = msg.text;
    } else {
      div.innerHTML = `<span class="chat-name">${escapeHtml(msg.name)}:</span>${escapeHtml(msg.text)}`;
    }
    messagesEl.appendChild(div);
    if (scroll) messagesEl.scrollTop = messagesEl.scrollHeight;

    if (!open && !isYou && !isSystem) {
      unread++;
      toggleBtn.classList.add("has-unread");
    }
  }

  function renderOffline() {
    messagesEl.innerHTML = "";
    lastId = 0;
    loadOfflineMessages().forEach((m) => appendMessage(m, false));
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/chat?room=${encodeURIComponent(room)}&since=${lastId}`);
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      offline = false;
      statusEl.textContent = "Live chat";
      (data.messages || []).forEach((m) => appendMessage(m, true));
    } catch (_) {
      if (!offline) {
        offline = true;
        statusEl.textContent = "Offline — messages saved on this device";
        renderOffline();
      }
    }
  }

  function botReply(userText) {
    const bots = BOT_NAMES[room] || BOT_NAMES.hub;
    const name = bots[Math.floor(Math.random() * bots.length)];
    let text = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
    if (/hi|hello|hey/i.test(userText)) text = "Hey! 👋";
    if (/win|won|gg/i.test(userText)) text = "GG! 🏆";
    if (/help|how/i.test(userText)) text = "You got this!";
    return { id: Date.now(), name, text, bot: true, time: Date.now() };
  }

  async function sendMessage(text) {
    text = text.trim().slice(0, MAX_TEXT);
    if (!text) return;
    if (Date.now() - lastSend < 800) return;
    lastSend = Date.now();

    const name = getPlayerName();
    savePlayerName(name);
    inputEl.value = "";

    if (offline) {
      const msgs = loadOfflineMessages();
      const mine = { id: Date.now(), name, text, time: Date.now() };
      msgs.push(mine);
      appendMessage(mine, true);
      const reply = botReply(text);
      msgs.push(reply);
      appendMessage(reply, true);
      saveOfflineMessages(msgs);
      return;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room, name, text }),
      });
      if (!res.ok) throw new Error("send failed");
      const data = await res.json();
      if (data.message) appendMessage(data.message, true);
      await fetchMessages();
    } catch (_) {
      offline = true;
      statusEl.textContent = "Offline — messages saved on this device";
      await sendMessage(text);
    }
  }

  function setOpen(next) {
    open = next;
    panel.classList.toggle("hidden", !open);
    if (open) {
      unread = 0;
      toggleBtn.classList.remove("has-unread");
      inputEl.focus();
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function buildUI() {
    root = document.createElement("div");
    root.className = "game-chat-root";
    root.innerHTML = `
      <div class="game-chat-panel hidden" id="game-chat-panel">
        <div class="game-chat-header">
          <span id="game-chat-title">💬 Chat</span>
          <button type="button" class="game-chat-close" id="game-chat-close" aria-label="Close chat">✕</button>
        </div>
        <div class="game-chat-messages" id="game-chat-messages"></div>
        <p class="game-chat-status" id="game-chat-status">Connecting...</p>
        <form class="game-chat-form" id="game-chat-form">
          <input class="game-chat-input" id="game-chat-input" type="text" maxlength="120" placeholder="Say something..." autocomplete="off">
          <button class="game-chat-send" type="submit">Send</button>
        </form>
      </div>
      <button type="button" class="game-chat-toggle" id="game-chat-toggle" title="Chat">💬</button>
    `;
    document.body.appendChild(root);

    panel = document.getElementById("game-chat-panel");
    messagesEl = document.getElementById("game-chat-messages");
    inputEl = document.getElementById("game-chat-input");
    toggleBtn = document.getElementById("game-chat-toggle");
    statusEl = document.getElementById("game-chat-status");

    const titles = {
      hub: "💬 Hub Chat",
      "dragon-plains": "💬 Dragon Chat",
      "dragon-racers": "💬 Racer Chat",
      "snake-io": "💬 Snake Chat",
      "brawl-stars-mod": "💬 Brawl Chat",
      "fat-simulator": "💬 Coco Chat",
    };
    document.getElementById("game-chat-title").textContent = titles[room] || "💬 Chat";

    toggleBtn.addEventListener("click", () => setOpen(!open));
    document.getElementById("game-chat-close").addEventListener("click", () => setOpen(false));
    document.getElementById("game-chat-form").addEventListener("submit", (e) => {
      e.preventDefault();
      sendMessage(inputEl.value);
    });
  }

  function startPolling() {
    fetchMessages();
    pollTimer = setInterval(fetchMessages, POLL_MS);
  }

  window.GameChat = {
    init(opts = {}) {
      room = opts.room || "hub";
      getNameFn = opts.getName || null;
      if (root) return;
      buildUI();
      startPolling();
    },
    setGetName(fn) {
      getNameFn = fn;
    },
    open() {
      setOpen(true);
    },
  };
})();
