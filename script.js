// ============================================================
// CHANDAN GAME - DESTROY THE BLOCKS
// Compatible with your current index.html
// Mobile optimized
// ============================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", {
    alpha: false,
    desynchronized: true
});

const livesEl = document.getElementById("lives");
const scoreEl = document.getElementById("score");

const restartBtn = document.getElementById("restartBtn");

const gameMessage = document.getElementById("gameMessage");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const playAgainBtn = document.getElementById("playAgain");

// ============================================================
// CANVAS
// ============================================================

const W = 900;
const H = 600;

canvas.width = W;
canvas.height = H;

// ============================================================
// GAME SETTINGS
// ============================================================

const MAX_LEVEL = 5;

let score = 0;
let lives = 3;
let level = 1;

let gameRunning = true;
let gamePaused = false;
let gameOver = false;
let changingLevel = false;

// ============================================================
// BALL
// ============================================================

const ball = {
    x: W / 2,
    y: H - 100,

    radius: 9,

    vx: 260,
    vy: -260
};

// ============================================================
// PADDLE / STICK
// ============================================================

const paddle = {
    x: W / 2 - 70,

    y: H - 40,

    width: 140,

    height: 15,

    speed: 650
};

// ============================================================
// BLOCK SETTINGS
// ============================================================

const columns = 10;

const blockWidth = 75;
const blockHeight = 25;

const blockGap = 10;

const blockStartX = 25;
const blockStartY = 45;

let blocks = [];

// ============================================================
// CONTROLS
// ============================================================

let leftPressed = false;
let rightPressed = false;

// ============================================================
// PERFORMANCE
// ============================================================

let lastTime = 0;

// ============================================================
// INITIAL MESSAGE HIDDEN
// ============================================================

gameMessage.style.display = "none";

// ============================================================
// CREATE LEVEL
// ============================================================

function createBlocks() {

    blocks = [];

    // More rows as level increases
    const rows = Math.min(4 + level, 8);

    for (let row = 0; row < rows; row++) {

        for (let col = 0; col < columns; col++) {

            let health = 1;

            // Higher levels have stronger blocks
            if (level >= 3 && row % 3 === 0) {
                health = 2;
            }

            if (level >= 5 && row % 2 === 0) {
                health = 3;
            }

            blocks.push({

                x:
                    blockStartX +
                    col * (blockWidth + blockGap),

                y:
                    blockStartY +
                    row * (blockHeight + blockGap),

                width: blockWidth,

                height: blockHeight,

                health: health,

                maxHealth: health,

                alive: true
            });
        }
    }
}

// ============================================================
// LEVEL SPEED
// ============================================================

function getSpeed() {

    // Level 1 = 260
    // Level 2 = 310
    // Level 3 = 360
    // Level 4 = 410
    // Level 5 = 460

    return 260 + (level - 1) * 50;
}

// ============================================================
// RESET BALL
// ============================================================

function resetBall() {

    const speed = getSpeed();

    ball.x = W / 2;

    ball.y = H - 100;

    // Random left/right direction

    ball.vx =
        Math.random() > 0.5
            ? speed
            : -speed;

    ball.vy = -speed;

    paddle.x =
        W / 2 -
        paddle.width / 2;
}

// ============================================================
// UPDATE HUD
// ============================================================

function updateHUD() {

    livesEl.textContent = lives;

    scoreEl.textContent = score;
}

// ============================================================
// START GAME
// ============================================================

function startGame() {

    score = 0;

    lives = 3;

    level = 1;

    gameRunning = true;

    gamePaused = false;

    gameOver = false;

    changingLevel = false;

    leftPressed = false;

    rightPressed = false;

    hideMessage();

    createBlocks();

    resetBall();

    updateHUD();
}

// ============================================================
// GAME OVER
// ============================================================

function gameOverScreen() {

    gameRunning = false;

    gamePaused = false;

    gameOver = true;

    changingLevel = false;

    // IMPORTANT:
    // Stop keyboard / touch movement

    leftPressed = false;
    rightPressed = false;

    messageTitle.textContent = "💀 GAME OVER";

    messageText.textContent =
        "You used all 3 tries! Score: " + score;

    gameMessage.style.display = "flex";
}

// ============================================================
// LEVEL COMPLETE
// ============================================================

function levelComplete() {

    if (changingLevel || gameOver) {
        return;
    }

    changingLevel = true;

    gameRunning = false;

    leftPressed = false;

    rightPressed = false;

    // Last level completed

    if (level >= MAX_LEVEL) {

        messageTitle.textContent =
            "🏆 YOU WIN!";

        messageText.textContent =
            "Amazing! You completed all 5 levels! Score: " +
            score;

        gameMessage.style.display = "flex";

        gameOver = true;

        return;
    }

    // Next level

    level++;

    messageTitle.textContent =
        "⚡ LEVEL " + level;

    messageText.textContent =
        "Level complete! Get ready for faster speed.";

    gameMessage.style.display = "flex";

    createBlocks();

    resetBall();

    updateHUD();

    // Automatically continue

    setTimeout(() => {

        if (gameOver) {
            return;
        }

        hideMessage();

        changingLevel = false;

        gameRunning = true;

    }, 1200);
}

// ============================================================
// HIDE MESSAGE
// ============================================================

function hideMessage() {

    gameMessage.style.display = "none";
}

// ============================================================
// LOSE LIFE
// ============================================================

function loseLife() {

    lives--;

    updateHUD();

    leftPressed = false;

    rightPressed = false;

    if (lives <= 0) {

        gameOverScreen();

        return;
    }

    // Pause shortly before restarting ball

    gameRunning = false;

    resetBall();

    setTimeout(() => {

        if (!gameOver) {

            gameRunning = true;
        }

    }, 500);
}

// ============================================================
// PADDLE MOVEMENT
// ============================================================

function movePaddle(delta) {

    // VERY IMPORTANT:
    // Paddle cannot move after Game Over

    if (
        !gameRunning ||
        gamePaused ||
        gameOver
    ) {
        return;
    }

    if (leftPressed) {

        paddle.x -=
            paddle.speed * delta;
    }

    if (rightPressed) {

        paddle.x +=
            paddle.speed * delta;
    }

    // Keep paddle inside canvas

    if (paddle.x < 0) {

        paddle.x = 0;
    }

    if (
        paddle.x +
            paddle.width >
        W
    ) {

        paddle.x =
            W - paddle.width;
    }
}

// ============================================================
// BALL UPDATE
// ============================================================

function updateBall(delta) {

    if (
        !gameRunning ||
        gamePaused ||
        gameOver
    ) {
        return;
    }

    const oldX = ball.x;
    const oldY = ball.y;

    ball.x += ball.vx * delta;

    ball.y += ball.vy * delta;

    // --------------------------------------------------------
    // LEFT WALL
    // --------------------------------------------------------

    if (
        ball.x - ball.radius <= 0
    ) {

        ball.x = ball.radius;

        ball.vx =
            Math.abs(ball.vx);
    }

    // --------------------------------------------------------
    // RIGHT WALL
    // --------------------------------------------------------

    if (
        ball.x + ball.radius >= W
    ) {

        ball.x =
            W - ball.radius;

        ball.vx =
            -Math.abs(ball.vx);
    }

    // --------------------------------------------------------
    // TOP WALL
    // --------------------------------------------------------

    if (
        ball.y - ball.radius <= 0
    ) {

        ball.y = ball.radius;

        ball.vy =
            Math.abs(ball.vy);
    }

    // --------------------------------------------------------
    // PADDLE COLLISION
    // --------------------------------------------------------

    if (
        ball.vy > 0 &&

        ball.x + ball.radius >
            paddle.x &&

        ball.x - ball.radius <
            paddle.x +
                paddle.width &&

        ball.y + ball.radius >=
            paddle.y &&

        ball.y - ball.radius <=
            paddle.y +
                paddle.height
    ) {

        // Calculate where ball hit paddle

        const hitPosition =
            (
                ball.x -
                (
                    paddle.x +
                    paddle.width / 2
                )
            ) /
            (paddle.width / 2);

        // Change horizontal angle

        ball.vx =
            hitPosition * 430;

        // Make sure ball doesn't become too vertical

        if (
            Math.abs(ball.vx) < 100
        ) {

            ball.vx =
                hitPosition < 0
                    ? -100
                    : 100;
        }

        // Bounce upward

        ball.vy =
            -Math.abs(ball.vy);

        // Prevent sticking

        ball.y =
            paddle.y -
            ball.radius -
            1;
    }

    // --------------------------------------------------------
    // BLOCK COLLISION
    // --------------------------------------------------------

    for (const block of blocks) {

        if (!block.alive) {
            continue;
        }

        const hit =
            ball.x + ball.radius >
                block.x &&

            ball.x - ball.radius <
                block.x +
                    block.width &&

            ball.y + ball.radius >
                block.y &&

            ball.y - ball.radius <
                block.y +
                    block.height;

        if (!hit) {
            continue;
        }

        // Damage block

        block.health--;

        // ----------------------------------------------------
        // BLOCK DESTROYED
        // 1 BLOCK = 10 POINTS
        // ----------------------------------------------------

        if (block.health <= 0) {

            block.alive = false;

            score += 10;

            updateHUD();
        }

        // ----------------------------------------------------
        // DETERMINE BOUNCE DIRECTION
        // ----------------------------------------------------

        const wasAbove =
            oldY + ball.radius <=
            block.y;

        const wasBelow =
            oldY - ball.radius >=
            block.y +
                block.height;

        if (
            wasAbove ||
            wasBelow
        ) {

            ball.vy *= -1;

        } else {

            ball.vx *= -1;
        }

        // Only hit one block per frame

        break;
    }

    // --------------------------------------------------------
    // CHECK LEVEL COMPLETE
    // --------------------------------------------------------

    const remaining =
        blocks.some(
            block =>
                block.alive
        );

    if (!remaining) {

        levelComplete();

        return;
    }

    // --------------------------------------------------------
    // BALL FALLS BELOW SCREEN
    // --------------------------------------------------------

    if (
        ball.y -
            ball.radius >
        H
    ) {

        loseLife();
    }
}

// ============================================================
// BLOCK COLOR
// ============================================================

function getBlockColor() {

    if (level === 1) {
        return "#ef4444";
    }

    if (level === 2) {
        return "#a855f7";
    }

    if (level === 3) {
        return "#22c55e";
    }

    if (level === 4) {
        return "#f97316";
    }

    return "#eab308";
}

// ============================================================
// DRAW BACKGROUND
// ============================================================

function drawBackground() {

    // Simple background for mobile performance

    ctx.fillStyle = "#020711";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );
}

// ============================================================
// DRAW BALL
// ============================================================

function drawBall() {

    ctx.fillStyle = "#38bdf8";

    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        ball.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

// ============================================================
// DRAW PADDLE
// ============================================================

function drawPaddle() {

    ctx.fillStyle = "#facc15";

    roundRect(
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height,
        6
    );

    ctx.fill();
}

// ============================================================
// DRAW BLOCKS
// ============================================================

function drawBlocks() {

    const color =
        getBlockColor();

    for (const block of blocks) {

        if (!block.alive) {
            continue;
        }

        // Damaged blocks become darker

        if (
            block.health <
            block.maxHealth
        ) {

            ctx.globalAlpha = 0.45;

        } else {

            ctx.globalAlpha = 1;
        }

        ctx.fillStyle = color;

        roundRect(
            block.x,
            block.y,
            block.width,
            block.height,
            5
        );

        ctx.fill();

        // Show health for strong blocks

        if (
            block.maxHealth > 1
        ) {

            ctx.globalAlpha = 1;

            ctx.fillStyle = "#ffffff";

            ctx.font =
                "bold 12px Arial";

            ctx.textAlign = "center";

            ctx.textBaseline = "middle";

            ctx.fillText(
                block.health,
                block.x +
                    block.width / 2,
                block.y +
                    block.height / 2
            );
        }
    }

    ctx.globalAlpha = 1;
}

// ============================================================
// ROUNDED RECTANGLE
// ============================================================

function roundRect(
    x,
    y,
    width,
    height,
    radius
) {

    ctx.beginPath();

    ctx.moveTo(
        x + radius,
        y
    );

    ctx.lineTo(
        x + width - radius,
        y
    );

    ctx.quadraticCurveTo(
        x + width,
        y,
        x + width,
        y + radius
    );

    ctx.lineTo(
        x + width,
        y + height - radius
    );

    ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
    );

    ctx.lineTo(
        x + radius,
        y + height
    );

    ctx.quadraticCurveTo(
        x,
        y + height,
        x,
        y + height - radius
    );

    ctx.lineTo(
        x,
        y + radius
    );

    ctx.quadraticCurveTo(
        x,
        y,
        x + radius,
        y
    );

    ctx.closePath();
}

// ============================================================
// RENDER
// ============================================================

function render() {

    drawBackground();

    drawBlocks();

    drawPaddle();

    drawBall();
}

// ============================================================
// KEYBOARD
// ============================================================

document.addEventListener(
    "keydown",
    function (event) {

        // IMPORTANT:
        // Do nothing after Game Over

        if (gameOver) {
            return;
        }

        if (
            event.key ===
                "ArrowLeft" ||
            event.key === "a" ||
            event.key === "A"
        ) {

            event.preventDefault();

            if (gameRunning) {
                leftPressed = true;
            }
        }

        if (
            event.key ===
                "ArrowRight" ||
            event.key === "d" ||
            event.key === "D"
        ) {

            event.preventDefault();

            if (gameRunning) {
                rightPressed = true;
            }
        }
    }
);

// ============================================================
// KEYBOARD RELEASE
// ============================================================

document.addEventListener(
    "keyup",
    function (event) {

        if (
            event.key ===
                "ArrowLeft" ||
            event.key === "a" ||
            event.key === "A"
        ) {

            leftPressed = false;
        }

        if (
            event.key ===
                "ArrowRight" ||
            event.key === "d" ||
            event.key === "D"
        ) {

            rightPressed = false;
        }
    }
);

// ============================================================
// MOUSE CONTROL
// ============================================================

canvas.addEventListener(
    "mousemove",
    function (event) {

        // Cursor can move after Game Over,
        // but paddle must NOT move.

        if (
            !gameRunning ||
            gamePaused ||
            gameOver
        ) {
            return;
        }

        const rect =
            canvas.getBoundingClientRect();

        const scaleX =
            W / rect.width;

        const mouseX =
            (
                event.clientX -
                rect.left
            ) *
            scaleX;

        paddle.x =
            mouseX -
            paddle.width / 2;

        if (paddle.x < 0) {
            paddle.x = 0;
        }

        if (
            paddle.x +
                paddle.width >
            W
        ) {

            paddle.x =
                W -
                paddle.width;
        }
    }
);

// ============================================================
// TOUCH CONTROL
// ============================================================

canvas.addEventListener(
    "touchstart",
    function (event) {

        if (
            !gameRunning ||
            gamePaused ||
            gameOver
        ) {
            return;
        }

        event.preventDefault();

        movePaddleTouch(
            event.touches[0]
        );
    },
    {
        passive: false
    }
);

canvas.addEventListener(
    "touchmove",
    function (event) {

        if (
            !gameRunning ||
            gamePaused ||
            gameOver
        ) {
            return;
        }

        event.preventDefault();

        movePaddleTouch(
            event.touches[0]
        );
    },
    {
        passive: false
    }
);

// ============================================================
// TOUCH PADDLE MOVEMENT
// ============================================================

function movePaddleTouch(touch) {

    const rect =
        canvas.getBoundingClientRect();

    const scaleX =
        W / rect.width;

    const touchX =
        (
            touch.clientX -
            rect.left
        ) *
        scaleX;

    paddle.x =
        touchX -
        paddle.width / 2;

    if (paddle.x < 0) {
        paddle.x = 0;
    }

    if (
        paddle.x +
            paddle.width >
        W
    ) {

        paddle.x =
            W -
            paddle.width;
    }
}

// ============================================================
// RESTART BUTTON
// ============================================================

restartBtn.addEventListener(
    "click",
    function () {

        startGame();
    }
);

// ============================================================
// PLAY AGAIN BUTTON
// ============================================================

playAgainBtn.addEventListener(
    "click",
    function () {

        // Remove Game Over message immediately

        hideMessage();

        // Completely restart game

        startGame();
    }
);

// ============================================================
// GAME LOOP
// ============================================================

function gameLoop(timestamp) {

    if (!lastTime) {
        lastTime = timestamp;
    }

    let delta =
        (timestamp - lastTime) / 1000;

    lastTime = timestamp;

    // Prevent huge movement after tab switching

    if (delta > 0.033) {
        delta = 0.033;
    }

    movePaddle(delta);

    updateBall(delta);

    render();

    requestAnimationFrame(
        gameLoop
    );
}

// ============================================================
// START
// ============================================================

createBlocks();

resetBall();

updateHUD();

render();

requestAnimationFrame(
    gameLoop
);
