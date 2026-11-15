/** Fades elements in as they enter the viewport; the stagger comes from the --d custom property. */
export function initReveal(): void {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-in'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.05 },
  );
  items.forEach((item) => observer.observe(item));
}
