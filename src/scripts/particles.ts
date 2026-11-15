interface Particle {
  x: number;
  y: number;
  radius: number;
  rise: number;
  drift: number;
  phase: number;
  twinkle: number;
  alpha: number;
  sprite: HTMLCanvasElement;
}

/** Pre-rendered soft dot; drawing a sprite is far cheaper than a per-frame shadow blur. */
function makeSprite(rgb: string): HTMLCanvasElement {
  const size = 64;
  const sprite = document.createElement('canvas');
  sprite.width = size;
  sprite.height = size;
  const ctx = sprite.getContext('2d');
  if (ctx) {
    const glow = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    glow.addColorStop(0, `rgba(${rgb},1)`);
    glow.addColorStop(0.22, `rgba(${rgb},0.75)`);
    glow.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
  }
  return sprite;
}

/** Slow rising sparks behind the content, in the brand's yellow and blue. */
export function initParticles(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-particles]');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const sprites = [makeSprite('255,201,0'), makeSprite('122,172,255'), makeSprite('255,255,255')];
  let width = 0;
  let height = 0;
  let particles: Particle[] = [];

  const spawn = (): Particle => {
    const pick = Math.random();
    const sprite = sprites[pick < 0.4 ? 0 : pick < 0.85 ? 1 : 2] as HTMLCanvasElement;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1.5 + Math.random() * 4.5,
      rise: 5 + Math.random() * 16,
      drift: 6 + Math.random() * 12,
      phase: Math.random() * Math.PI * 2,
      twinkle: 0.4 + Math.random() * 1.1,
      alpha: 0.25 + Math.random() * 0.6,
      sprite,
    };
  };

  const resize = (): void => {
    const nextWidth = canvas.clientWidth;
    const nextHeight = canvas.clientHeight;
    // Mobile browsers fire resize whenever the address bar slides; ignore those.
    if (nextWidth === width && Math.abs(nextHeight - height) < 140) return;
    width = nextWidth;
    height = nextHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(70, Math.max(26, (width * height) / 13000)));
    particles = Array.from({ length: count }, spawn);
    if (reduceMotion) draw(0, 0);
  };

  const draw = (time: number, dt: number): void => {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.y -= p.rise * dt;
      if (p.y < -12) {
        p.y = height + 12;
        p.x = Math.random() * width;
      }
      const sway = Math.sin(time * 0.5 + p.phase) * p.drift;
      const shimmer = 0.35 + 0.65 * Math.abs(Math.sin(time * p.twinkle + p.phase));
      ctx.globalAlpha = p.alpha * shimmer;
      ctx.drawImage(p.sprite, p.x + sway - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
    }
    ctx.globalAlpha = 1;
  };

  resize();
  window.addEventListener('resize', resize);
  if (reduceMotion) return;

  let last = performance.now();
  let frame = 0;
  const tick = (now: number): void => {
    // Clamp the step so a backgrounded tab does not jump on return.
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    draw(now / 1000, dt);
    frame = requestAnimationFrame(tick);
  };
  const start = (): void => {
    cancelAnimationFrame(frame);
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else start();
  });
  start();
}
