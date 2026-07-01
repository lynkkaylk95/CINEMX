/* CineMax MX - Adsterra Smartlink */
const CINEMAX_SMARTLINK_URL = 'https://www.effectivecpmnetwork.com/fqnfqrdx?key=ca18fc268feaa5010eabed567ae9a466';

function openSmartlinkAd() {
  const adWindow = window.open(CINEMAX_SMARTLINK_URL, '_blank', 'noopener,noreferrer');
  if (adWindow) adWindow.opener = null;
  window.focus();
}

function wireSmartlinkElement(element) {
  if (!element) return;
  polishAdPlaceholder(element);
  element.classList.add('ad-clickable');
  element.setAttribute('role', 'link');
  element.setAttribute('tabindex', '0');
  element.setAttribute('aria-label', 'Abrir publicidad');

  element.addEventListener('click', event => {
    const interactive = event.target.closest('a, button, input, select, textarea');
    if (interactive && interactive !== element) return;
    openSmartlinkAd();
  });

  element.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openSmartlinkAd();
  });
}

function polishAdPlaceholder(element) {
  const text = element.textContent || '';
  const hasRealAd = element.querySelector('iframe, img, object, embed, script');
  if (hasRealAd || !/pega|script|banner/i.test(text)) return;

  const label = element.querySelector('.ad-zone-label');
  if (label) {
    label.innerHTML = '<strong>Publicidad</strong>Ver anuncio';
    return;
  }

  if (element.classList.contains('movie-ad-code')) {
    element.innerHTML = '<span><strong>Publicidad</strong><br>Ver anuncio</span>';
  }
}

function wireSmartlinkAnchor(anchor) {
  if (!anchor) return;
  anchor.href = CINEMAX_SMARTLINK_URL;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.onclick = event => {
    event.preventDefault();
    if (anchor.closest('#ad-top-bar') && typeof showToast === 'function') {
      showToast('Oferta Adsterra Smartlink');
    }
    openSmartlinkAd();
    return false;
  };
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#ad-top-bar a').forEach(wireSmartlinkAnchor);
  document.querySelectorAll('.ad-zone, .ad-below-player, .movie-ad-code').forEach(wireSmartlinkElement);

  document.querySelectorAll('footer a').forEach(anchor => {
    if (anchor.textContent.trim().toLowerCase() === 'publicidad') {
      wireSmartlinkAnchor(anchor);
    }
  });
});
