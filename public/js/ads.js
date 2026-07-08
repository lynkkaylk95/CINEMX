/* CineMax MX - Ads */
const CINEMAX_SMARTLINK_URL = 'https://www.effectivecpmnetwork.com/mdgtfx72cr?key=ddb2f05c770276460358480543facd5a';
const CINEMAX_FORMAT_BANNERS = {
  '468x60': { width: 468, height: 60 },
  '300x250': { width: 300, height: 250 },
  '160x300': { width: 160, height: 300 },
  '160x600': { width: 160, height: 600 },
  '320x50': { width: 320, height: 50 },
  '728x90': { width: 728, height: 90 }
};

function openSmartlinkAd() {
  const adWindow = window.open('about:blank', '_blank');
  if (adWindow) {
    adWindow.opener = null;
    adWindow.location.href = CINEMAX_SMARTLINK_URL;
    adWindow.blur();
  }
  window.focus();
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

function getFormatBannerSize(element) {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  if (element.classList.contains('movie-ad-code')) {
    return window.matchMedia('(max-width: 1400px)').matches ? '160x300' : '160x600';
  }

  if (element.classList.contains('movie-mobile-ad')) return '320x50';
  if (element.classList.contains('movie-affiliate')) return '300x250';
  if (element.id === 'affiliate-section') return isMobile ? '320x50' : '468x60';
  if (element.classList.contains('ad-zone-home-bottom')) return isMobile ? '320x50' : '728x90';
  if (element.classList.contains('ad-zone-home-feed')) return '300x250';
  if (element.classList.contains('ad-zone-category-break')) return isMobile ? '320x50' : '468x60';
  if (element.classList.contains('ad-below-player')) return '300x250';

  return isMobile ? '320x50' : '468x60';
}

function mountFormatBanner(element, size) {
  const banner = CINEMAX_FORMAT_BANNERS[size];
  if (!element || !banner || element.dataset.formatBannerMounted === 'true') return;
  if (isHiddenAdSlot(element)) return;

  element.dataset.formatBannerMounted = 'true';
  element.dataset.adSize = size;
  element.classList.remove('ad-clickable');
  element.removeAttribute('role');
  element.removeAttribute('tabindex');
  element.removeAttribute('aria-label');
  element.classList.add('ad-fixed-slot', `ad-fixed-slot--${size}`);
  element.style.setProperty('--ad-w', `${banner.width}px`);
  element.style.setProperty('--ad-h', `${banner.height}px`);
  element.innerHTML = '';

  const anchor = document.createElement('a');
  anchor.className = 'cinemax-ad-banner ad-clickable';
  anchor.href = CINEMAX_SMARTLINK_URL;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.innerHTML = `
    <span class="ad-kicker">CineMax MX</span>
    <strong>Ver oferta exclusiva</strong>
    <small>Publicidad</small>
  `;
  element.appendChild(anchor);
  wireSmartlinkAnchor(anchor);
}

function isHiddenAdSlot(element) {
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return true;

  const rail = element.closest('.movie-ad-rail');
  if (rail && window.getComputedStyle(rail).display === 'none') return true;

  return false;
}

function mountAllFormatBanners() {
  document.querySelectorAll('.ad-zone, .ad-below-player, .movie-ad-code, #affiliate-section, .movie-affiliate').forEach(element => {
    mountFormatBanner(element, getFormatBannerSize(element));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  mountAllFormatBanners();

  document.querySelectorAll('#ad-top-bar a').forEach(wireSmartlinkAnchor);

  document.querySelectorAll('footer a').forEach(anchor => {
    if (anchor.textContent.trim().toLowerCase() === 'publicidad') {
      wireSmartlinkAnchor(anchor);
    }
  });
});
