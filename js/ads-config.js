/* CineMax MX - single source of truth for advertising settings. */
window.CINEMAX_AD_CONFIG = Object.freeze({
  debugQuery: 'ad_debug',
  emptyTimeoutMs: 8000,
  breakpoints: {
    mobile: 768,
    movieRails: 1180
  },
  providers: {
    exoDisplay: 'https://a.magsrv.com/ad-provider.js',
    exoFullpage: 'https://a.pemsrv.com/ad-provider.js',
    socialBar: 'https://pl30309365.effectivecpmnetwork.com/68/55/71/68557162785fb21a64b74f1737d7c4b8.js',
    popunder: 'https://pl30309364.effectivecpmnetwork.com/1d/86/38/1d8638ca8e45a4479b2a0d59d09d9c0c.js'
  },
  smartlink: {
    enabled: true,
    url: 'https://www.effectivecpmnetwork.com/mdgtfx72cr?key=ddb2f05c770276460358480543facd5a'
  },
  placements: {
    fullpageInterstitial: { enabled: true, provider: 'exoFullpage', zoneId: '5969616', className: 'eas6a97888e33', pages: ['home'] },
    messagePopup: { enabled: true, provider: 'exoDisplay', zoneId: '5971714', className: 'eas6a97888e14', pages: ['home', 'movie'] },
    movieNative: { enabled: true, provider: 'exoDisplay', zoneId: '5973194', className: 'eas6a97888e20' },
    homeRectangle: { enabled: true, provider: 'exoDisplay', zoneId: '5973184', className: 'eas6a97888e10', size: '300x250' },
    movieMobile: { enabled: true, provider: 'exoDisplay', zoneId: '5973186', className: 'eas6a97888e10', size: '300x50' },
    movieLeftRail: { enabled: true, provider: 'exoDisplay', zoneId: '5973188', className: 'eas6a97888e2', size: '160x600', minWidth: 1181 },
    movieRightRail: { enabled: true, provider: 'exoDisplay', zoneId: '5971764', className: 'eas6a97888e2', size: '160x600', minWidth: 1181 },
    socialBar: { enabled: true, provider: 'socialBar', pages: ['home', 'movie'] },
    playPopunder: { enabled: true, provider: 'popunder', pages: ['home', 'movie'] }
  },
  formatBanners: {
    '300x250': { enabled: true, key: 'defd11363035ea0ee41c73133839e9db', width: 300, height: 250 },
    '468x60': { enabled: true, key: 'dfc49ebd2407ec09e0689da4f8a0c34c', width: 468, height: 60 },
    '320x50': { enabled: true, key: '4e485ec0b81fcdb2c2549f73a60b345a', width: 320, height: 50 },
    '728x90': { enabled: true, key: '184e6b9972a56e72cc0c8aca28deb91f', width: 728, height: 90 }
  }
});
