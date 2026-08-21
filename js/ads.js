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
  const CINEMAX_SOCIAL_BAR_SRC = config.providers.socialBar;
  const CINEMAX_SOCIAL_BAR_ID = 'cinemax-social-bar';
  const CINEMAX_HILLTOPADS_POPUNDER_ID = 'cinemax-hilltopads-popunder';
  const CINEMAX_VIDEO_SLIDER_ID = 'cinemax-video-slider';
  const CINEMAX_MONETAG_PUSH_ID = 'cinemax-monetag-push';
  const CINEMAX_MONETAG_VIGNETTE_ID = 'cinemax-monetag-vignette';
  const CINEMAX_MONETAG_IN_PAGE_PUSH_ID = 'cinemax-monetag-in-page-push';
  const CINEMAX_PLACEMENTS = config.placements;
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

    // Each format uses a static same-origin document containing the provider's
    // parse-time snippet verbatim. This keeps atOptions isolated per banner.
    const frame = document.createElement('iframe');
    frame.className = 'format-ad-frame';
    frame.width = String(banner.width);
    frame.height = String(banner.height);
    frame.scrolling = 'no';
    frame.frameBorder = '0';
    frame.title = 'Publicidad';
    frame.setAttribute('aria-label', `Publicidad ${size}`);
    frame.src = `/ad-${encodeURIComponent(size)}.html?v=ads-static-20260714`;
    frame.addEventListener('load', () => report(placement, 'iframe-loaded', { size }), { once: true });
    element.appendChild(frame);
    report(placement, 'mounted', { size });
    checkForEmptyCreative(element, placement);
  }

  function mountAdsterraNative(element, placement, native) {
    if (!element || !native?.enabled || element.dataset.nativeMounted === 'true') return;
    if (isHiddenAdSlot(element)) {
      report(placement, 'skipped', { reason: 'hidden-by-breakpoint' });
      return;
    }

    const providerSrc = config.providers[native.provider];
    if (!providerSrc || !native.containerId) {
      report(placement, 'skipped', { reason: 'native-provider-config-missing' });
      return;
    }

    element.dataset.nativeMounted = 'true';
    element.dataset.homeNativeMounted = 'true';
    element.dataset.nativeAd = 'true';
    element.dataset.nativePlacement = placement;
    element.classList.remove('ad-clickable', 'ad-fixed-slot');
    element.removeAttribute('role');
    element.removeAttribute('tabindex');
    element.removeAttribute('aria-label');
    element.style.removeProperty('--ad-w');
    element.style.removeProperty('--ad-h');
    element.innerHTML = '';

    // Adsterra native snippets use a fixed container id. Each placement runs
    // inside its own document so the same zone can safely appear more than once
    // without duplicate ids, globals or provider styles colliding.
    const frame = document.createElement('iframe');
    frame.className = 'native-ad-frame';
    frame.title = 'Publicidad';
    frame.loading = 'lazy';
    frame.scrolling = 'no';
    frame.frameBorder = '0';
    frame.setAttribute('aria-label', `Publicidad ${placement}`);
    frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>html,body{margin:0;padding:0;width:100%;overflow:hidden;background:transparent}*{box-sizing:border-box}#${native.containerId}{width:100%;max-width:100%;overflow:hidden}</style></head><body><div id="${native.containerId}"></div><script async data-cfasync="false" src="${providerSrc}"><\/script></body></html>`;
    element.appendChild(frame);
    report(placement, 'mounted');

    const startedAt = Date.now();
    const minHeight = config.nativeFrame?.minHeight || 140;
    const maxHeight = config.nativeFrame?.maxHeight || 1200;
    const syncFrameHeight = () => {
      try {
        const doc = frame.contentDocument;
        const container = doc?.getElementById(native.containerId);
        const height = Math.ceil(Math.max(
          minHeight,
          container?.scrollHeight || 0,
          doc?.body?.scrollHeight || 0,
          doc?.documentElement?.scrollHeight || 0
        ));
        frame.style.height = `${Math.min(height, maxHeight)}px`;
        const rendered = Boolean(container?.children.length || container?.querySelector('iframe, img, a'));
        if (rendered && element.dataset.nativeRendered !== 'true') {
          element.dataset.nativeRendered = 'true';
          report(placement, 'rendered');
        }
        if (Date.now() - startedAt < config.emptyTimeoutMs) {
          window.setTimeout(syncFrameHeight, 300);
        } else if (!rendered) {
          element.dataset.adEmpty = 'true';
          report(placement, 'empty', { reason: 'provider-returned-no-content' });
        }
      } catch (error) {
        report(placement, 'resize-skipped', { reason: 'native-frame-inaccessible' });
      }
    };
    frame.addEventListener('load', syncFrameHeight, { once: true });
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
    const isCompactMovie = window.matchMedia(`(max-width: ${config.breakpoints.movieRails}px)`).matches;
    categorySlots.forEach((element, index) => {
      const placement = `homeCategoryNative-${index + 1}`;
      element.dataset.adPlacement = placement;
      element.classList.remove('ad-slot-disabled');
      mountAdsterraNative(element, placement, CINEMAX_PLACEMENTS.homeCategoryNative);
    });

    document.querySelectorAll('.ad-zone-home-feed').forEach((element, index) => {
      mountAdsterraNative(element, `homeFeedNative-${index + 1}`, CINEMAX_PLACEMENTS.homeFeedNative);
    });

    const homeBottom = document.querySelector('.ad-zone-home-bottom');
    if (homeBottom) {
      homeBottom.dataset.adPlacement = 'homeBottomBanner';
      mountFormatBanner(homeBottom, window.matchMedia('(max-width: 768px)').matches ? '320x50' : '728x90');
    }

    const movieMobileBottom = document.querySelector('.movie-mobile-ad-bottom');
    if (movieMobileBottom) {
      const description = document.querySelector('.movie-desc');
      if (description && movieMobileBottom.previousElementSibling !== description) {
        description.insertAdjacentElement('afterend', movieMobileBottom);
      }
      movieMobileBottom.dataset.adPlacement = 'movieAfterDescription';
      if (isCompactMovie) {
        movieMobileBottom.classList.remove('ad-slot-disabled');
        mountFormatBanner(movieMobileBottom, '320x50');
      } else {
        movieMobileBottom.classList.add('ad-slot-disabled');
      }
    }

    const leftRail = document.querySelector('.movie-ad-left .movie-ad-code');
    if (leftRail) mountAdsterraNative(leftRail, 'movieLeftRailNative', CINEMAX_PLACEMENTS.movieLeftRailNative);
    const rightRail = document.querySelector('.movie-ad-right .movie-ad-code');
    if (rightRail) mountAdsterraNative(rightRail, 'movieRightRailNative', CINEMAX_PLACEMENTS.movieRightRailNative);

    document.querySelectorAll('.legal-native-ad').forEach((element, index) => {
      mountAdsterraNative(element, `legalNative-${index + 1}`, CINEMAX_PLACEMENTS.legalNative);
    });
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
      movieTarget.dataset.adPlacement = 'movieBelowPlayerNative';
      mountAdsterraNative(movieTarget, 'movieBelowPlayerNative', CINEMAX_PLACEMENTS.movieBelowPlayerNative);
    }
  }

  function loadSocialBar() {
    const socialBar = CINEMAX_PLACEMENTS.socialBar;
    if (!socialBar?.enabled || !isEnabledOnCurrentPage(socialBar)) {
      report('socialBar', 'skipped', { reason: `disabled-on-${getPageType()}-page` });
      return;
    }
    if (document.getElementById(CINEMAX_SOCIAL_BAR_ID)) return;

    const script = document.createElement('script');
    script.id = CINEMAX_SOCIAL_BAR_ID;
    script.async = true;
    script.type = 'application/javascript';
    script.src = CINEMAX_SOCIAL_BAR_SRC;
    script.onload = () => report('socialBar', 'script-loaded', { provider: 'effectivecpmnetwork' });
    script.onerror = () => report('socialBar', 'script-error', { provider: 'effectivecpmnetwork' });
    document.body.appendChild(script);
    report('socialBar', 'armed', { provider: 'effectivecpmnetwork' });
  }

  function loadHilltopadsPopunder() {
    const placement = CINEMAX_PLACEMENTS.hilltopadsPopunder;
    const providerSrc = config.providers.hilltopadsPopunder;
    if (!placement?.enabled || !providerSrc) return;
    if (document.getElementById(CINEMAX_HILLTOPADS_POPUNDER_ID)) return;

    // HilltopAds' popunder tag expects its settings before the provider script loads.
    const script = document.createElement('script');
    script.id = CINEMAX_HILLTOPADS_POPUNDER_ID;
    script.settings = {};
    script.src = providerSrc;
    script.async = true;
    script.referrerPolicy = 'no-referrer-when-downgrade';
    script.onload = () => report('hilltopadsPopunder', 'script-loaded', { provider: 'hilltopads' });
    script.onerror = () => report('hilltopadsPopunder', 'script-error', { provider: 'hilltopads' });
    document.head.appendChild(script);
    report('hilltopadsPopunder', 'armed', { provider: 'hilltopads' });
  }

  function loadVideoSlider() {
    const placement = CINEMAX_PLACEMENTS.videoSlider;
    const providerSrc = config.providers.videoSlider;
    if (!placement?.enabled || !providerSrc) return;
    if (document.getElementById(CINEMAX_VIDEO_SLIDER_ID)) return;

    const script = document.createElement('script');
    script.id = CINEMAX_VIDEO_SLIDER_ID;
    script.settings = {};
    script.src = providerSrc;
    script.async = true;
    script.referrerPolicy = 'no-referrer-when-downgrade';
    script.onload = () => report('videoSlider', 'script-loaded', { provider: 'hilltopads' });
    script.onerror = () => report('videoSlider', 'script-error', { provider: 'hilltopads' });
    document.head.appendChild(script);
    report('videoSlider', 'armed', { provider: 'hilltopads' });
  }

  function loadMonetagPush() {
    const placement = CINEMAX_PLACEMENTS.monetagPush;
    if (!placement?.enabled || !isEnabledOnCurrentPage(placement)) return;
    if (document.getElementById(CINEMAX_MONETAG_PUSH_ID)) return;

    const script = document.createElement('script');
    script.id = CINEMAX_MONETAG_PUSH_ID;
    script.async = true;
    script.dataset.cfasync = 'false';
    script.src = config.providers.monetagPush;
    script.onload = () => report('monetagPush', 'script-loaded', { provider: 'monetag', zoneId: placement.zoneId });
    script.onerror = () => report('monetagPush', 'script-error', { provider: 'monetag', zoneId: placement.zoneId });
    document.body.appendChild(script);
    report('monetagPush', 'armed', { provider: 'monetag', zoneId: placement.zoneId });
  }

  function loadMonetagVignette() {
    const placement = CINEMAX_PLACEMENTS.monetagVignette;
    if (!placement?.enabled || !isEnabledOnCurrentPage(placement)) return;
    if (document.getElementById(CINEMAX_MONETAG_VIGNETTE_ID)) return;

    const script = document.createElement('script');
    script.id = CINEMAX_MONETAG_VIGNETTE_ID;
    script.dataset.zone = placement.zoneId;
    script.src = config.providers.monetagVignette;
    script.onload = () => report('monetagVignette', 'script-loaded', { provider: 'monetag', zoneId: placement.zoneId });
    script.onerror = () => report('monetagVignette', 'script-error', { provider: 'monetag', zoneId: placement.zoneId });
    document.body.appendChild(script);
    report('monetagVignette', 'armed', { provider: 'monetag', zoneId: placement.zoneId });
  }

  function loadMonetagInPagePush() {
    const placement = CINEMAX_PLACEMENTS.monetagInPagePush;
    if (!placement?.enabled || !isEnabledOnCurrentPage(placement)) return;
    if (document.getElementById(CINEMAX_MONETAG_IN_PAGE_PUSH_ID)) return;

    const script = document.createElement('script');
    script.id = CINEMAX_MONETAG_IN_PAGE_PUSH_ID;
    script.dataset.zone = placement.zoneId;
    script.src = config.providers.monetagInPagePush;
    script.onload = () => report('monetagInPagePush', 'script-loaded', { provider: 'monetag', zoneId: placement.zoneId });
    script.onerror = () => report('monetagInPagePush', 'script-error', { provider: 'monetag', zoneId: placement.zoneId });
    (document.body || document.documentElement).appendChild(script);
    report('monetagInPagePush', 'armed', { provider: 'monetag', zoneId: placement.zoneId });
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
  onDomReady(() => safely('social bar', loadSocialBar));
  onDomReady(() => safely('HilltopAds popunder', loadHilltopadsPopunder));
  onDomReady(() => safely('video slider', loadVideoSlider));
  onDomReady(() => safely('Monetag push notifications', loadMonetagPush));
  onDomReady(() => safely('Monetag vignette banner', loadMonetagVignette));
  onDomReady(() => safely('Monetag in-page push', loadMonetagInPagePush));
  onDomReady(() => {
    window.addEventListener('cinemax:ads-refresh', () => safely('dynamic native ads refresh', mountAllFormatBanners));
  });
  onDomReady(() => {
    const breakpoint = window.matchMedia(`(max-width: ${config.breakpoints.movieRails}px)`);
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
  });
})();
