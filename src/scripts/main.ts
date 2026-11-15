import { initCard } from './card';
import { initIntro } from './intro';
import { initParticles } from './particles';
import { initQr } from './qr-dom';
import { initReveal } from './reveal';
import { initShare } from './share';

window.__booted = true;

initQr();
initParticles();
initShare();
const card = initCard();

void initIntro().then(() => {
  document.documentElement.classList.add('ready');
  card?.swingIn();
  initReveal();
});
