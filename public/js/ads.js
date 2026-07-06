/* CineMax MX - Ads */
const CINEMAX_SMARTLINK_URL = 'https://www.effectivecpmnetwork.com/mdgtfx72cr?key=ddb2f05c770276460358480543facd5a';
const CINEMAX_NATIVE_SRC = 'https://pl30226244.effectivecpmnetwork.com/00e298bf7ba92d81b94f4dff373a728f/invoke.js';
const CINEMAX_NATIVE_CONTAINER_ID = 'container-00e298bf7ba92d81b94f4dff373a728f';
const CINEMAX_SOCIAL_BAR_SRC = 'https://pl30226245.effectivecpmnetwork.com/40/4b/00/404b00bb58a19ba41d2858f90d60c5da.js';

function openSmartlinkAd() {
  const adWindow = window.open('about:blank', '_blank');
  if (adWindow) {
    adWindow.opener = null;
    adWindow.location.href = CINEMAX_SMARTLINK_URL;
    adWindow.blur();
  }
  window.focus();
}

function wireSmartlinkElement(element) {
  if (!element) return;
  if (element.dataset.nativeAd === 'true') return;
  renderSmartlinkBanner(element);
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

function renderSmartlinkBanner(element) {
  const text = element.textContent || '';
  const hasRealAd = element.querySelector('iframe, img, object, embed, script');
  if (hasRealAd || !/pega|script|banner/i.test(text)) return;

  if (element.classList.contains('movie-ad-code')) {
    element.innerHTML = `
      <div class="cinemax-ad-banner cinemax-ad-banner--rail">
        <span class="ad-kicker">Publicidad</span>
        <strong>CineMax MX</strong>
        <small>Oferta exclusiva para disfrutar más contenido.</small>
        <span class="ad-cta">Ver ahora</span>
      </div>
    `;
    return;
  }

  element.innerHTML = `
    <div class="cinemax-ad-banner">
      <div class="ad-copy">
        <span class="ad-kicker">Publicidad</span>
        <strong>Mira más títulos gratis</strong>
        <small>Contenido recomendado para usuarios de CineMax MX.</small>
      </div>
      <span class="ad-cta">Ver oferta</span>
    </div>
  `;
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

function loadNativeBanner() {
  if (document.getElementById(CINEMAX_NATIVE_CONTAINER_ID)) return;

  const targetSelectors = [
    '.ad-below-player',
    '.ad-zone-home-mid',
    '.movie-mobile-ad-top',
    '.ad-zone-home-feed',
    '.ad-zone-home-top'
  ];
  const target = targetSelectors.map(selector => document.querySelector(selector)).find(Boolean);
  if (!target) return;

  target.dataset.nativeAd = 'true';
  target.classList.remove('ad-clickable');
  target.removeAttribute('role');
  target.removeAttribute('tabindex');
  target.removeAttribute('aria-label');
  target.innerHTML = '';

  const script = document.createElement('script');
  script.async = true;
  script.dataset.cfasync = 'false';
  script.src = CINEMAX_NATIVE_SRC;

  const container = document.createElement('div');
  container.id = CINEMAX_NATIVE_CONTAINER_ID;

  target.append(script, container);
}

function loadSocialBar() {
  if (document.querySelector(`script[src="${CINEMAX_SOCIAL_BAR_SRC}"]`)) return;

  const script = document.createElement('script');
  script.src = CINEMAX_SOCIAL_BAR_SRC;
  document.body.appendChild(script);
}

function renderAffiliateBanners() {
  document.querySelectorAll('#affiliate-section, .movie-affiliate').forEach(section => {
    section.classList.add('affiliate-banner');
    section.innerHTML = `
      <div class="affiliate-banner-copy">
        <span class="aff-label">Ofertas para ti</span>
        <h2 class="aff-title">Mejora tu experiencia de cine</h2>
        <p class="aff-desc">Accede a ofertas recomendadas para ver películas y series desde tu móvil con mejor comodidad.</p>
      </div>
      <a class="aff-banner-btn" href="${CINEMAX_SMARTLINK_URL}" target="_blank" rel="noopener noreferrer">Ver oferta</a>
    `;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadNativeBanner();
  loadSocialBar();
  renderAffiliateBanners();

  document.querySelectorAll('#ad-top-bar a').forEach(wireSmartlinkAnchor);
  document.querySelectorAll('.ad-zone, .ad-below-player, .movie-ad-code').forEach(wireSmartlinkElement);
  document.querySelectorAll('.aff-banner-btn').forEach(wireSmartlinkAnchor);

  document.querySelectorAll('footer a').forEach(anchor => {
    if (anchor.textContent.trim().toLowerCase() === 'publicidad') {
      wireSmartlinkAnchor(anchor);
    }
  });
});
