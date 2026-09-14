(() => {
  'use strict';
  const key = 'sion-consent-v1';
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  const tag = 'AW-18299309565';
  let loaded = false;
  let choice = null;
  let returnFocus;
  const banner = document.querySelector('#cookie-banner');
  const settings = document.querySelector('[data-cookie-settings]');
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  const state = (accepted) => ({
    ad_storage: accepted ? 'granted' : 'denied',
    ad_user_data: accepted ? 'granted' : 'denied',
    ad_personalization: accepted ? 'granted' : 'denied',
    analytics_storage: 'denied',
  });
  window.gtag('consent', 'default', state(false));
  window.trackLeadConversion = () => {
    if (choice !== true || !loaded) return;
    window.gtag('event', 'conversion', {
      send_to: 'AW-18299309565/_tzgCLGytfccEP2b5ZVE',
      value: 1.0,
      currency: 'EUR',
    });
  };

  function readChoice() {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (saved && typeof saved.accepted === 'boolean' &&
          Number.isFinite(saved.time) && saved.time <= Date.now() &&
          Date.now() - saved.time < lifetime) return saved.accepted;
    } catch { /* Storage may be disabled. Default to no consent. */ }
    return null;
  }

  function clearAdCookies() {
    const host = location.hostname.split('.');
    const domains = [''];
    for (let i = 0; i < host.length - 1; i++) domains.push(`; Domain=${host.slice(i).join('.')}`);
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.trim().split('=')[0];
      if (!/^(_gcl_|_gac_)/.test(name)) continue;
      for (const domain of domains) {
        document.cookie = `${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax`;
      }
    }
  }

  function apply(accepted) {
    choice = accepted;
    window.gtag('consent', 'update', state(accepted === true));
    if (accepted === true && !loaded) {
      loaded = true;
      window.gtag('js', new Date());
      window.gtag('config', tag);
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${tag}`;
      document.head.append(script);
    } else if (accepted !== true) {
      clearAdCookies();
      if (loaded) {
        // Process the consent update before unloading the Google runtime.
        // The timeout also handles a blocked or still-loading Google script.
        let reloaded = false;
        const reload = () => {
          if (reloaded) return;
          reloaded = true;
          clearAdCookies();
          location.reload();
        };
        setTimeout(reload, 500);
        window.dataLayer.push(function () { reload(); });
      }
    }
  }

  function close() {
    banner.hidden = true;
    if (returnFocus) returnFocus.focus();
  }
  function choose(accepted) {
    try { localStorage.setItem(key, JSON.stringify({ accepted, time: Date.now() })); }
    catch { /* The choice still applies for this page. */ }
    apply(accepted);
    close();
  }
  settings.hidden = false;
  settings.addEventListener('click', () => {
    returnFocus = settings;
    banner.hidden = false;
    banner.querySelector('[data-cookie-reject]').focus();
  });
  banner.querySelector('[data-cookie-accept]').addEventListener('click', () => choose(true));
  banner.querySelector('[data-cookie-reject]').addEventListener('click', () => choose(false));
  banner.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && choice !== null) close();
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== key && event.key !== null) return;
    apply(readChoice());
    banner.hidden = choice !== null;
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      apply(readChoice());
      banner.hidden = choice !== null;
    }
  });
  apply(readChoice());
  banner.hidden = choice !== null;
})();
