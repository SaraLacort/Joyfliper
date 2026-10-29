import { reward } from '../state';

type Toy = { x: number; y: number; emoji: string; color: string; caught: boolean; phase: number };
type Phase = 'aim' | 'down' | 'close' | 'up' | 'deliver' | 'release' | 'return' | 'finished';
const W = 360;
const H = 460;
const floor = 375;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const ease = (t: number) => t * t * (3 - 2 * t);

export function mount(root: HTMLElement): () => void {
  root.innerHTML = `
    <section class="panel" style="overflow:hidden">
      <p>🧸 Arraste a garra ou segure as setas. Alinhe com um bichinho e toque em <b>PEGAR</b>!</p>
      <p class="status" id="claw-status" aria-live="polite"></p>
      <canvas id="claw-canvas" width="360" height="460" aria-label="Máquina de garra com bichinhos"></canvas>
      <div class="actions" style="justify-content:center">
        <button class="secondary" id="claw-left" style="min-width:65px;touch-action:none">◀</button>
        <button class="primary" id="claw-grab">🪝 PEGAR</button>
        <button class="secondary" id="claw-right" style="min-width:65px;touch-action:none">▶</button>
      </div>
      <div class="actions" style="justify-content:center">
        <button class="secondary" id="claw-reset">🔄 Nova rodada</button>
      </div>
      <small>Prêmios e moedas apenas virtuais. Sem apostas ou compras.</small>
    </section>`;
  const canvas = root.querySelector<HTMLCanvasElement>('#claw-canvas')!;
  const ctx = canvas.getContext('2d')!;
  const status = root.querySelector<HTMLElement>('#claw-status')!;
  const grab = root.querySelector<HTMLButtonElement>('#claw-grab')!;
  const left = root.querySelector<HTMLButtonElement>('#claw-left')!;
  const right = root.querySelector<HTMLButtonElement>('#claw-right')!;
  const reset = root.querySelector<HTMLButtonElement>('#claw-reset')!;
  let active = true;
  let phase: Phase = 'aim';
  let x = 180;
  let y = 100;
  let targetY = 320;
  let travelX = 180;
  let carried: Toy | null = null;
  let toys: Toy[] = [];
  let tries = 6;
  let wins = 0;
  let hold = 0;
  let drag = false;
  let clock = 0;
  let phaseTime = 0;
  let last = 0;
  let raf = 0;
  let particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];
  let message = 'Escolha seu prêmio!';

  const roundRect = (px: number, py: number, w: number, h: number, r: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(px, py, w, h, r);
    ctx.fill();
  };
  function newRound() {
    phase = 'aim'; x = 180; y = 100; tries = 6; wins = 0; hold = 0;
    particles = []; carried = null; message = 'Escolha seu prêmio!';
    toys = [
      { x: 68, y: 354, emoji: '🐼', color: '#fff1ae', caught: false, phase: 0 },
      { x: 125, y: 354, emoji: '🐰', color: '#fbc9e7', caught: false, phase: 1 },
      { x: 181, y: 354, emoji: '🦄', color: '#c9d7ff', caught: false, phase: 2 },
      { x: 238, y: 354, emoji: '🐻', color: '#f8d4ad', caught: false, phase: 3 },
      { x: 294, y: 354, emoji: '🐱', color: '#c6f4e7', caught: false, phase: 4 }
    ];
    updateStatus();
  }
  function updateStatus() {
    status.textContent = `🎟️ ${tries} jogadas  ·  🧸 ${wins} prêmios  ·  ${message}`;
    grab.disabled = phase !== 'aim' || tries === 0;
    grab.style.opacity = grab.disabled ? '0.55' : '1';
  }
  function burst(px: number, py: number) {
    const colors = ['#ff73b8', '#ffd65c', '#8c76ff', '#55d5c6'];
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 50 + Math.random() * 100;
      particles.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 50, life: 1, color: colors[i % 4] });
    }
  }
  function startGrab() {
    if (phase !== 'aim' || tries <= 0) return;
    tries--; hold = 0; phase = 'down'; phaseTime = 0;
    const candidates = toys.filter(t => !t.caught);
    const nearest = candidates.reduce<Toy | null>((best, t) =>
      !best || Math.abs(t.x - x) < Math.abs(best.x - x) ? t : best, null);
    carried = nearest && Math.abs(nearest.x - x) <= 22 ? nearest : null;
    targetY = carried ? carried.y - 32 : 330;
    message = 'Descendo...'; updateStatus();
  }
  function finish() {
    if (toys.every(t => t.caught) || tries === 0) {
      phase = 'finished';
      message = 'Rodada encerrada! Toque em Nova rodada.';
    } else {
      phase = 'aim';
      message = 'Escolha outro bichinho!';
    }
    updateStatus();
  }
  function step(dt: number) {
    clock += dt;
    if (phase === 'aim' && hold) x = clamp(x + hold * 170 * dt, 45, 315);
    if (phase === 'down') {
      y = Math.min(targetY, y + 235 * dt);
      if (y >= targetY) { phase = 'close'; phaseTime = 0; message = carried ? 'Pegou!' : 'Quase!'; updateStatus(); }
    } else if (phase === 'close') {
      phaseTime += dt;
      if (phaseTime > 0.34) { phase = 'up'; }
    } else if (phase === 'up') {
      y = Math.max(100, y - 205 * dt);
      if (y <= 100) { phase = 'deliver'; travelX = x; }
    } else if (phase === 'deliver') {
      x = Math.max(45, x - 220 * dt);
      if (x <= 45) { phase = 'release'; phaseTime = 0; }
    } else if (phase === 'release') {
      phaseTime += dt;
      if (phaseTime > 0.25) {
        if (carried) {
          carried.caught = true; wins++;
          reward(25, 'claw');
          burst(55, 380);
          message = '🎉 Prêmio conquistado! +25 pontos';
        } else message = 'Não pegou! Tente alinhar melhor.';
        carried = null;
        phase = 'return'; updateStatus();
      }
    } else if (phase === 'return') {
      const direction = Math.sign(travelX - x);
      x += direction * Math.min(Math.abs(travelX - x), 240 * dt);
      if (Math.abs(travelX - x) < 1) finish();
    }
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; p.life -= dt * 1.25; }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#e2dcff'); bg.addColorStop(1, '#ffdaee');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 17; i++) {
      const sx = (i * 83 + 24) % W;
      const sy = (i * 67 + 16) % 280;
      ctx.globalAlpha = 0.35 + 0.2 * Math.sin(clock * 2 + i);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(sx, sy, 2.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    roundRect(12, 12, 336, 432, 25, '#a78bd8');
    roundRect(21, 20, 318, 362, 19, '#fdf6ff');
    roundRect(28, 55, 304, 318, 13, '#d9f5ff');
    roundRect(29, 329, 302, 43, 7, '#bda6e5');
    roundRect(29, 376, 302, 60, 12, '#f9b9db');
    roundRect(28, 22, 304, 37, 12, '#f9b9db');
    ctx.font = 'bold 21px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#67448c';
    ctx.fillText('✨ JOY CLAW ✨', 180, 47);
    roundRect(34, 342, 58, 28, 7, '#8c6dbd');
    ctx.font = '11px system-ui'; ctx.fillStyle = '#fff'; ctx.fillText('SAÍDA', 63, 360);
    roundRect(37, 388, 286, 34, 14, '#fff0fb');
    ctx.fillStyle = '#9b64b3'; ctx.font = 'bold 16px system-ui';
    ctx.fillText('🧸   JOYFLIPER   🧸', 180, 410);
    for (const t of toys) {
      if (t.caught || t === carried && phase !== 'aim' && phase !== 'down') continue;
      const bounce = Math.sin(clock * 2.8 + t.phase) * 2;
      ctx.fillStyle = t.color; ctx.beginPath(); ctx.ellipse(t.x, t.y + 12, 24, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.font = '42px system-ui'; ctx.textAlign = 'center'; ctx.fillText(t.emoji, t.x, t.y + bounce + 10);
    }
    ctx.strokeStyle = '#8b72bc'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, 59); ctx.lineTo(x, y - 13); ctx.stroke();
    roundRect(x - 21, y - 18, 42, 23, 9, '#9975cb');
    ctx.strokeStyle = '#7957a6'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    const closed = phase === 'close' || phase === 'up' || phase === 'deliver' || phase === 'return';
    ctx.beginPath(); ctx.moveTo(x - 13, y); ctx.lineTo(x - (closed ? 9 : 22), y + 21); ctx.lineTo(x - (closed ? 5 : 15), y + 30);
    ctx.moveTo(x + 13, y); ctx.lineTo(x + (closed ? 9 : 22), y + 21); ctx.lineTo(x + (closed ? 5 : 15), y + 30); ctx.stroke();
    if (carried && ['close', 'up', 'deliver', 'release'].includes(phase)) {
      ctx.font = '40px system-ui'; ctx.fillText(carried.emoji, x, y + 63);
    }
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 6, 6);
    }
    ctx.globalAlpha = 1;
  }
  function frame(time: number) {
    if (!active) return;
    const dt = last ? Math.min((time - last) / 1000, 0.04) : 0;
    last = time;
    step(dt); draw();
    raf = requestAnimationFrame(frame);
  }
  function setHold(value: number) { hold = value; }
  function bindHold(button: HTMLButtonElement, value: number) {
    button.addEventListener('pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); setHold(value); });
    button.addEventListener('pointerup', () => setHold(0));
    button.addEventListener('pointercancel', () => setHold(0));
    button.addEventListener('lostpointercapture', () => setHold(0));
  }
  bindHold(left, -1); bindHold(right, 1);
  canvas.style.touchAction = 'none';
  function position(e: PointerEvent) {
    if (phase !== 'aim') return;
    const rect = canvas.getBoundingClientRect();
    x = clamp((e.clientX - rect.left) * W / rect.width, 45, 315);
  }
  canvas.addEventListener('pointerdown', e => { if (phase !== 'aim') return; drag = true; canvas.setPointerCapture(e.pointerId); position(e); });
  canvas.addEventListener('pointermove', e => { if (drag) position(e); });
  canvas.addEventListener('pointerup', () => { drag = false; });
  canvas.addEventListener('pointercancel', () => { drag = false; });
  grab.onclick = startGrab;
  reset.onclick = newRound;
  newRound();
  raf = requestAnimationFrame(frame);
  return () => { active = false; cancelAnimationFrame(raf); hold = 0; drag = false; };
}
