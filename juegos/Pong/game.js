const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W = 640, H = 400;
const PW = 10, PH = 60, BS = 8;

// Estado
let state = 'menu';
let score = { p1: 0, p2: 0 };
let p1 = { y: H/2 - PH/2 };
let p2 = { y: H/2 - PH/2 };
let ball = { x: W/2, y: H/2, dx: 4, dy: 3 };

// Sonidos 8-bit simples
const ac = new AudioContext();
function beep(freq, dur) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = 'square';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.1, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  o.start(); o.stop(ac.currentTime + dur);
}

// Teclado
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (state === 'menu') { state = 'play'; beep(440, 0.1); }
  if (e.key === 'p' || e.key === 'P') state = state === 'pause' ? 'play' : 'pause';
});
document.addEventListener('keyup', e => keys[e.key] = false);

// Loop principal
function loop() {
  // — Update —
  if (state === 'play') {
    if (keys['w'] || keys['W']) p1.y = Math.max(0, p1.y - 4);
    if (keys['s'] || keys['S']) p1.y = Math.min(H - PH, p1.y + 4);
    if (keys['ArrowUp'])   p2.y = Math.max(0, p2.y - 4);
    if (keys['ArrowDown']) p2.y = Math.min(H - PH, p2.y + 4);

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y <= 0 || ball.y >= H - BS) { ball.dy *= -1; beep(180, 0.06); }

    if (ball.x <= 30 + PW && ball.y + BS >= p1.y && ball.y <= p1.y + PH)
      { ball.dx = Math.abs(ball.dx) + 0.2; beep(220, 0.08); }

    if (ball.x + BS >= W - 30 - PW && ball.y + BS >= p2.y && ball.y <= p2.y + PH)
      { ball.dx = -(Math.abs(ball.dx) + 0.2); beep(220, 0.08); }

    if (ball.x < 0)  { score.p2++; beep(100, 0.3); reset(); }
    if (ball.x > W)  { score.p1++; beep(100, 0.3); reset(); }
  }

  // — Draw —
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  if (state === 'menu') {
    ctx.font = "32px 'Press Start 2P'";
    ctx.fillStyle = '#0f0';
    ctx.textAlign = 'center';
    ctx.fillText('PONG', W/2, H/2 - 40);
    if (Date.now() % 1000 < 500) {
      ctx.font = "10px 'Press Start 2P'";
      ctx.fillText('PRESS ANY KEY', W/2, H/2 + 10);
    }
  } else {
    // Línea central
    ctx.fillStyle = '#1a1a1a';
    for (let y = 0; y < H; y += 16) ctx.fillRect(W/2 - 2, y, 4, 8);

    // Paletas y pelota
    ctx.fillStyle = '#0f0';
    ctx.fillRect(30, p1.y, PW, PH);
    ctx.fillRect(W - 30 - PW, p2.y, PW, PH);
    ctx.fillRect(ball.x, ball.y, BS, BS);

    // Marcador
    ctx.font = "24px 'Press Start 2P'";
    ctx.textAlign = 'center';
    ctx.fillText(score.p1, W/2 - 60, 40);
    ctx.fillText(score.p2, W/2 + 60, 40);

    if (state === 'pause') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#0f0';
      ctx.font = "20px 'Press Start 2P'";
      ctx.fillText('PAUSED', W/2, H/2);
    }
  }

  requestAnimationFrame(loop);
}

function reset() {
  ball = { x: W/2, y: H/2, dx: 4 * (Math.random() > 0.5 ? 1 : -1), dy: 3 };
}

loop();