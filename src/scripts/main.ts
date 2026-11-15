import { initCard } from './card';
import { initIntro } from './intro';
import { ensureQr } from './qr-dom';
import { initReveal } from './reveal';
import { initShare } from './share';

window.__booted = true;

initShare();
const card = initCard();

void initIntro().then(() => {
  document.documentElement.classList.add('ready');
  card?.swingIn();
  initReveal();
  // The QR sits on the back of the card and in the share sheet, neither visible
  // yet: build it once the entrance animation has had the main thread to itself.
  setTimeout(ensureQr, 700);
});
