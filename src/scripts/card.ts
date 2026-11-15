import { ensureQr } from './qr-dom';

export interface CardController {
  /** Starts the card tilted away so it visibly swings into place. */
  swingIn(): void;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const SWAY_MS = 11000;
const SWAY_STEPS = 24;

// How far the light moves per degree of tilt, in % of the layer's own size.
const glareTransform = (rx: number, ry: number): string =>
  `translate3d(${(-55 + ry * 6.5).toFixed(1)}%, ${(-61 - rx * 8.3).toFixed(1)}%, 0) scale(3)`;
const bandTransform = (rx: number, ry: number): string =>
  `translate3d(${(ry * 11).toFixed(1)}%, ${(rx * 6).toFixed(1)}%, 0) scale(4)`;

/**
 * The 3D card. Two layers of motion, kept apart so the common case costs nothing:
 *
 * - Idle sway: a figure-eight Web Animation on the card and its light layers.
 *   It only animates `transform`, so the browser runs it on the compositor;
 *   no script and no repaint per frame.
 * - Input tilt (mouse on desktop, gyroscope on Android, the entrance swing):
 *   script-driven on a wrapper element, and only while something is changing.
 */
export function initCard(): CardController | undefined {
  const card = document.querySelector<HTMLElement>('[data-card]');
  if (!card) return undefined;

  const tiltEl = card.closest<HTMLElement>('[data-card-tilt]');
  const sheen = card.querySelector<HTMLElement>('[data-card-sheen]');
  const glare = card.querySelector<HTMLElement>('[data-card-glare]');
  const band = card.querySelector<HTMLElement>('[data-card-band]');
  const front = card.querySelector<HTMLElement>('.card__face--front');
  const back = card.querySelector<HTMLElement>('.card__face--back');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let flipped = false;
  let hovering = false;
  let gyro = false;

  // ---------- Idle sway ----------
  const sway: Animation[] = [];
  let swayHeld = false;
  let settleFrame = 0;

  const startSway = (): void => {
    if (reduceMotion || sway.length > 0) return;
    const cardFrames: Keyframe[] = [];
    const glareFrames: Keyframe[] = [];
    const bandFrames: Keyframe[] = [];
    // Sampled figure-eight: with 24 linear segments it reads as one smooth curve,
    // and it passes through "flat" twice per loop, which settle() relies on.
    for (let i = 0; i <= SWAY_STEPS; i++) {
      const angle = (i / SWAY_STEPS) * Math.PI * 2;
      const ry = Math.sin(angle) * 9;
      const rx = Math.sin(angle * 2) * 3.5;
      cardFrames.push({ transform: `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)` });
      glareFrames.push({ transform: glareTransform(rx, ry) });
      bandFrames.push({ transform: bandTransform(rx, ry) });
    }
    const timing: KeyframeAnimationOptions = { duration: SWAY_MS, iterations: Infinity };
    sway.push(card.animate(cardFrames, timing));
    if (glare) sway.push(glare.animate(glareFrames, timing));
    if (band) sway.push(band.animate(bandFrames, timing));
    syncSway();
  };

  /** Pauses the sway and glides along its own path to the nearest flat pose. */
  const settle = (): void => {
    const lead = sway[0];
    if (!lead) return;
    sway.forEach((animation) => animation.pause());
    const from = Number(lead.currentTime ?? 0) % SWAY_MS;
    const half = SWAY_MS / 2;
    const goal = Math.round(from / half) * half;
    const started = performance.now();
    const step = (now: number): void => {
      const progress = Math.min(1, (now - started) / 480);
      const eased = 1 - (1 - progress) ** 3;
      const time = from + (goal - from) * eased;
      sway.forEach((animation) => {
        animation.currentTime = time;
      });
      if (progress < 1) settleFrame = requestAnimationFrame(step);
    };
    cancelAnimationFrame(settleFrame);
    settleFrame = requestAnimationFrame(step);
  };

  const syncSway = (): void => {
    // Hold the card still while the QR is showing (a swaying code is harder to
    // scan) and while the visitor is steering it themselves.
    const hold = flipped || hovering || gyro;
    if (hold === swayHeld) return;
    swayHeld = hold;
    if (hold) {
      settle();
    } else {
      cancelAnimationFrame(settleFrame);
      sway.forEach((animation) => animation.play());
    }
  };

  // ---------- Flip ----------
  const flip = (): void => {
    ensureQr();
    flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(flipped));
    front?.setAttribute('aria-hidden', String(flipped));
    back?.setAttribute('aria-hidden', String(!flipped));
    navigator.vibrate?.(10);
    if (flipped) setTarget(0, 0);
    syncSway();
  };
  card.addEventListener('click', flip);
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    flip();
  });

  if (reduceMotion || !tiltEl) return { swingIn() {} };

  // ---------- Input tilt ----------
  const target = { rx: 0, ry: 0 };
  const current = { rx: 0, ry: 0 };
  let frame = 0;
  let running = false;

  const render = (): void => {
    tiltEl.style.transform = `rotateX(${current.rx.toFixed(2)}deg) rotateY(${current.ry.toFixed(2)}deg)`;
    if (sheen) {
      sheen.style.transform = `translate3d(${(current.ry * 2.2).toFixed(1)}%, ${(-current.rx * 2.6).toFixed(1)}%, 0)`;
    }
  };

  const tick = (): void => {
    current.rx += (target.rx - current.rx) * 0.09;
    current.ry += (target.ry - current.ry) * 0.09;
    const resting = Math.abs(target.rx - current.rx) < 0.02 && Math.abs(target.ry - current.ry) < 0.02;
    if (resting) {
      current.rx = target.rx;
      current.ry = target.ry;
    }
    render();
    // Stop the loop once the card has arrived: an idle page runs no script at all.
    if (resting) running = false;
    else frame = requestAnimationFrame(tick);
  };

  const wake = (): void => {
    if (running) return;
    running = true;
    frame = requestAnimationFrame(tick);
  };

  function setTarget(rx: number, ry: number): void {
    target.rx = rx;
    target.ry = ry;
    wake();
  }

  const stage = tiltEl.parentElement ?? tiltEl;
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    stage.addEventListener('pointermove', (event) => {
      if (flipped) return;
      const rect = stage.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      hovering = true;
      syncSway();
      setTarget(-ny * 18, nx * 24);
    });
    stage.addEventListener('pointerleave', () => {
      hovering = false;
      syncSway();
      setTarget(0, 0);
    });
  } else if ('DeviceOrientationEvent' in window && !('requestPermission' in DeviceOrientationEvent)) {
    // iOS gates this behind a permission dialog; not worth interrupting a visitor for.
    let neutral: { beta: number; gamma: number } | undefined;
    window.addEventListener('deviceorientation', (event) => {
      if (event.beta === null || event.gamma === null) return;
      neutral ??= { beta: event.beta, gamma: event.gamma };
      // Drift the neutral pose towards how the phone is held now, so the card
      // always settles back to centre instead of staying tilted.
      neutral.beta += (event.beta - neutral.beta) * 0.02;
      neutral.gamma += (event.gamma - neutral.gamma) * 0.02;
      if (flipped) return;
      const rx = clamp(-(event.beta - neutral.beta) * 0.8, -15, 15);
      const ry = clamp((event.gamma - neutral.gamma) * 1.1, -20, 20);
      // Sensor noise must not keep the loop awake: react to real movement only.
      if (Math.abs(rx - target.rx) < 0.35 && Math.abs(ry - target.ry) < 0.35) return;
      if (!gyro) {
        gyro = true;
        syncSway();
      }
      setTarget(rx, ry);
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      running = false;
    } else if (target.rx !== current.rx || target.ry !== current.ry) {
      wake();
    }
  });

  return {
    swingIn() {
      current.rx = 26;
      current.ry = -34;
      render();
      wake();
      startSway();
    },
  };
}
