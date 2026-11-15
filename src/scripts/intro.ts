const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Resolves when the page may start its entrance. The logo drawing itself is
 * pure CSS (it starts with the first paint); this only times the hand-over.
 */
export async function initIntro(): Promise<void> {
  const root = document.documentElement;
  // Never hold the page for slow fonts: fall back after a short grace period.
  const fonts = Promise.race([document.fonts.ready.then(() => undefined), wait(1400)]);
  const screen = document.getElementById('intro');

  if (!root.classList.contains('intro') || !screen) {
    await Promise.race([fonts, wait(250)]);
    return;
  }

  await Promise.all([wait(1450), fonts]);
  screen.classList.add('is-leaving');
  setTimeout(() => {
    screen.remove();
    root.classList.remove('intro');
  }, 550);
  // Let the page start moving while the logo is still fading out.
  await wait(140);
}
