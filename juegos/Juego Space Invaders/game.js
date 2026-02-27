(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  const KEY = { LEFT: 'ArrowLeft', RIGHT: 'ArrowRight', SHOOT: ' ' };
  const input = { left: false, right: false, shoot: false, canShoot: true };

  // Game state
  let isRunning = true;
  let isWin = false;
  let score = 0;

  // Player
  const player = {
    x: WIDTH / 2 - 16,
    y: HEIGHT - 60,
    width: 32,
    height: 16,
    speed: 4,
    color: '#7efeff'
  };

  // Bullets
  const bullets = []; // player bullets
  const enemyBullets = [];

  // Enemies grid
  const enemyRows = 5;
  const enemyCols = 8;
  const enemySpacingX = 48;
  const enemySpacingY = 38;
  const enemyOrigin = { x: 48, y: 80 };
  const enemies = [];
  let enemyDir = 1; // 1 right, -1 left
  let enemySpeed = 0.6; // base speed
  let enemyStepDown = 16;
  let enemyShootCooldown = 0;

  for (let r = 0; r < enemyRows; r++) {
    for (let c = 0; c < enemyCols; c++) {
      enemies.push({
        x: enemyOrigin.x + c * enemySpacingX,
        y: enemyOrigin.y + r * enemySpacingY,
        width: 28,
        height: 20,
        alive: true,
        color: `hsl(${180 + r * 18}, 90%, 60%)`
      });
    }
  }

  // Stars background
  const stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    r: Math.random() * 1.6 + 0.4,
    s: Math.random() * 0.6 + 0.2
  }));

  function drawPlayer() {
    ctx.fillStyle = player.color;
    // simple ship: body + cockpit
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillRect(player.x + player.width / 2 - 3, player.y - 6, 6, 6);
  }

  function drawEnemy(e) {
    ctx.fillStyle = e.color;
    // simple alien: head + legs
    ctx.fillRect(e.x, e.y, e.width, 14);
    ctx.fillRect(e.x + 3, e.y + 14, 6, 4);
    ctx.fillRect(e.x + e.width - 9, e.y + 14, 6, 4);
  }

  function drawBullet(b, color) {
    ctx.fillStyle = color;
    ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
  }

  function drawBackground() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#020614';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // stars
    ctx.fillStyle = '#8fb8ff';
    stars.forEach(star => {
      star.y += star.s;
      if (star.y > HEIGHT) { star.y = 0; star.x = Math.random() * WIDTH; }
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  function update(dt) {
    if (!isRunning) return;

    // player move
    if (input.left) player.x -= player.speed;
    if (input.right) player.x += player.speed;
    player.x = Math.max(8, Math.min(WIDTH - player.width - 8, player.x));

    // shooting
    if (input.shoot && input.canShoot) {
      bullets.push({ x: player.x + player.width / 2, y: player.y - 6, width: 4, height: 12, vy: -6 });
      input.canShoot = false;
      setTimeout(() => (input.canShoot = true), 180);
    }

    // bullets update
    bullets.forEach(b => b.y += b.vy);
    for (let i = bullets.length - 1; i >= 0; i--) {
      if (bullets[i].y < -20) bullets.splice(i, 1);
    }

    // enemy movement: find bounds
    let minX = Infinity, maxX = -Infinity;
    enemies.forEach(e => {
      if (!e.alive) return;
      minX = Math.min(minX, e.x);
      maxX = Math.max(maxX, e.x + e.width);
    });
    if (minX === Infinity) {
      // no enemies left => win
      isRunning = false; isWin = true;
      document.getElementById('restart').hidden = false;
      return;
    }

    const hitLeft = minX <= 10;
    const hitRight = maxX >= WIDTH - 10;
    if (hitLeft || hitRight) {
      enemyDir *= -1;
      enemies.forEach(e => { if (e.alive) e.y += enemyStepDown; });
      enemySpeed += 0.05;
    }
    enemies.forEach(e => { if (e.alive) e.x += enemySpeed * enemyDir; });

    // enemy shoot
    enemyShootCooldown -= dt;
    if (enemyShootCooldown <= 0) {
      const shooters = enemies.filter(e => e.alive);
      if (shooters.length) {
        const e = shooters[Math.floor(Math.random() * shooters.length)];
        enemyBullets.push({ x: e.x + e.width / 2, y: e.y + 16, width: 4, height: 12, vy: 3.2 });
      }
      enemyShootCooldown = Math.max(250, 1200 - score * 4);
    }

    enemyBullets.forEach(b => b.y += b.vy);
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      if (enemyBullets[i].y > HEIGHT + 20) enemyBullets.splice(i, 1);
    }

    // collisions: bullets vs enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (!e.alive) continue;
        if (rectsOverlap({ x: b.x - 2, y: b.y - 8, width: 4, height: 12 }, e)) {
          e.alive = false;
          bullets.splice(i, 1);
          score += 10;
          break;
        }
      }
    }

    // collisions: enemy bullets vs player
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const b = enemyBullets[i];
      if (rectsOverlap({ x: b.x - 2, y: b.y - 8, width: 4, height: 12 }, player)) {
        isRunning = false; isWin = false;
        document.getElementById('restart').hidden = false;
        break;
      }
    }

    // lose if enemies reached player line
    const lowestY = Math.max(...enemies.filter(e => e.alive).map(e => e.y + e.height));
    if (lowestY >= player.y - 10) {
      isRunning = false; isWin = false;
      document.getElementById('restart').hidden = false;
    }
  }

  function drawHud() {
    ctx.fillStyle = '#8fb8ff';
    ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Puntos: ${score}`, 12, 22);
  }

  function draw() {
    drawBackground();
    // enemies
    enemies.forEach(e => { if (e.alive) drawEnemy(e); });
    // player
    drawPlayer();
    // bullets
    bullets.forEach(b => drawBullet(b, '#7efeff'));
    enemyBullets.forEach(b => drawBullet(b, '#ff6b6b'));
    // hud
    drawHud();

    if (!isRunning) {
      ctx.fillStyle = isWin ? '#7efeff' : '#ff8fa3';
      ctx.font = 'bold 26px system-ui, -apple-system, Segoe UI, Roboto, Arial';
      ctx.textAlign = 'center';
      ctx.fillText(isWin ? '¡Victoria!' : 'Game Over', WIDTH / 2, HEIGHT / 2 - 12);
      ctx.font = '16px system-ui, -apple-system, Segoe UI, Roboto, Arial';
      ctx.fillText('Presiona Reiniciar', WIDTH / 2, HEIGHT / 2 + 12);
    }
  }

  // Loop
  let last = performance.now();
  function loop(now) {
    const dt = now - last; last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // Input
  window.addEventListener('keydown', (e) => {
    if (e.key === KEY.LEFT) input.left = true;
    if (e.key === KEY.RIGHT) input.right = true;
    if (e.key === KEY.SHOOT) input.shoot = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === KEY.LEFT) input.left = false;
    if (e.key === KEY.RIGHT) input.right = false;
    if (e.key === KEY.SHOOT) input.shoot = false;
  });

  // Restart
  document.getElementById('restart').addEventListener('click', () => {
    // reset state quickly by reloading page (simple and robust)
    location.reload();
  });

  requestAnimationFrame(loop);
})(); 