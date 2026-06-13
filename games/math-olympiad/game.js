const SAVE_KEY = "mathOlympiadBest";
const TOTAL_QUESTIONS = 50;
const QUESTIONS_PER_SET = 10;
const SCORE_GAIN = 2;
const SCORE_PENALTY = 2;

const SET_NAMES = ["Easy", "Medium", "Hard", "Very Hard", "Insane"];
const NICE_MESSAGES = ["Nice!", "Great job!", "Gold star!", "You got it!", "Awesome!"];

let round = 1;
let score = 0;
let best = 0;
let current = null;
let locked = false;
let audioCtx = null;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tierForRound(r) {
  if (r <= 10) return 0;
  if (r <= 20) return 1;
  if (r <= 30) return 2;
  if (r <= 40) return 3;
  return 4;
}

function setIndexForRound(r) {
  return Math.min(Math.floor((r - 1) / QUESTIONS_PER_SET), SET_NAMES.length - 1);
}

function makeChoices(correct) {
  const choices = new Set([correct]);
  let spread = Math.max(6, Math.abs(correct) * 0.25 + 4);
  while (choices.size < 4) {
    const n = correct + randInt(-Math.ceil(spread), Math.ceil(spread));
    if (n !== correct) choices.add(n);
  }
  return shuffle([...choices]);
}

function genEasy() {
  const kind = randInt(0, 2);
  if (kind === 0) {
    const a = randInt(1, 12);
    const b = randInt(1, 12);
    return { text: `${a} + ${b} = ?`, answer: a + b };
  }
  if (kind === 1) {
    const hi = randInt(5, 20);
    const lo = randInt(1, hi - 1);
    return { text: `${hi} − ${lo} = ?`, answer: hi - lo };
  }
  const x = randInt(2, 5);
  const y = randInt(2, 5);
  return { text: `${x} × ${y} = ?`, answer: x * y };
}

function genMedium() {
  const kind = randInt(0, 3);
  if (kind === 0) {
    const a = randInt(10, 40);
    const b = randInt(10, 40);
    return { text: `${a} + ${b} = ?`, answer: a + b };
  }
  if (kind === 1) {
    const hi = randInt(20, 60);
    const lo = randInt(5, hi - 1);
    return { text: `${hi} − ${lo} = ?`, answer: hi - lo };
  }
  if (kind === 2) {
    const x = randInt(3, 12);
    const y = randInt(3, 12);
    return { text: `${x} × ${y} = ?`, answer: x * y };
  }
  const x = randInt(3, 12);
  const y = randInt(3, 12);
  const prod = x * y;
  return { text: `${prod} ÷ ${x} = ?`, answer: y };
}

function genHard() {
  const pick = randInt(0, 3);
  if (pick === 0) {
    const a = randInt(2, 9);
    const b = randInt(2, 9);
    const c = randInt(2, 6);
    const forms = [
      { text: `${a} + ${b} × ${c} = ?`, answer: a + b * c },
      { text: `(${a} + ${b}) × ${c} = ?`, answer: (a + b) * c },
    ];
    return forms[randInt(0, forms.length - 1)];
  }
  if (pick === 1) return genAlgebra(2, 12);
  if (pick === 2) return genSequence(2, 6);
  const x = randInt(4, 15);
  const y = randInt(4, 12);
  return { text: `${x} × ${y} = ?`, answer: x * y };
}

function genVeryHard() {
  const pick = randInt(0, 4);
  if (pick === 0) return genAlgebra(5, 20);
  if (pick === 1) return genSequence(3, 9);
  if (pick === 2) return genCompare();
  if (pick === 3) return genFraction();
  return genNegative(false);
}

function genInsane() {
  const gens = [genCompare, genFraction, () => genNegative(true), genOrderOpsHard, genAlgebraHard, genSequenceHard];
  return gens[randInt(0, gens.length - 1)]();
}

function genAlgebra(minX, maxX) {
  const x = randInt(minX, maxX);
  const a = randInt(2, 9);
  const kind = randInt(0, 2);
  if (kind === 0) {
    const b = x + a;
    return { text: `Find x: x + ${a} = ${b}`, answer: x };
  }
  if (kind === 1) {
    const b = x * a;
    return { text: `Find x: ${a}x = ${b}`, answer: x };
  }
  const b = x - a;
  return { text: `Find x: x − ${a} = ${b}`, answer: x };
}

function genAlgebraHard() {
  const x = randInt(3, 18);
  const a = randInt(2, 7);
  const b = randInt(2, 9);
  const c = a * x + b;
  return { text: `Find x: ${a}x + ${b} = ${c}`, answer: x };
}

function genSequence(minStep, maxStep) {
  const start = randInt(1, 10);
  const step = randInt(minStep, maxStep);
  const seq = [start, start + step, start + 2 * step, start + 3 * step];
  return {
    text: `Next number: ${seq.join(", ")}, ?`,
    answer: start + 4 * step,
  };
}

function genSequenceHard() {
  const start = randInt(2, 8);
  const mult = randInt(2, 3);
  const seq = [start, start * mult, start * mult * mult, start * mult * mult * mult];
  return {
    text: `Next number: ${seq.join(", ")}, ?`,
    answer: start * mult ** 4,
  };
}

function genCompare() {
  const a = randInt(3, 15);
  const b = randInt(3, 15);
  const c = randInt(3, 12);
  const d = randInt(3, 12);
  const left = a * b;
  const right = c * d;
  if (left === right) return genCompare();
  return {
    text: `Which is bigger? ${a}×${b}  or  ${c}×${d}`,
    answer: left > right ? left : right,
    labels: [`${left}`, `${right}`],
  };
}

function genFraction() {
  const forms = [
    () => {
      const n = randInt(1, 4);
      return { text: `${n}/${n} + 1/${n} = ? (as a whole number)`, answer: 2 };
    },
    () => {
      const n = randInt(2, 6);
      const m = randInt(1, n - 1);
      return { text: `${m}/${n} + ${n - m}/${n} = ?`, answer: 1 };
    },
    () => {
      const a = randInt(1, 3);
      const b = randInt(1, 3);
      return { text: `${a}/${4} + ${b}/${4} = ? (numerator only, over 4)`, answer: a + b };
    },
    () => {
      const x = randInt(2, 5);
      return { text: `${x} × 1/${x} = ?`, answer: 1 };
    },
  ];
  return forms[randInt(0, forms.length - 1)]();
}

function genNegative(hard) {
  if (!hard) {
    const a = randInt(1, 9);
    const b = randInt(a + 1, 15);
    return { text: `${a} − ${b} = ?`, answer: a - b };
  }
  const forms = [
    () => {
      const a = randInt(-9, -1);
      const b = randInt(3, 12);
      return { text: `${a} + ${b} = ?`, answer: a + b };
    },
    () => {
      const a = randInt(-8, 8);
      const b = randInt(-8, 8);
      if (a - b === a) return genNegative(true);
      return { text: `${a} − ${b} = ?`, answer: a - b };
    },
    () => {
      const a = randInt(2, 6);
      const b = randInt(2, 6);
      return { text: `−${a} × ${b} = ?`, answer: -a * b };
    },
  ];
  return forms[randInt(0, forms.length - 1)]();
}

function genOrderOpsHard() {
  const a = randInt(2, 12);
  const b = randInt(2, 9);
  const c = randInt(2, 8);
  const d = randInt(2, 6);
  const forms = [
    { text: `${a} + ${b} × ${c} − ${d} = ?`, answer: a + b * c - d },
    { text: `(${a} + ${b}) × ${c} − ${d} = ?`, answer: (a + b) * c - d },
    { text: `${a * c} − ${b} × ${c} + ${d} = ?`, answer: a * c - b * c + d },
  ];
  return forms[randInt(0, forms.length - 1)];
}

function generateProblem(r) {
  const tier = tierForRound(r);
  let problem;
  if (tier === 0) problem = genEasy();
  else if (tier === 1) problem = genMedium();
  else if (tier === 2) problem = genHard();
  else if (tier === 3) problem = genVeryHard();
  else problem = genInsane();

  const choices = problem.labels
    ? shuffle(problem.labels.map(Number))
    : makeChoices(problem.answer);

  return {
    text: problem.text,
    answer: problem.answer,
    choices,
    tier: tier + 1,
    setName: SET_NAMES[setIndexForRound(r)],
  };
}

function loadBest() {
  try {
    best = parseInt(localStorage.getItem(SAVE_KEY) || "0", 10) || 0;
  } catch (_) {
    best = 0;
  }
  updateBestDisplays();
}

function saveBest() {
  if (score <= best) return;
  best = score;
  try {
    localStorage.setItem(SAVE_KEY, String(best));
  } catch (_) {}
  updateBestDisplays();
}

function updateBestDisplays() {
  document.querySelectorAll("[data-best]").forEach((el) => {
    el.textContent = `${best}%`;
  });
}

function medalForScore(pct) {
  if (pct >= 95) return { emoji: "🥇", label: "Gold Medal!" };
  if (pct >= 80) return { emoji: "🥈", label: "Silver Medal!" };
  if (pct >= 60) return { emoji: "🥉", label: "Bronze Medal!" };
  return { emoji: "🏅", label: "Good try — keep training!" };
}

function updateHud() {
  document.getElementById("mo-score").textContent = `Score ${score}%`;
  document.getElementById("mo-round").textContent = `Question ${round} / ${TOTAL_QUESTIONS}`;
  const setEl = document.getElementById("mo-set");
  if (setEl) {
    setEl.textContent = current ? `${current.setName} Round` : SET_NAMES[0];
  }
}

function showScreen(id) {
  document.querySelectorAll(".mo-screen").forEach((el) => {
    el.classList.toggle("hidden", el.id !== id);
  });
}

function playNiceSound() {
  window.GameSFX?.play("correct");
}

function nextQuestion() {
  if (round > TOTAL_QUESTIONS) {
    endGame();
    return;
  }

  locked = false;
  current = generateProblem(round);
  document.getElementById("mo-question").textContent = current.text;
  document.getElementById("mo-feedback").textContent = "";
  document.getElementById("mo-feedback").className = "mo-feedback";

  const grid = document.getElementById("mo-choices");
  grid.innerHTML = "";
  current.choices.forEach((val) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mo-choice";
    btn.textContent = String(val);
    btn.addEventListener("click", () => handleAnswer(val));
    grid.appendChild(btn);
  });

  updateHud();
}

function showSetBreak(completedSetIndex) {
  const feedback = document.getElementById("mo-feedback");
  const completed = SET_NAMES[completedSetIndex];
  const next = SET_NAMES[completedSetIndex + 1] || "Finish line";
  feedback.textContent = `🏁 ${completed} round complete! Next: ${next}!`;
  feedback.className = "mo-feedback ok";
}

function handleAnswer(picked) {
  if (locked || !current) return;
  locked = true;

  const correct = current.answer;
  const ok = picked === correct;
  const feedback = document.getElementById("mo-feedback");
  const buttons = [...document.querySelectorAll(".mo-choice")];

  buttons.forEach((btn) => {
    btn.disabled = true;
    const val = Number(btn.textContent);
    if (val === correct) btn.classList.add("correct");
    else btn.classList.add("wrong");
  });

  const finishedSet = round % QUESTIONS_PER_SET === 0;
  const delay = ok ? 750 : 950;

  if (ok) {
    score = Math.min(100, score + SCORE_GAIN);
    playNiceSound();
    feedback.textContent = NICE_MESSAGES[randInt(0, NICE_MESSAGES.length - 1)];
    feedback.className = "mo-feedback ok";
    saveBest();
  } else {
    score = Math.max(0, score - SCORE_PENALTY);
    window.GameSFX?.play("wrong");
    feedback.textContent = `−${SCORE_PENALTY}% — answer was ${correct}`;
    feedback.className = "mo-feedback bad";
    updateHud();
  }

  round += 1;

  if (round > TOTAL_QUESTIONS) {
    setTimeout(endGame, delay);
    return;
  }

  if (finishedSet && round <= TOTAL_QUESTIONS) {
    setTimeout(() => {
      showSetBreak(setIndexForRound(round - 1));
      setTimeout(nextQuestion, 1200);
    }, delay);
  } else {
    setTimeout(nextQuestion, delay);
  }
}

function startGame() {
  round = 1;
  score = 0;
  window.GameSFX?.play("start");
  showScreen("mo-play");
  nextQuestion();
}

function endGame() {
  saveBest();
  window.GameSFX?.play(score >= 80 ? "win" : score >= 50 ? "level" : "coin");
  const medal = medalForScore(score);
  document.getElementById("mo-final-medal").textContent = medal.emoji;
  document.getElementById("mo-final-medal-label").textContent = medal.label;
  document.getElementById("mo-final-score").textContent = String(score);
  showScreen("mo-over");
}

function init() {
  loadBest();
  document.getElementById("mo-start-btn")?.addEventListener("click", startGame);
  document.getElementById("mo-retry-btn")?.addEventListener("click", startGame);
  document.getElementById("mo-menu-btn")?.addEventListener("click", () => {
    showScreen("mo-start");
  });
}

init();

window.__mathOlympiad3D = function () {
  const moPlay = document.getElementById("mo-play");
  if (!moPlay || moPlay.classList.contains("hidden")) return null;
  return {
    worldW: 2000,
    worldH: 2000,
    ground: "#1a237e",
    defaultModel: "dragon",
    player: { x: 1000, y: 1000, model: "dragon", color: "#ffd700" },
    entities: [
      { id: "trophy", x: 1200, y: 800, model: "mob", color: "#ffc107", scale: 1.2 },
      { id: "star", x: 800, y: 1200, model: "mob", color: "#42a5f5", scale: 0.9 },
    ],
  };
};
