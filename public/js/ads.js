/* CineMax MX - Ads */
(() => {
  if (window.__cinemaxAdsBootstrapped) return;
  window.__cinemaxAdsBootstrapped = true;

  const CINEMAX_SMARTLINK_URL = 'https://www.effectivecpmnetwork.com/mdgtfx72cr?key=ddb2f05c770276460358480543facd5a';
  const CINEMAX_NATIVE_SRC = 'https://pl30226244.effectivecpmnetwork.com/00e298bf7ba92d81b94f4dff373a728f/invoke.js';
  const CINEMAX_NATIVE_CONTAINER_ID = 'container-00e298bf7ba92d81b94f4dff373a728f';
  const CINEMAX_SOCIAL_BAR_SRC = 'https://pl30226245.effectivecpmnetwork.com/40/4b/00/404b00bb58a19ba41d2858f90d60c5da.js';
  const CINEMAX_EXOCLICK_INTERSTITIAL_SRC = 'https://a.pemsrv.com/ad-provider.js';
  const CINEMAX_EXOCLICK_INTERSTITIAL_CLASS = 'eas6a97888e33';
  const CINEMAX_EXOCLICK_INTERSTITIAL_ZONE = '5969602';
  const CINEMAX_ENABLE_SOCIAL_BAR = document.body?.dataset.enableSocialBar === 'true';
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

    const iframe = document.createElement('iframe');
    iframe.className = 'format-ad-frame';
    iframe.title = `Publicidad ${size}`;
    iframe.width = String(banner.width);
    iframe.height = String(banner.height);
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.setAttribute('scrolling', 'no');
    iframe.srcdoc = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=${banner.width},initial-scale=1">
  <style>html,body{margin:0;padding:0;width:${banner.width}px;height:${banner.height}px;overflow:hidden;background:transparent;}</style>
</head>
<body>
  <script>
    atOptions = {
      'key': '${banner.key}',
      'format': 'iframe',
      'height': ${banner.height},
      'width': ${banner.width},
      'params': {}
    };
  <\/script>
  <script src="https://www.highperformanceformat.com/${banner.key}/invoke.js"><\/script>
</body>
</html>`;

    element.appendChild(iframe);
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

    const iframe = document.createElement('iframe');
    iframe.className = 'format-ad-frame native-ad-frame';
    iframe.title = 'Publicidad nativa';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
    iframe.srcdoc = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>html,body{margin:0;padding:0;min-height:250px;overflow:hidden;background:transparent;}</style>
</head>
<body>
  <div id="${CINEMAX_NATIVE_CONTAINER_ID}"></div>
  <script async data-cfasync="false" src="${CINEMAX_NATIVE_SRC}"><\/script>
</body>
</html>`;

    target.appendChild(iframe);
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

  function loadExoclickMobileInterstitial() {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    if (window.__cinemaxExoclickInterstitialMounted) return;
    window.__cinemaxExoclickInterstitialMounted = true;

    if (!document.querySelector(`script[src="${CINEMAX_EXOCLICK_INTERSTITIAL_SRC}"]`)) {
      const providerScript = document.createElement('script');
      providerScript.async = true;
      providerScript.type = 'application/javascript';
      providerScript.src = CINEMAX_EXOCLICK_INTERSTITIAL_SRC;
      providerScript.onerror = () => console.warn('CineMax ExoClick interstitial failed to load.');
      document.body.appendChild(providerScript);
    }

    const slot = document.createElement('ins');
    slot.className = CINEMAX_EXOCLICK_INTERSTITIAL_CLASS;
    slot.dataset.zoneid = CINEMAX_EXOCLICK_INTERSTITIAL_ZONE;
    document.body.appendChild(slot);

    window.AdProvider = window.AdProvider || [];
    window.AdProvider.push({ serve: {} });
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

  afterPageLoad(() => {
    if (window.__cinemaxAdsMounted) return;
    window.__cinemaxAdsMounted = true;

    safely('native banner', loadNativeBanner);
    safely('format banners', mountAllFormatBanners);
    window.setTimeout(() => safely('ExoClick mobile interstitial', loadExoclickMobileInterstitial), 600);
    window.setTimeout(() => safely('social bar', loadSocialBar), 1200);
  });
})();
