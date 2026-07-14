/* CineMax MX - Ads */
(() => {
  if (window.__cinemaxAdsBootstrapped) return;
  window.__cinemaxAdsBootstrapped = true;

  const config = window.CINEMAX_AD_CONFIG;
  if (!config) {
    console.error('CineMax ads config is missing. Load ads-config.js before ads.js.');
    return;
  }

  const CINEMAX_SMARTLINK_URL = config.smartlink.url;
  const CINEMAX_EXO_POPUNDER_SRC = config.providers.exoPopunder;
  const CINEMAX_EXO_POPUNDER_ID = 'popmagicldr';
  const CINEMAX_EXO_PROVIDER_SRC = config.providers.exoDisplay;
  const CINEMAX_EXO_FULLPAGE_PROVIDER_SRC = config.providers.exoFullpage;
  const CINEMAX_EXO_ZONES = config.placements;
  const CINEMAX_FORMAT_BANNERS = config.formatBanners;
  function report(placement, status, extra = {}) {
    window.dispatchEvent(new CustomEvent('cinemax:ad-status', { detail: { placement, status, ...extra } }));
  }

  function getPageType() {
    return document.querySelector('.video-play-button') ? 'movie' : 'home';
  }

  function isEnabledOnCurrentPage(placement) {
    return !placement.pages || placement.pages.includes(getPageType());
  }

  function checkForEmptyCreative(element, placement) {
    window.setTimeout(() => {
      const frame = element.querySelector('iframe');
      if (!frame) {
        report(placement, 'empty', { reason: 'iframe-missing' });
        return;
      }
      let empty = false;
      try {
        const body = frame.contentDocument?.body;
        const creativeNodes = body ? [...body.children].filter(node => !['SCRIPT', 'STYLE'].includes(node.tagName)) : [];
        empty = !body || creativeNodes.length === 0;
      } catch (_) {
        // A cross-origin frame means the provider navigated away from srcdoc,
        // which is a positive render signal.
        empty = false;
      }
      report(placement, empty ? 'empty' : 'rendered', empty ? { reason: 'blank-iframe' } : {});
      if (empty) element.dataset.adEmpty = 'true';
    }, config.emptyTimeoutMs);
  }

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
    const placement = element?.dataset.adPlacement || `format-${size}`;
    if (!element || !banner || banner.enabled === false || element.dataset.nativeAd === 'true' || element.dataset.formatBannerMounted === 'true') return;
    if (isHiddenAdSlot(element)) {
      report(placement, 'skipped', { reason: 'hidden-by-breakpoint' });
      return;
    }

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

    // HighPerformanceFormat relies on document.write and a page-global
    // `atOptions`. Each placement gets a same-origin parse-time document so
    // options cannot collide and the provider still receives the site URL.
    const frame = document.createElement('iframe');
    frame.className = 'format-ad-frame';
    frame.width = String(banner.width);
    frame.height = String(banner.height);
    frame.scrolling = 'no';
    frame.frameBorder = '0';
    frame.title = 'Publicidad';
    frame.setAttribute('aria-label', `Publicidad ${size}`);
    frame.src = `/ad-frame.html?size=${encodeURIComponent(size)}&v=ads-manager-20260714`;
    frame.addEventListener('load', () => report(placement, 'iframe-loaded', { size }), { once: true });
    element.appendChild(frame);
    report(placement, 'mounted', { size });
    checkForEmptyCreative(element, placement);
  }

  function mountExoClickZone(element, zone, placement = 'exo-zone') {
    if (!element || !zone || zone.enabled === false || element.dataset.exoZoneMounted === 'true') return;
    if (isHiddenAdSlot(element)) {
      report(placement, 'skipped', { reason: 'hidden-by-breakpoint', zoneId: zone.zoneId });
      return;
    }

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
      providerScript.onerror = () => report(placement, 'script-error', { zoneId: zone.zoneId });
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
    report(placement, 'mounted', { zoneId: zone.zoneId, size: zone.size || 'native' });
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
        element.dataset.adPlacement = 'homeCategoryBanner';
        element.classList.remove('ad-slot-disabled');
        mountFormatBanner(element, '468x60');
      } else {
        element.classList.add('ad-slot-disabled');
        element.innerHTML = '';
      }
    });

    const homeRectangle = document.querySelector('.ad-zone-home-feed');
    if (homeRectangle) mountExoClickZone(homeRectangle, CINEMAX_EXO_ZONES.homeRectangle, 'homeRectangle');

    const homeBottom = document.querySelector('.ad-zone-home-bottom');
    if (homeBottom) {
      homeBottom.dataset.adPlacement = 'homeBottomBanner';
      mountFormatBanner(homeBottom, window.matchMedia('(max-width: 768px)').matches ? '320x50' : '728x90');
    }

    const movieMobileTop = document.querySelector('.movie-mobile-ad-top');
    if (movieMobileTop) movieMobileTop.classList.add('ad-slot-disabled');
    const movieMobileBottom = document.querySelector('.movie-mobile-ad-bottom');
    if (movieMobileBottom) mountExoClickZone(movieMobileBottom, CINEMAX_EXO_ZONES.movieMobile, 'movieMobile');

    const movieLeftRail = document.querySelector('.movie-ad-left .movie-ad-code');
    if (movieLeftRail) mountExoClickZone(movieLeftRail, CINEMAX_EXO_ZONES.movieLeftRail, 'movieLeftRail');
    const movieRightRail = document.querySelector('.movie-ad-right .movie-ad-code');
    if (movieRightRail) mountExoClickZone(movieRightRail, CINEMAX_EXO_ZONES.movieRightRail, 'movieRightRail');
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
      mountExoClickZone(movieTarget, CINEMAX_EXO_ZONES.movieNative, 'movieNative');
      return;
    }

    const target = document.querySelector('.ad-zone-home-mid');
    if (!target) return;
    // The former Adsterra native hostname no longer resolves. Reuse the active
    // native provider instead of leaving a permanent placeholder on the page.
    mountExoClickZone(target, CINEMAX_EXO_ZONES.movieNative, 'homeNative');
  }

  function loadFullpageInterstitial() {
    const zone = CINEMAX_EXO_ZONES.fullpageInterstitial;
    if (!zone.enabled || !isEnabledOnCurrentPage(zone)) {
      report('fullpageInterstitial', 'skipped', { reason: `disabled-on-${getPageType()}-page` });
      return;
    }

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
    report('fullpageInterstitial', 'armed', { zoneId: zone.zoneId });
  }

  function loadMessagePopup() {
    const zone = CINEMAX_EXO_ZONES.messagePopup;
    if (!zone.enabled || !isEnabledOnCurrentPage(zone)) {
      report('messagePopup', 'skipped', { reason: `disabled-on-${getPageType()}-page` });
      return;
    }
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
    report('messagePopup', 'armed', { zoneId: zone.zoneId });
  }

  function loadExoPlayPopunder() {
    const popunder = CINEMAX_EXO_ZONES.playPopunder;
    if (!popunder?.enabled || !isEnabledOnCurrentPage(popunder)) {
      report('playPopunder', 'skipped', { reason: `disabled-on-${getPageType()}-page` });
      return;
    }
    if (document.getElementById(CINEMAX_EXO_POPUNDER_ID)) return;

    const script = document.createElement('script');
    script.id = CINEMAX_EXO_POPUNDER_ID;
    script.async = true;
    script.type = 'application/javascript';
    script.src = CINEMAX_EXO_POPUNDER_SRC;
    script.setAttribute('data-exo-idzone', popunder.zoneId);
    script.setAttribute('data-exo-popup_fallback', String(popunder.popupFallback));
    script.setAttribute('data-exo-popup_force', String(popunder.popupForce));
    script.setAttribute('data-exo-chrome_enabled', String(popunder.chromeEnabled));
    script.setAttribute('data-exo-new_tab', String(popunder.newTab));
    script.setAttribute('data-exo-frequency_period', String(popunder.frequencyPeriod));
    script.setAttribute('data-exo-frequency_count', String(popunder.frequencyCount));
    script.setAttribute('data-exo-trigger_method', String(popunder.triggerMethod));
    script.setAttribute('data-exo-trigger_class', popunder.triggerClass);
    script.setAttribute('data-exo-trigger_delay', String(popunder.triggerDelay));
    script.setAttribute('data-exo-capping_enabled', String(popunder.cappingEnabled));
    script.setAttribute('data-exo-tcf_enabled', String(popunder.tcfEnabled));
    script.setAttribute('data-exo-only_inline', String(popunder.onlyInline));
    script.onerror = () => console.warn('CineMax ExoClick play popunder failed to load.');
    document.body.appendChild(script);
    report('playPopunder', 'armed', { zoneId: popunder.zoneId, triggerMethod: popunder.triggerMethod });
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
