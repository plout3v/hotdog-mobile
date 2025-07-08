
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// === Obrázky a zvuky =====================================================
const playerImage = new Image();
playerImage.src = "hotdog-sad.png";

const bulletImage = new Image();
bulletImage.src = "parek.png";

const enemyImage = new Image();
enemyImage.src = "enemy.png";

const krutaImage = new Image();
krutaImage.src = "kruta.png";

const shootSound = new Audio("mortar.mp3");
const explosionSound = new Audio("explosion.mp3");

// === Herní konstanty & proměnné =========================================
const originalWidth = 120;
const originalHeight = 170;

const player = {
  x: 550,
  y: 550,
  width: originalWidth,
  height: originalHeight,
  velX: 0,
  velY: 0,
  speed: 2,
  jumpForce: -9,
  gravity: 0.2,
  grounded: false
};

const gravity = 0.2;
const floorY = canvas.height - 10;

const platforms = [
  { x: 200, y: 450, width: 100, height: 20 },
  { x: 130, y: 100, width: 100, height: 20 },
  { x: 400, y: 350, width: 100, height: 20 },
  { x: 520, y: 175, width: 100, height: 20 }
];

let enemy = {
  x: 100,
  y: 50,
  baseX: 150,
  baseY: 150,
  width: 75,
  height: 75,
  alive: true,
  angle: 0,
  radiusX: 100,
  radiusY: 70,
  speed: 0.03
};

const bullets = [];
const bulletSpeed = 1.5;
const bulletWidth = 55;
const bulletHeight = 45;
let lastDir = 1;
let ammo = 5;

let gameOver = false; // stav hry

// === Ovládání ============================================================
const keys = {};

document.addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") resetGame();
  if (gameOver) return;
  keys[e.key] = true;

  if (e.key === "ArrowLeft" || e.key === "a") lastDir = -1;
  if (e.key === "ArrowRight" || e.key === "d") lastDir = 1;

  if (e.key === "e" || e.key === "E") shootBullet();
});

document.addEventListener("keyup", (e) => {
  if (gameOver) return;
  keys[e.key] = false;
});

// === Logika hráče ========================================================
function updatePlayer() {
  if (keys["ArrowLeft"] || keys["a"]) {
    player.velX = -player.speed;
  } else if (keys["ArrowRight"] || keys["d"]) {
    player.velX = player.speed;
  } else {
    player.velX = 0;
  }

  if ((keys["ArrowUp"] || keys["w"]) && player.grounded) {
    player.velY = player.jumpForce;
    player.grounded = false;
  }

  player.velY += player.gravity;
  player.x += player.velX;
  player.y += player.velY;

  player.grounded = false;

  // Podlaha
  if (player.y + player.height >= floorY) {
    player.y = floorY - player.height;
    player.velY = 0;
    player.grounded = true;
  }

  // Platformy
  platforms.forEach(p => {
    const withinX = player.x + player.width > p.x && player.x < p.x + p.width;
    const isFalling = player.velY >= 0;
    const hittingTop = player.y + player.height <= p.y + player.velY &&
                       player.y + player.height + player.velY >= p.y;

    if (withinX && isFalling && hittingTop) {
      player.y = Math.round(p.y - player.height);
      player.velY = 0;
      player.grounded = true;
    }
  });
}

// === Střely ==============================================================
function shootBullet() {
  if (gameOver) return;
  if (ammo > 0) {
    bullets.push({
      x: player.x + (lastDir === 1 ? player.width : -bulletWidth),
      y: player.y + player.height / 2 - bulletHeight / 2,
      velX: bulletSpeed * lastDir
    });
    ammo--;

    shootSound.currentTime = 0;
    shootSound.play();
  }
}

function updateEnemy() {
  if (!enemy.alive) return;

  enemy.angle += enemy.speed;

  enemy.x = enemy.baseX + Math.cos(enemy.angle) * enemy.radiusX;
  enemy.y = enemy.baseY + Math.sin(enemy.angle) * enemy.radiusY;
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.velX;

    // Kolize střel s nepřítelem
    if (enemy.alive &&
        b.x < enemy.x + enemy.width &&
        b.x + bulletWidth > enemy.x &&
        b.y < enemy.y + enemy.height &&
        b.y + bulletHeight > enemy.y) {

      enemy.alive = false;
      bullets.splice(i, 1);

   // 🌟 Změna výrazu hráče
   playerImage.src = "hotdog-happy.png";
   player.speed = 2;
   player.jumpForce = -9;     // vyšší a svižnější skok
   player.gravity = 0.2;      // pomalejší pád = "šťastný" skok
   player.width = originalWidth;
   player.height = originalHeight;

   // 💥 Zahraj zvuk výbuchu
   explosionSound.currentTime = 0;
   explosionSound.play();

  continue;
    }

    // Mimo obrazovku
    if (b.x > canvas.width || b.x + bulletWidth < 0) {
      bullets.splice(i, 1);
    }
  }
}

// === Kolize hráče s nepřítelem (Game Over) ===============================
function checkPlayerEnemyCollision() {
  if (gameOver || !enemy.alive) return;

  const padding = 15;
  const playerLeft = player.x + padding;
  const playerRight = player.x + player.width - padding;
  const playerTop = player.y + padding;
  const playerBottom = player.y + player.height - padding;

  const enemyLeft = enemy.x + padding;
  const enemyRight = enemy.x + enemy.width - padding;
  const enemyTop = enemy.y + padding;
  const enemyBottom = enemy.y + enemy.height - padding;

  if (playerRight > enemyLeft &&
      playerLeft < enemyRight &&
      playerBottom > enemyTop &&
      playerTop < enemyBottom) {
    gameOver = true;
  }
}

// === Kreslící funkce =====================================================
function drawPlayer() {
  ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
}

function drawEnemy() {
  if (enemy.alive) {
    ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
  }
}

function drawBullets() {
  bullets.forEach(b => {
    ctx.drawImage(bulletImage, b.x, b.y, bulletWidth, bulletHeight);
  });
}

function drawGround() {
  ctx.fillStyle = "#555";
  ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);
}

function drawPlatforms() {
  ctx.fillStyle = "#888";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));
}

function drawUI() {
  const iconSize = 60;
  for (let i = 0; i < ammo; i++) {
    ctx.drawImage(bulletImage, 20 + i * (iconSize + 5), 20, iconSize, iconSize);
  }
}

function drawHUDText() {
  const text = "Gašpiho hra - zpárkovaný tábor";
  ctx.fillStyle = "#000";
  ctx.font = "20px sans-serif";
  ctx.textBaseline = "bottom";
  ctx.fillText(text, 20, canvas.height - 50);
}

function drawEndText() {
  if (!enemy.alive) {
    const text = "KONEC";
    ctx.fillStyle = "#b00";
    ctx.font = "30px sans-serif";
    ctx.textBaseline = "bottom";
    const textWidth = ctx.measureText(text).width;
    ctx.fillText(text, canvas.width - textWidth - 20, canvas.height - 10);
  }
}

// === Game Over obrazovka =================================================
function drawGameOver() {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Obrázek krůty
  if (krutaImage.complete && krutaImage.naturalWidth) {
    const imgW = canvas.width * 0.8;
    const imgH = canvas.height * 0.5;
    ctx.drawImage(krutaImage, (canvas.width - imgW)/2, canvas.height * 0.1, imgW, imgH);
  }

  ctx.fillStyle = "#b00";
  ctx.font = "32px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Konec hry - Tábor vyhrál", canvas.width / 2, canvas.height - 80);
}

// === Herní smyčka ========================================================
function gameLoop() {
  if (gameOver) {
    drawGameOver();
    requestAnimationFrame(gameLoop);
    return;
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  updatePlayer();
  updateEnemy();
  updateBullets();
  checkPlayerEnemyCollision();

  drawGround();
  drawPlatforms();
  drawBullets();
  drawPlayer();
  drawEnemy();
  drawUI();
  drawHUDText();
  drawEndText();

  requestAnimationFrame(gameLoop);
}

// Spuštění hry po načtení hráčova obrázku (kruta se může načíst později)
playerImage.onload = function() {
  gameLoop();
  // Zabránit opětovnému spouštění po resetu
  playerImage.onload = null;
};

// === Dotykové ovládání ===================================================
function simulateKey(key, isPressed) {
  if (gameOver) return;
  keys[key] = isPressed;
  if (key === "a" && isPressed) lastDir = -1;
  if (key === "d" && isPressed) lastDir = 1;
  if ((key === "e" || key === "E") && isPressed) shootBullet();
}

function setupTouchControls() {
  const btns = [
    { id: "leftBtn", key: "a" },
    { id: "rightBtn", key: "d" },
    { id: "jumpBtn", key: "w" },
    { id: "shootBtn", key: "e" },
  ];

  btns.forEach(({ id, key }) => {
    const btn = document.getElementById(id);
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      simulateKey(key, true);
    });
    ["touchend", "touchcancel"].forEach(evt => {
      btn.addEventListener(evt, (e) => {
        e.preventDefault();
        simulateKey(key, false);
      });
    });
  });
}

window.addEventListener("load", setupTouchControls);
);
}

// === Restart hry =========================================================
function resetGame() {
  // Reset hráče
  player.x = 550;
  player.y = 550;
  player.velX = 0;
  player.velY = 0;
  player.speed = 2;
  player.jumpForce = -9;
  player.gravity = 0.2;
  player.grounded = false;
  playerImage.src = "hotdog-sad.png";

  // Reset nepřítele
  enemy = {
    x: 100,
    y: 50,
    baseX: 150,
    baseY: 150,
    width: 75,
    height: 75,
    alive: true,
    angle: 0,
    radiusX: 100,
    radiusY: 70,
    speed: 0.03
  };

  // Reset střel
  bullets.length = 0;
  ammo = 5;

  // Reset stavu hry
  gameOver = false;

  // Skrytí tlačítka
}


window.addEventListener("load", () => {
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) {
    restartBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      resetGame();
    });
  }
});
