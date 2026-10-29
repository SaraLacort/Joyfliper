import { reward } from '../state';

// Adapted gameplay concept from GameZ Snake Game by Explorer-O7 (MIT stated in README).
// https://github.com/Explorer-O7/A-Mini-Game-Website-GameZ
type Point = { x: number; y: number };
const SIZE = 18;
const CELL = 20;
export function mount(root: HTMLElement): () => void {
  root.innerHTML = `<section class="panel">
    <p>🐍 Coma as frutinhas sem bater na parede ou no próprio corpo.</p>
    <p class="status" id="snake-status" aria-live="polite">Toque em Jogar</p>
    <canvas id="snake-canvas" width="360" height="360" aria-label="Jogo da cobrinha"></canvas>
    <div class="actions" style="justify-content:center"><button class="primary" id="snake-start">▶ Jogar / Reiniciar</button></div>
    <div style="display:grid;grid-template-columns:repeat(3,64px);justify-content:center;gap:8px;touch-action:none">
      <span></span><button class="secondary" data-dir="up" aria-label="Cima">▲</button><span></span>
      <button class="secondary" data-dir="left" aria-label="Esquerda">◀</button>
      <button class="secondary" data-dir="down" aria-label="Baixo">▼</button>
      <button class="secondary" data-dir="right" aria-label="Direita">▶</button>
    </div></section>`;
  const canvas = root.querySelector<HTMLCanvasElement>('#snake-canvas')!;
  const ctx = canvas.getContext('2d')!;
  const status = root.querySelector<HTMLElement>('#snake-status')!;
  let snake: Point[] = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];
  let dir: Point = { x: 1, y: 0 };
  let next: Point = dir;
  let food: Point = { x: 13, y: 9 };
  let score = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  let active = true;
  let playing = false;
  let touchX = 0, touchY = 0;
  const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
  function placeFood() {
    const spaces: Point[] = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const p = { x, y };
      if (!snake.some(s => same(s, p))) spaces.push(p);
    }
    if (!spaces.length) { end('🏆 Você venceu!'); return; }
    food = spaces[Math.floor(Math.random() * spaces.length)];
  }
  function draw() {
    ctx.fillStyle = '#f2edff'; ctx.fillRect(0, 0, 360, 360);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if ((x + y) % 2 === 0) { ctx.fillStyle = '#e8e0fb'; ctx.fillRect(x * CELL, y * CELL, CELL, CELL); }
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '21px system-ui';
    ctx.fillText('🍓', food.x * CELL + 10, food.y * CELL + 10);
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#43b99c' : i % 2 ? '#6bd8b4' : '#7be5c0';
      ctx.beginPath(); ctx.roundRect(s.x * CELL + 1, s.y * CELL + 1, 18, 18, 7); ctx.fill();
      if (i === 0) { ctx.fillStyle = '#253e49'; ctx.beginPath(); ctx.arc(s.x * CELL + 7, s.y * CELL + 7, 1.8, 0, Math.PI * 2); ctx.arc(s.x * CELL + 14, s.y * CELL + 7, 1.8, 0, Math.PI * 2); ctx.fill(); }
    });
  }
  function end(message: string) {
    if (timer) clearInterval(timer);
    timer = undefined; playing = false;
    status.textContent = `${message} · ${score} pontos`;
    if (score) reward(score, 'snake');
  }
  function tick() {
    dir = next;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    const eating = same(head, food);
    const body = eating ? snake : snake.slice(0, -1);
    if (head.x < 0 || head.x >= SIZE || head.y < 0 || head.y >= SIZE || body.some(s => same(s, head))) {
      end('Fim de jogo!'); draw(); return;
    }
    snake.unshift(head);
    if (eating) { score += 10; placeFood(); } else snake.pop();
    if (playing) status.textContent = `🍓 Pontos: ${score}`;
    draw();
  }
  function change(x: number, y: number) {
    if (!playing || x === -dir.x && y === -dir.y) return;
    next = { x, y };
  }
  function key(e: KeyboardEvent) {
    const map: Record<string, Point> = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } };
    if (map[e.key]) { e.preventDefault(); change(map[e.key].x, map[e.key].y); }
  }
  document.addEventListener('keydown', key);
  root.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach(b => b.onclick = () => {
    const d = b.dataset.dir;
    if (d === 'up') change(0, -1);
    if (d === 'down') change(0, 1);
    if (d === 'left') change(-1, 0);
    if (d === 'right') change(1, 0);
  });
  canvas.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: true });
  canvas.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) change(Math.sign(dx), 0);
    else change(0, Math.sign(dy));
  }, { passive: true });
  root.querySelector<HTMLButtonElement>('#snake-start')!.onclick = () => {
    if (timer) clearInterval(timer);
    snake = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];
    dir = { x: 1, y: 0 }; next = dir; score = 0; playing = true;
    placeFood(); status.textContent = '🍓 Pontos: 0'; draw();
    timer = setInterval(tick, 125);
  };
  draw();
  return () => { active = false; playing = false; if (timer) clearInterval(timer); document.removeEventListener('keydown', key); void active; };
}
