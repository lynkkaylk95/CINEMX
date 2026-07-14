/* CineMax MX - Ads */
(() => {
  if (window.__cinemaxAdsBootstrapped) return;
  window.__cinemaxAdsBootstrapped = true;

  const CINEMAX_SMARTLINK_URL = 'https://www.effectivecpmnetwork.com/mdgtfx72cr?key=ddb2f05c770276460358480543facd5a';
  const CINEMAX_EXO_POPUNDER_SRC = 'https://a.pemsrv.com/popunder1000.js';
  const CINEMAX_EXO_POPUNDER_ID = 'popmagicldr';
  const CINEMAX_EXO_PROVIDER_SRC = 'https://a.magsrv.com/ad-provider.js';
  const CINEMAX_EXO_FULLPAGE_PROVIDER_SRC = 'https://a.pemsrv.com/ad-provider.js';
  const CINEMAX_EXO_ZONES = {
    fullpageInterstitial: { zoneId: '5969616', className: 'eas6a97888e33' },
    messagePopup: { zoneId: '5971714', className: 'eas6a97888e14' },
    movieNative: { zoneId: '5973194', className: 'eas6a97888e20' },
    homeRectangle: { zoneId: '5973184', className: 'eas6a97888e10', size: '300x250' },
    movieMobile: { zoneId: '5973186', className: 'eas6a97888e10', size: '300x50' },
    movieLeftRail: { zoneId: '5973188', className: 'eas6a97888e2', size: '160x600' },
    movieRightRail: { zoneId: '5971764', className: 'eas6a97888e2', size: '160x600' }
  };
  const CINEMAX_FORMAT_BANNERS = {
    '468x60': { key: 'dfc49ebd2407ec09e0689da4f8a0c34c', width: 468, height: 60 },
    '320x50': { key: '4e485ec0b81fcdb2c2549f73a60b345a', width: 320, height: 50 },
    '728x90': { key: '184e6b9972a56e72cc0c8aca28deb91f', width: 728, height: 90 }
  };
  let formatBannerQueue = Promise.resolve();

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

    formatBannerQueue = formatBannerQueue.then(() => new Promise(resolve => {
      window.atOptions = {
        key: banner.key,
        format: 'iframe',
        height: banner.height,
        width: banner.width,
        params: {}
      };

      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.async = false;
      invokeScript.src = `https://www.highperformanceformat.com/${banner.key}/invoke.js`;
      invokeScript.onload = resolve;
      invokeScript.onerror = () => {
        console.warn(`CineMax ${size} ad failed to load.`);
        resolve();
      };
      element.appendChild(invokeScript);
    }));
  }

  function mountExoClickZone(element, zone) {
    if (!element || !zone || element.dataset.exoZoneMounted === 'true') return;
    if (isHiddenAdSlot(element)) return;

    element.dataset.exoZoneMounted = 'true';
    element.dataset.exoZoneId = zone.zoneId;
    if (zone.size) element.dataset.adSize = zone.size;
    element.classList.remove('ad-clickable');
    element.removeAttribute('role');
    element.removeAttribute('tabindex');
    element.removeAttribute('aria-label');
    if (zone.size) {
      const [width, height] = zone.size.split('x');
      element.classList.add('ad-fixed-slot', `ad-fixed-slot--${zone.size}`);
      element.style.setProperty('--ad-w', `${width}px`);
      element.style.setProperty('--ad-h', `${height}px`);
    } else {
      element.dataset.nativeAd = 'true';
    }
    element.innerHTML = '';

    if (!document.querySelector(`script[src="${CINEMAX_EXO_PROVIDER_SRC}"]`)) {
      const providerScript = document.createElement('script');
      providerScript.async = true;
      providerScript.type = 'application/javascript';
      providerScript.src = CINEMAX_EXO_PROVIDER_SRC;
      element.appendChild(providerScript);
    }

    const slot = document.createElement('ins');
    slot.className = zone.className;
    slot.dataset.zoneid = zone.zoneId;
    slot.style.display = 'block';
    slot.style.width = '100%';
    slot.style.maxWidth = '100%';
    element.appendChild(slot);

    const serveScript = document.createElement('script');
    serveScript.text = '(AdProvider = window.AdProvider || []).push({"serve": {}});';
    element.appendChild(serveScript);
  }

  function isHiddenAdSlot(element) {
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return true;

    const rail = element.closest('.movie-ad-rail');
    if (rail && window.getComputedStyle(rail).display === 'none') return true;

    return false;
  }

  function mountAllFormatBanners() {
    const categorySlots = [...document.querySelectorAll('.ad-zone-category-break')];
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    categorySlots.forEach((element, index) => {
      if (index === 0 && !isMobile) {
        element.classList.remove('ad-slot-disabled');
        mountFormatBanner(element, '468x60');
      } else {
        element.classList.add('ad-slot-disabled');
        element.innerHTML = '';
      }
    });

    const homeRectangle = document.querySelector('.ad-zone-home-feed');
    if (homeRectangle) mountExoClickZone(homeRectangle, CINEMAX_EXO_ZONES.homeRectangle);

    const homeBottom = document.querySelector('.ad-zone-home-bottom');
    if (homeBottom) mountFormatBanner(homeBottom, window.matchMedia('(max-width: 768px)').matches ? '320x50' : '728x90');

    const movieMobileTop = document.querySelector('.movie-mobile-ad-top');
    if (movieMobileTop) movieMobileTop.classList.add('ad-slot-disabled');
    const movieMobileBottom = document.querySelector('.movie-mobile-ad-bottom');
    if (movieMobileBottom) mountExoClickZone(movieMobileBottom, CINEMAX_EXO_ZONES.movieMobile);

    const movieLeftRail = document.querySelector('.movie-ad-left .movie-ad-code');
    if (movieLeftRail) mountExoClickZone(movieLeftRail, CINEMAX_EXO_ZONES.movieLeftRail);
    const movieRightRail = document.querySelector('.movie-ad-right .movie-ad-code');
    if (movieRightRail) mountExoClickZone(movieRightRail, CINEMAX_EXO_ZONES.movieRightRail);
  }

  function remountResponsiveAds() {
    // Slots hidden at the first page load are deliberately skipped. Try again
    // after a breakpoint change so rotating a phone or resizing the window does
    // not leave the newly visible placement empty.
    window.requestAnimationFrame(() => safely('responsive ad remount', mountAllFormatBanners));
  }

  function loadNativeBanner() {
    const movieTarget = document.querySelector('.ad-below-player');
    if (movieTarget) {
      mountExoClickZone(movieTarget, CINEMAX_EXO_ZONES.movieNative);
      return;
    }

    const target = document.querySelector('.ad-zone-home-mid');
    if (!target) return;
    // The former Adsterra native hostname no longer resolves. Reuse the active
    // native provider instead of leaving a permanent placeholder on the page.
    mountExoClickZone(target, CINEMAX_EXO_ZONES.movieNative);
  }

  function loadFullpageInterstitial() {
    // The movie Play button is reserved for the dedicated Popunder unit.
    // Loading Fullpage here would make both formats compete for the same click.
    if (document.querySelector('.video-play-button')) return;

    const zone = CINEMAX_EXO_ZONES.fullpageInterstitial;
    if (document.querySelector(`ins[data-zoneid="${zone.zoneId}"]`)) return;

    if (!document.querySelector(`script[src="${CINEMAX_EXO_FULLPAGE_PROVIDER_SRC}"]`)) {
      const providerScript = document.createElement('script');
      providerScript.async = true;
      providerScript.type = 'application/javascript';
      providerScript.src = CINEMAX_EXO_FULLPAGE_PROVIDER_SRC;
      providerScript.onerror = () => console.warn('CineMax fullpage provider failed to load.');
      document.body.appendChild(providerScript);
    }

    const slot = document.createElement('ins');
    slot.className = zone.className;
    slot.dataset.zoneid = zone.zoneId;
    document.body.appendChild(slot);

    const serveScript = document.createElement('script');
    serveScript.text = '(AdProvider = window.AdProvider || []).push({"serve": {}});';
    document.body.appendChild(serveScript);
  }

  function loadMessagePopup() {
    const zone = CINEMAX_EXO_ZONES.messagePopup;
    if (document.querySelector(`ins[data-zoneid="${zone.zoneId}"]`)) return;

    if (!document.querySelector(`script[src="${CINEMAX_EXO_PROVIDER_SRC}"]`)) {
      const providerScript = document.createElement('script');
      providerScript.async = true;
      providerScript.type = 'application/javascript';
      providerScript.src = CINEMAX_EXO_PROVIDER_SRC;
      providerScript.onerror = () => console.warn('CineMax message popup provider failed to load.');
      document.body.appendChild(providerScript);
    }

    const slot = document.createElement('ins');
    slot.className = zone.className;
    slot.dataset.zoneid = zone.zoneId;
    document.body.appendChild(slot);

    const serveScript = document.createElement('script');
    serveScript.text = '(AdProvider = window.AdProvider || []).push({"serve": {}});';
    document.body.appendChild(serveScript);
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
  onDomReady(() => safely('message popup', loadMessagePopup));
  onDomReady(() => {
    const breakpoint = window.matchMedia('(max-width: 1320px)');
    const mobileBreakpoint = window.matchMedia('(max-width: 768px)');
    if (typeof breakpoint.addEventListener === 'function') {
      breakpoint.addEventListener('change', remountResponsiveAds);
      mobileBreakpoint.addEventListener('change', remountResponsiveAds);
    } else if (typeof breakpoint.addListener === 'function') {
      breakpoint.addListener(remountResponsiveAds);
      mobileBreakpoint.addListener(remountResponsiveAds);
    }
  });

  afterPageLoad(() => {
    if (window.__cinemaxAdsMounted) return;
    window.__cinemaxAdsMounted = true;

    safely('native banner', loadNativeBanner);
    safely('format banners', mountAllFormatBanners);
    safely('fullpage interstitial', loadFullpageInterstitial);
  });
})();
