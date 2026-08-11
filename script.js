// ============================================================
// NEON BLOCK BREAKER - PROFESSIONAL EDITION
// ============================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;   // 900
const H = canvas.height;  // 600

const state = {
  score: 0,
  lives: 3,
  level: 1,
  running: false,
  paused: false,
  changingLevel: false,
  gameEnded: false,
  muted: false
};

const ball = {
  x: W / 2,
  y: H - 90,
  radius: 9,
  speedX: 4,
  speedY: -4
};

const paddle = {
  x: W / 2 - 65,
  y: H - 35,
  width: 130,
  height: 15,
  speed: 8
};

let leftPressed = false;
let rightPressed = false;
let blocks = [];

const LEVELS = 5;
const COLUMNS = 10;
const BLOCK_W = 75;
const BLOCK_H = 25;
const GAP = 10;
const OFFSET_X = 25;
const OFFSET_Y = 50;

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");
const bestEl = document.getElementById("bestScore");
const modal = document.getElementById("gameModal");
const pauseOverlay = document.getElementById("pauseOverlay");

let bestScore = Number(localStorage.getItem("neonBreakerBest") || 0);
bestEl.textContent = bestScore;

function updateHUD() {
  scoreEl.textContent = state.score;
  livesEl.textContent = state.lives;
  levelEl.textContent = state.level;
  bestEl.textContent = Math.max(bestScore, state.score);
}

function levelSpeed() {
  return Math.min(4 + state.level - 1, 8);
}

function rowsForLevel() {
  return Math.min(4 + state.level, 8);
}

function healthForBlock(row) {
  if (state.level >= 4 && row % 2 === 0) return 3;
  if (state.level >= 2) return 2;
  return 1;
}

function createBlocks() {
  blocks = [];
  const rows = rowsForLevel();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      const health = healthForBlock(row);

      blocks.push({
        x: OFFSET_X + col * (BLOCK_W + GAP),
        y: OFFSET_Y + row * (BLOCK_H + GAP),
        width: BLOCK_W,
        height: BLOCK_H,
        health,
        maxHealth: health,
        alive: true
      });
    }
  }
}

function resetBall() {
  const speed = levelSpeed();

  ball.x = W / 2;
  ball.y = H - 90;
  ball.speedX = Math.random() > 0.5 ? speed : -speed;
  ball.speedY = -speed;

  paddle.x = W / 2 - paddle.width / 2;
}

function clearControls() {
  leftPressed = false;
  rightPressed = false;
}

function startNewGame() {
  state.score = 0;
  state.lives = 3;
  state.level = 1;
  state.running = true;
  state.paused = false;
  state.changingLevel = false;
  state.gameEnded = false;

  clearControls();
  createBlocks();
  resetBall();
  closeModal();
  hidePause();
  updateHUD();
}

function endGame() {
  state.running = false;
  state.paused = false;
  state.gameEnded = true;
  clearControls();

  if (state.score > bestScore) {
    bestScore = state.score;
    localStorage.setItem("neonBreakerBest", String(bestScore));
  }

  updateHUD();
  showModal(
    "💀",
    "GAME OVER",
    "You used all 3 lives.",
    "RUN ENDED"
  );
}

function showWin() {
  state.running = false;
  state.paused = false;
  state.gameEnded = true;
  clearControls();

  if (state.score > bestScore) {
    bestScore = state.score;
    localStorage.setItem("neonBreakerBest", String(bestScore));
  }

  updateHUD();
  showModal(
    "🏆",
    "YOU WIN!",
    "Amazing! You cleared all five levels.",
    "RUN COMPLETE"
  );
}

function showModal(icon, title, text, eyebrow) {
  document.getElementById("modalIcon").textContent = icon;
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalText").textContent = text;
  document.getElementById("modalEyebrow").textContent = eyebrow;
  document.getElementById("finalScore").textContent = state.score;
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

function nextLevel() {
  state.changingLevel = true;
  state.running = false;
  clearControls();

  state.level++;

  if (state.level > LEVELS) {
    showWin();
    return;
  }

  createBlocks();
  resetBall();
  updateHUD();

  showModal(
    "⚡",
    `LEVEL ${state.level}`,
    "New blocks. Higher speed. Get ready.",
    "NEXT LEVEL"
  );

  setTimeout(() => {
    if (state.gameEnded) return;
    closeModal();
    state.changingLevel = false;
    state.running = true;
  }, 1500);
}

function loseLife() {
  state.lives--;
  clearControls();
  updateHUD();

  if (state.lives <= 0) {
    endGame();
    return;
  }

  resetBall();

  // Small life-loss pause
  state.running = false;
  setTimeout(() => {
    if (!state.gameEnded && !state.changingLevel) {
      state.running = true;
    }
  }, 550);
}

function movePaddle(dt = 1 / 60) {
  if (!state.running || state.paused || state.gameEnded) return;

  if (leftPressed) paddle.x -= paddle.speed * dt * 60;
  if (rightPressed) paddle.x += paddle.speed * dt * 60;

  clampPaddle();
}

function clampPaddle() {
  paddle.x = Math.max(0, Math.min(W - paddle.width, paddle.x));
}

function updateBall(dt = 1 / 60) {
  if (!state.running || state.paused || state.gameEnded) return;

  ball.x += ball.speedX * dt * 60;
  ball.y += ball.speedY * dt * 60;

  // Left / right walls
  if (ball.x - ball.radius <= 0) {
    ball.x = ball.radius;
    ball.speedX = Math.abs(ball.speedX);
  }

  if (ball.x + ball.radius >= W) {
    ball.x = W - ball.radius;
    ball.speedX = -Math.abs(ball.speedX);
  }

  // Top wall
  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.speedY = Math.abs(ball.speedY);
  }

  // Paddle collision
  if (
    ball.speedY > 0 &&
    ball.y + ball.radius >= paddle.y &&
    ball.y - ball.radius <= paddle.y + paddle.height &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width
  ) {
    const relative = (ball.x - paddle.x) / paddle.width;
    ball.speedX = (relative - 0.5) * 10;

    if (Math.abs(ball.speedX) < 2) {
      ball.speedX = ball.speedX < 0 ? -2 : 2;
    }

    ball.speedY = -Math.abs(ball.speedY);
    ball.y = paddle.y - ball.radius - 1;
  }

  // Ball below screen
  if (ball.y - ball.radius > H) {
    loseLife();
  }
}

function blockColor(block) {
  const colors = ["#ef4444", "#a855f7", "#22c55e", "#f97316", "#eab308"];
  return colors[Math.min(state.level - 1, colors.length - 1)];
}

function updateBlocks() {
  if (!state.running || state.paused || state.gameEnded) return;

  for (const block of blocks) {
    if (!block.alive) continue;

    const hit =
      ball.x + ball.radius > block.x &&
      ball.x - ball.radius < block.x + block.width &&
      ball.y + ball.radius > block.y &&
      ball.y - ball.radius < block.y + block.height;

    if (!hit) continue;

    // Avoid repeated collision while embedded
    if (ball.speedY < 0 && ball.y > block.y + block.height) continue;
    if (ball.speedY > 0 && ball.y < block.y) continue;

    block.health--;

    // EXACTLY 10 POINTS PER DESTROYED BLOCK
    if (block.health <= 0) {
      block.alive = false;
      state.score += 10;
      updateHUD();
    }

    ball.speedY *= -1;

    const remaining = blocks.some(b => b.alive);
    if (!remaining) nextLevel();

    break;
  }
}

function drawBackground() {
  ctx.fillStyle = "#020711";
  ctx.fillRect(0, 0, W, H);

  // subtle grid
  ctx.strokeStyle = "rgba(50,199,255,.035)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= W; x += 45) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  for (let y = 0; y <= H; y += 45) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawBall() {
  const gradient = ctx.createRadialGradient(
    ball.x - 3, ball.y - 3, 1,
    ball.x, ball.y, ball.radius + 10
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(.25, "#b9f1ff");
  gradient.addColorStop(1, "#32c7ff");

  ctx.save();
  ctx.shadowColor = "#32c7ff";
  ctx.shadowBlur = 20;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPaddle() {
  const gradient = ctx.createLinearGradient(
    paddle.x, paddle.y,
    paddle.x + paddle.width, paddle.y
  );
  gradient.addColorStop(0, "#f7c92b");
  gradient.addColorStop(.5, "#fff3a3");
  gradient.addColorStop(1, "#f7c92b");

  ctx.save();
  ctx.shadowColor = "#ffd43b";
  ctx.shadowBlur = 18;
  ctx.fillStyle = gradient;
  roundRect(
    paddle.x,
    paddle.y,
    paddle.width,
    paddle.height,
    8
  );
  ctx.fill();
  ctx.restore();
}

function drawBlocks() {
  for (const block of blocks) {
    if (!block.alive) continue;

    const color = blockColor(block);
    const alpha = block.health < block.maxHealth ? .48 : .95;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = color;
    ctx.shadowBlur = 9;
    ctx.fillStyle = color;

    roundRect(
      block.x,
      block.y,
      block.width,
      block.height,
      5
    );
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,.18)";
    ctx.stroke();

    if (block.maxHealth > 1) {
      ctx.fillStyle = "#fff";
      ctx.font = "700 12px Inter, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        String(block.health),
        block.x + block.width / 2,
        block.y + block.height / 2
      );
    }

    ctx.restore();
  }
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function render() {
  drawBackground();
  drawBlocks();
  drawPaddle();
  drawBall();
}

let lastFrameTime = 0;

function gameLoop(timestamp) {
  if (!lastFrameTime) lastFrameTime = timestamp;

  let dt = (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;

  // Prevent a huge jump after switching tabs/backgrounding the phone.
  dt = Math.min(dt, 0.033);

  movePaddle(dt);
  updateBall(dt);
  updateBlocks();
  render();

  requestAnimationFrame(gameLoop);
}

// ============================================================
// INPUTS
// ============================================================

document.addEventListener("keydown", (e) => {
  if (!state.running || state.paused || state.gameEnded) return;

  if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D", " "].includes(e.key)) {
    e.preventDefault();
  }

  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
    leftPressed = true;
  }

  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
    rightPressed = true;
  }

  if (e.key === " ") togglePause();
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") leftPressed = false;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") rightPressed = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (!state.running || state.paused || state.gameEnded) return;

  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (W / rect.width);

  paddle.x = x - paddle.width / 2;
  clampPaddle();
});

let touchActive = false;

canvas.addEventListener("touchstart", (e) => {
  if (!state.running || state.paused || state.gameEnded) return;
  touchActive = true;
  movePaddleToTouch(e.touches[0]);
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  if (!state.running || state.paused || state.gameEnded) return;
  e.preventDefault();
  movePaddleToTouch(e.touches[0]);
}, { passive: false });

canvas.addEventListener("touchend", () => {
  touchActive = false;
});

function movePaddleToTouch(touch) {
  const rect = canvas.getBoundingClientRect();
  const x = (touch.clientX - rect.left) * (W / rect.width);
  paddle.x = x - paddle.width / 2;
  clampPaddle();
}

// ============================================================
// PAUSE
// ============================================================

function togglePause() {
  if (state.gameEnded || state.changingLevel) return;

  if (!state.running && !state.paused) return;

  state.paused = !state.paused;

  if (state.paused) {
    state.running = false;
    clearControls();
    showPause();
  } else {
    state.running = true;
    hidePause();
  }
}

function showPause() {
  pauseOverlay.classList.remove("hidden");
  document.getElementById("pauseBtn").textContent = "▶ Resume";
}

function hidePause() {
  pauseOverlay.classList.add("hidden");
  document.getElementById("pauseBtn").textContent = "Ⅱ Pause";
}

// ============================================================
// NAVIGATION
// ============================================================

function route() {
  const hash = location.hash.replace("#", "") || "home";
  const page = hash === "leaderboard" ? "leaderboard" :
               hash === "how-to-play" ? "how" :
               hash === "play" ? "play" : "home";

  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(page === "how" ? "how-to-play" : page).classList.add("active");

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === page);
  });

  if (page === "leaderboard") renderLeaderboard();
}

window.addEventListener("hashchange", route);

// Start game when user enters Play
document.querySelectorAll('a[href="#play"]').forEach(a => {
  a.addEventListener("click", () => {
    setTimeout(() => {
      if (!state.running && !state.gameEnded) {
        state.running = true;
      }
    }, 0);
  });
});

// ============================================================
// BUTTONS
// ============================================================

document.getElementById("restartBtn").addEventListener("click", startNewGame);

document.getElementById("playAgainBtn").addEventListener("click", () => {
  // IMPORTANT: remove the Game Over / Win popup immediately
  closeModal();
  startNewGame();
  location.hash = "play";
});

document.getElementById("pauseBtn").addEventListener("click", togglePause);
document.getElementById("resumeBtn").addEventListener("click", togglePause);

document.getElementById("fullscreenBtn").addEventListener("click", async () => {
  const target = document.getElementById("gameWrap");

  try {
    if (!document.fullscreenElement) {
      await target.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (err) {
    console.warn("Fullscreen unavailable:", err);
  }
});

document.getElementById("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem(
    "neonBreakerTheme",
    document.body.classList.contains("light") ? "light" : "dark"
  );
});

document.getElementById("clearScoresBtn").addEventListener("click", () => {
  if (confirm("Clear all saved local records?")) {
    localStorage.removeItem("neonBreakerRecords");
    localStorage.removeItem("neonBreakerBest");
    bestScore = 0;
    updateHUD();
    renderLeaderboard();
  }
});

// ============================================================
// LEADERBOARD
// ============================================================

function getRecords() {
  const records = JSON.parse(localStorage.getItem("neonBreakerRecords") || "[]");
  return Array.isArray(records) ? records : [];
}

function saveRecord() {
  if (state.score <= 0) return;

  const records = getRecords();

  records.push({
    score: state.score,
    level: Math.min(state.level, LEVELS),
    date: new Date().toLocaleDateString()
  });

  records.sort((a, b) => b.score - a.score);

  localStorage.setItem(
    "neonBreakerRecords",
    JSON.stringify(records.slice(0, 10))
  );
}

function renderLeaderboard() {
  const container = document.getElementById("leaderboardRows");
  const records = getRecords();

  if (!records.length) {
    container.innerHTML = `
      <div class="leader-row">
        <span class="rank">—</span>
        <span class="name">No records yet</span>
        <span class="score">Play a run</span>
        <span class="lvl">—</span>
      </div>
    `;
    return;
  }

  container.innerHTML = records.map((record, index) => `
    <div class="leader-row">
      <span class="rank">#${index + 1}</span>
      <span class="name">Player • ${record.date}</span>
      <span class="score">${record.score}</span>
      <span class="lvl">L${record.level}</span>
    </div>
  `).join("");
}



// Save a finished run exactly once
const originalEndGame = endGame;
endGame = function() {
  if (!state.gameEnded) {
    saveRecord();
  }
  originalEndGame();
};

const originalShowWin = showWin;
showWin = function() {
  saveRecord();
  originalShowWin();
};

// ============================================================
// THEME
// ============================================================

if (localStorage.getItem("neonBreakerTheme") === "light") {
  document.body.classList.add("light");
}

// ============================================================
// INITIALIZE
// ============================================================

createBlocks();
resetBall();
updateHUD();
route();
render();
gameLoop();
