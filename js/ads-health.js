/* CineMax MX - lightweight ad diagnostics. Enable with ?ad_debug=1. */
(() => {
  const config = window.CINEMAX_AD_CONFIG;
  if (!config) return;

  const debug = new URLSearchParams(location.search).get(config.debugQuery) === '1';
  const states = new Map();

  function record(event) {
    const detail = event.detail || {};
    if (!detail.placement) return;
    states.set(detail.placement, { ...detail, time: new Date().toISOString() });
    if (debug) console.info('[CineMax Ads]', detail.placement, detail.status, detail);
  }

  window.addEventListener('cinemax:ad-status', record);
  window.CINEMAX_AD_HEALTH = { debug, states };

  if (!debug) return;
  window.addEventListener('load', () => window.setTimeout(() => {
    const panel = document.createElement('pre');
    panel.id = 'cinemax-ad-debug';
    panel.style.cssText = 'position:fixed;z-index:2147483647;right:8px;bottom:8px;max-width:min(520px,92vw);max-height:45vh;overflow:auto;margin:0;padding:10px;background:#09090dee;color:#8ff;font:11px/1.45 monospace;border:1px solid #2aa;border-radius:8px;white-space:pre-wrap';
    const render = () => {
      panel.textContent = ['CineMax Ads Debug', ...[...states].map(([name, state]) => `${name}: ${state.status}${state.reason ? ` (${state.reason})` : ''}`)].join('\n');
    };
    render();
    document.body.appendChild(panel);
    window.addEventListener('cinemax:ad-status', render);
  }, 1000));
})();
