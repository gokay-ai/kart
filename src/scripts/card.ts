interface Tilt {
  rx: number;
  ry: number;
}

export interface CardController {
  /** Starts the card tilted away so it visibly swings into place. */
  swingIn(): void;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/**
 * The 3D card: tap or Enter flips it, and it tilts with the mouse on desktop,
 * with the phone's gyroscope where the browser allows it without a prompt
 * (Android), and with a slow idle sway everywhere else.
 */
export function initCard(): CardController | undefined {
  const card = document.querySelector<HTMLElement>('[data-card]');
  if (!card) return undefined;

  const front = card.querySelector<HTMLElement>('.card__face--front');
  const back = card.querySelector<HTMLElement>('.card__face--back');
  const flip = (): void => {
    const flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(flipped));
    front?.setAttribute('aria-hidden', String(flipped));
    back?.setAttribute('aria-hidden', String(!flipped));
    navigator.vibrate?.(10);
  };
  card.addEventListener('click', flip);
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    flip();
  });

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return { swingIn() {} };

  const target: Tilt = { rx: 0, ry: 0 };
  const current: Tilt = { rx: 0, ry: 0 };
  let lastInput = -Infinity;

  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer) {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      target.ry = nx * 24;
      target.rx = -ny * 18;
      lastInput = performance.now();
    });
    card.addEventListener('pointerleave', () => {
      lastInput = -Infinity;
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
      target.ry = clamp((event.gamma - neutral.gamma) * 1.1, -20, 20);
      target.rx = clamp(-(event.beta - neutral.beta) * 0.8, -15, 15);
      lastInput = performance.now();
    });
  }

  let visible = true;
  let frame = 0;
  const tick = (now: number): void => {
    if (card.classList.contains('is-flipped')) {
      // Hold the QR side flat and still: a swaying code is harder to scan.
      target.rx = 0;
      target.ry = 0;
    } else if (now - lastInput > 1800) {
      target.ry = Math.sin(now / 2300) * 10;
      target.rx = Math.cos(now / 3100) * 5 - 1;
    }
    current.rx += (target.rx - current.rx) * 0.075;
    current.ry += (target.ry - current.ry) * 0.075;
    const style = card.style;
    style.setProperty('--rx', current.rx.toFixed(2));
    style.setProperty('--ry', current.ry.toFixed(2));
    style.setProperty('--px', `${(50 + current.ry * 2.6).toFixed(1)}%`);
    style.setProperty('--py', `${(28 - current.rx * 3).toFixed(1)}%`);
    style.setProperty('--sx', `${(50 + current.ry * 3.4).toFixed(1)}%`);
    style.setProperty('--sy', `${(50 + current.rx * 3).toFixed(1)}%`);
    frame = requestAnimationFrame(tick);
  };
  const sync = (): void => {
    cancelAnimationFrame(frame);
    if (visible && !document.hidden) frame = requestAnimationFrame(tick);
  };
  new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    sync();
  }).observe(card);
  document.addEventListener('visibilitychange', sync);

  return {
    swingIn() {
      current.rx = 26;
      current.ry = -34;
    },
  };
}
