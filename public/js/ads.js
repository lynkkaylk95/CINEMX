/* CineMax MX - Ads */
(() => {
  if (window.__cinemaxAdsBootstrapped) return;
  window.__cinemaxAdsBootstrapped = true;

  const CINEMAX_SMARTLINK_URL = 'https://www.effectivecpmnetwork.com/mdgtfx72cr?key=ddb2f05c770276460358480543facd5a';
  const CINEMAX_NATIVE_SRC = 'https://pl30226244.effectivecpmnetwork.com/00e298bf7ba92d81b94f4dff373a728f/invoke.js';
  const CINEMAX_NATIVE_CONTAINER_ID = 'container-00e298bf7ba92d81b94f4dff373a728f';
  const CINEMAX_SOCIAL_BAR_SRC = 'https://pl30226245.effectivecpmnetwork.com/40/4b/00/404b00bb58a19ba41d2858f90d60c5da.js';
  const CINEMAX_ENABLE_SOCIAL_BAR = document.body?.dataset.disableSocialBar !== 'true';
  const CINEMAX_EXO_POPUNDER_SRC = 'https://a.pemsrv.com/popunder1000.js';
  const CINEMAX_EXO_POPUNDER_ID = 'cinemax-exo-play-popunder';
  const CINEMAX_FORMAT_BANNERS = {
    '468x60': { key: '8389824bba4d8e870d5150e45184a022', width: 468, height: 60 },
    '300x250': { key: 'a89c0e35563be5eed3604c499079b6e7', width: 300, height: 250 },
    '160x300': { key: 'f982f1dc80b8113923c57774f16cfb02', width: 160, height: 300 },
    '160x600': { key: 'b185da811b83e9f983183de21da98529', width: 160, height: 600 },
    '320x50': { key: '624058fb77a2a18d0518dff8bf9ca113', width: 320, height: 50 },
    '728x90': { key: 'a802d74f30e7b4a87e3a81c55a3b2377', width: 728, height: 90 }
  };

  function safely(label, task) {
    try {
      task();
    } catch (err) {
      console.warn(`CineMax ad skipped: ${label}`, err);
    }
  }

  function onDomReady(task) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', task, { once: true });
      return;
    }
    task();
  }

  function afterPageLoad(task) {
    const schedule = () => {
      const run = () => safely('deferred ad boot', task);
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(run, { timeout: 2500 });
      } else {
        window.setTimeout(run, 800);
      }
    };

    if (document.readyState === 'complete') {
      schedule();
      return;
    }
    window.addEventListener('load', schedule, { once: true });
  }

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
    if (!anchor || anchor.dataset.smartlinkWired === 'true') return;
    anchor.dataset.smartlinkWired = 'true';
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
    if (element.classList.contains('ad-zone-home-bottom')) return isMobile ? '320x50' : '728x90';
    if (element.classList.contains('ad-zone-home-feed')) return '300x250';
    if (element.classList.contains('ad-zone-category-break')) return isMobile ? '320x50' : '468x60';
    if (element.classList.contains('ad-below-player')) return '300x250';

    return isMobile ? '320x50' : '468x60';
  }

  function mountFormatBanner(element, size) {
    const banner = CINEMAX_FORMAT_BANNERS[size];
    if (!element || !banner || element.dataset.nativeAd === 'true' || element.dataset.formatBannerMounted === 'true') return;
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

    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.text = `atOptions = {
  'key': '${banner.key}',
  'format': 'iframe',
  'height': ${banner.height},
  'width': ${banner.width},
  'params': {}
};`;

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.async = false;
    invokeScript.src = `https://www.highperformanceformat.com/${banner.key}/invoke.js`;
    invokeScript.onerror = () => console.warn(`CineMax ${size} ad failed to load.`);

    element.appendChild(optionsScript);
    element.appendChild(invokeScript);
  }

  function isHiddenAdSlot(element) {
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return true;

    const rail = element.closest('.movie-ad-rail');
    if (rail && window.getComputedStyle(rail).display === 'none') return true;

    return false;
  }

  function mountAllFormatBanners() {
    document.querySelectorAll('.ad-zone, .ad-below-player, .movie-ad-code').forEach(element => {
      mountFormatBanner(element, getFormatBannerSize(element));
    });
  }

  function loadNativeBanner() {
    if (document.getElementById(CINEMAX_NATIVE_CONTAINER_ID)) return;

    const targetSelectors = [
      '.ad-below-player',
      '.ad-zone-home-mid',
      '.movie-mobile-ad-top'
    ];
    const target = targetSelectors.map(selector => document.querySelector(selector)).find(Boolean);
    if (!target) return;

    target.dataset.nativeAd = 'true';
    target.classList.remove('ad-clickable');
    target.removeAttribute('role');
    target.removeAttribute('tabindex');
    target.removeAttribute('aria-label');
    target.innerHTML = '';

    const container = document.createElement('div');
    container.id = CINEMAX_NATIVE_CONTAINER_ID;
    target.appendChild(container);

    const script = document.createElement('script');
    script.async = true;
    script.dataset.cfasync = 'false';
    script.src = CINEMAX_NATIVE_SRC;
    script.onerror = () => console.warn('CineMax native ad failed to load.');
    target.appendChild(script);
  }

  function loadSocialBar() {
    if (!CINEMAX_ENABLE_SOCIAL_BAR) return;
    if (document.querySelector(`script[src="${CINEMAX_SOCIAL_BAR_SRC}"]`)) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = CINEMAX_SOCIAL_BAR_SRC;
    script.onerror = () => console.warn('CineMax social ad failed to load.');
    document.body.appendChild(script);
  }

  function loadExoPlayPopunder() {
    if (!document.querySelector('.video-play-button')) return;
    if (document.getElementById(CINEMAX_EXO_POPUNDER_ID)) return;

    const script = document.createElement('script');
    script.id = CINEMAX_EXO_POPUNDER_ID;
    script.async = true;
    script.type = 'application/javascript';
    script.src = CINEMAX_EXO_POPUNDER_SRC;
    script.setAttribute('data-exo-idzone', '5971718');
    script.setAttribute('data-exo-popup_fallback', 'false');
    script.setAttribute('data-exo-popup_force', 'false');
    script.setAttribute('data-exo-chrome_enabled', 'true');
    script.setAttribute('data-exo-new_tab', 'false');
    script.setAttribute('data-exo-frequency_period', '60');
    script.setAttribute('data-exo-frequency_count', '1');
    script.setAttribute('data-exo-trigger_method', '2');
    script.setAttribute('data-exo-trigger_class', 'video-play-button');
    script.setAttribute('data-exo-trigger_delay', '0');
    script.setAttribute('data-exo-capping_enabled', 'true');
    script.setAttribute('data-exo-tcf_enabled', 'true');
    script.setAttribute('data-exo-only_inline', 'false');
    script.onerror = () => console.warn('CineMax ExoClick play popunder failed to load.');
    document.body.appendChild(script);
  }

  function wireSmartlinks() {
    document.querySelectorAll('#ad-top-bar a').forEach(wireSmartlinkAnchor);

    document.querySelectorAll('footer a').forEach(anchor => {
      if (anchor.textContent.trim().toLowerCase() === 'publicidad') {
        wireSmartlinkAnchor(anchor);
      }
    });
  }

  onDomReady(() => safely('smartlink wiring', wireSmartlinks));
  onDomReady(() => safely('ExoClick play popunder', loadExoPlayPopunder));

  afterPageLoad(() => {
    if (window.__cinemaxAdsMounted) return;
    window.__cinemaxAdsMounted = true;

    safely('native banner', loadNativeBanner);
    safely('format banners', mountAllFormatBanners);
    window.setTimeout(() => safely('social bar', loadSocialBar), 1200);
  });
})();
