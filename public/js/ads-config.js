/* CineMax MX - single source of truth for advertising settings. */
window.CINEMAX_AD_CONFIG = Object.freeze({
  debugQuery: 'ad_debug',
  emptyTimeoutMs: 8000,
  breakpoints: {
    mobile: 768,
    movieRails: 1180
  },
  providers: {
    homeNative: 'https://pl30342251.effectivecpmnetwork.com/d0d0a44841736d86ead326116f2d0134/invoke.js',
    socialBar: 'https://pl30309365.effectivecpmnetwork.com/68/55/71/68557162785fb21a64b74f1737d7c4b8.js',
    monetagPush: 'https://5gvci.com/act/files/tag.min.js?z=11351118',
    monetagVignette: 'https://n6wxm.com/vignette.min.js'
  },
  smartlink: {
    enabled: true,
    url: 'https://www.effectivecpmnetwork.com/mdgtfx72cr?key=ddb2f05c770276460358480543facd5a'
  },
  placements: {
    homeFeedNative: { enabled: true, provider: 'homeNative', containerId: 'container-d0d0a44841736d86ead326116f2d0134', pages: ['home'] },
    movieBelowPlayerNative: { enabled: true, provider: 'homeNative', containerId: 'container-d0d0a44841736d86ead326116f2d0134', pages: ['movie'] },
    socialBar: { enabled: true, provider: 'socialBar', pages: ['home', 'movie'] },
    monetagPush: { enabled: true, provider: 'monetagPush', zoneId: '11351118', pages: ['home', 'movie'] },
    monetagVignette: { enabled: true, provider: 'monetagVignette', zoneId: '11351155', pages: ['home', 'movie'] }
  },
  formatBanners: {
    '300x250': { enabled: true, key: 'defd11363035ea0ee41c73133839e9db', width: 300, height: 250 },
    '468x60': { enabled: true, key: 'dfc49ebd2407ec09e0689da4f8a0c34c', width: 468, height: 60 },
    '320x50': { enabled: true, key: '4e485ec0b81fcdb2c2549f73a60b345a', width: 320, height: 50 },
    '728x90': { enabled: true, key: '184e6b9972a56e72cc0c8aca28deb91f', width: 728, height: 90 }
  }
});
