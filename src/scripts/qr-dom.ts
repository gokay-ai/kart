import { qrSvg } from '../lib/qr';

const cache = new Map<string, string>();

function svgFor(url: string): string {
  let svg = cache.get(url);
  if (!svg) {
    svg = qrSvg(url);
    cache.set(url, svg);
  }
  return svg;
}

function save(blob: Blob, fileName: string): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 4000);
}

function savePng(svg: string, fileName: string, size = 1600): void {
  const image = new Image();
  const source = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.getContext('2d')?.drawImage(image, 0, 0, size, size);
    URL.revokeObjectURL(source);
    canvas.toBlob((blob) => {
      if (blob) save(blob, fileName);
    }, 'image/png');
  };
  image.src = source;
}

/**
 * QR codes are generated in the browser from the address the page is actually
 * served at, so they stay correct when the site moves to another domain.
 */
export function initQr(): void {
  document.querySelectorAll<HTMLElement>('[data-qr]').forEach((panel) => {
    const url = new URL(panel.dataset.qr ?? './', location.href).href;
    panel.dataset.qrValue = url;
    panel.innerHTML = svgFor(url);
  });

  document.querySelectorAll<HTMLElement>('[data-qr-url]').forEach((label) => {
    label.textContent = new URL(label.dataset.qrUrl ?? './', location.href).href.replace(/^https?:\/\//, '');
  });

  document.querySelectorAll<HTMLButtonElement>('[data-qr-download]').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = button.closest('.qr-card')?.querySelector<HTMLElement>('[data-qr]');
      const url = panel?.dataset.qrValue;
      if (!panel || !url) return;
      const name = `qr-${panel.dataset.qrName ?? 'kart'}`;
      const svg = svgFor(url);
      if (button.dataset.qrDownload === 'svg') save(new Blob([svg], { type: 'image/svg+xml' }), `${name}.svg`);
      else savePng(svg, `${name}.png`);
    });
  });

  document.querySelector('[data-print]')?.addEventListener('click', () => window.print());
}
