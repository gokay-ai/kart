import { ensureQr } from './qr-dom';

let toastTimer = 0;

function toast(message: string): void {
  const el = document.querySelector<HTMLElement>('[data-toast]');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('is-on'), 2400);
}

/** Canonical address of this card: no query string, no hash. */
const cardUrl = (): string => new URL('./', location.href).href;

async function copyLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(cardUrl());
    return true;
  } catch {
    return false;
  }
}

/** Share sheet, native sharing with a copy fallback, haptics and "coming soon" buttons. */
export function initShare(): void {
  const page = document.querySelector<HTMLElement>('[data-share-title]');
  const sheet = document.querySelector<HTMLDialogElement>('[data-sheet]');

  document.querySelectorAll<HTMLElement>('[data-haptic]').forEach((el) => {
    el.addEventListener('click', () => navigator.vibrate?.(8));
  });

  document.querySelectorAll<HTMLElement>('[data-pending]').forEach((el) => {
    el.addEventListener('click', () => toast('Bu bilgi çok yakında eklenecek'));
  });

  const closeSheet = (): void => {
    if (!sheet?.open || sheet.classList.contains('is-closing')) return;
    sheet.classList.add('is-closing');
    setTimeout(() => {
      sheet.classList.remove('is-closing');
      sheet.close();
    }, 250);
  };

  if (sheet) {
    document.querySelectorAll('[data-open-sheet]').forEach((button) => {
      button.addEventListener('click', () => {
        ensureQr();
        sheet.showModal();
      });
    });
    document.querySelectorAll('[data-close-sheet]').forEach((button) => {
      button.addEventListener('click', closeSheet);
    });
    // A click that lands on the dialog element itself is a click on the backdrop.
    sheet.addEventListener('click', (event) => {
      if (event.target === sheet) closeSheet();
    });
    sheet.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeSheet();
    });
  }

  document.querySelectorAll<HTMLButtonElement>('[data-share]').forEach((button) => {
    button.addEventListener('click', async () => {
      const data: ShareData = {
        title: page?.dataset.shareTitle ?? document.title,
        text: page?.dataset.shareText,
        url: cardUrl(),
      };
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share(data);
        } catch {
          // Dismissing the system share sheet rejects the promise; nothing to do.
        }
        return;
      }
      const copied = await copyLink();
      if (!sheet?.open) toast(copied ? 'Bağlantı kopyalandı' : 'Bağlantı kopyalanamadı');
      else flashLabel(sheet.querySelector<HTMLElement>('[data-copy] span'), copied);
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      flashLabel(button.querySelector<HTMLElement>('span'), await copyLink());
    });
  });
}

/** The toast sits under a modal dialog's backdrop, so inside the sheet the button itself confirms. */
function flashLabel(label: HTMLElement | null, ok: boolean): void {
  if (!label) return;
  const original = label.dataset.original ?? label.textContent ?? '';
  label.dataset.original = original;
  label.textContent = ok ? 'Kopyalandı ✓' : 'Kopyalanamadı';
  setTimeout(() => {
    label.textContent = original;
  }, 1800);
}
