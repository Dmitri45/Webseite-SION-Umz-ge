import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../../js/consent.js', import.meta.url), 'utf8');
function run(saved, blocked = false) {
  const make = () => ({ hidden: true, handlers: {}, addEventListener(k, f) { this.handlers[k] = f; }, focus() {} });
  const accept = make(), reject = make(), settings = make(), banner = make();
  banner.querySelector = (s) => s.includes('reject') ? reject : accept;
  const scripts = [], events = {}, timers = [], jar = new Map();
  if (saved !== undefined) jar.set('sion-consent-v1', saved);
  let reloads = 0;
  const window = { addEventListener(k, f) { events[k] = f; } };
  const context = {
    setTimeout(fn) { timers.push(fn); },
    window, document: { cookie: '', querySelector: (s) => s === '#cookie-banner' ? banner : settings,
      createElement: () => ({}), head: { append(s) { scripts.push(s); } } },
    localStorage: { getItem(k) { if (blocked) throw Error(); return jar.get(k) ?? null; },
      setItem(k, v) { if (blocked) throw Error(); jar.set(k, v); } },
    location: { hostname: 'sionumzuege.de', reload() { reloads++; } },
  };
  vm.runInNewContext(source, context);
  return { window, scripts, banner, jar, events, flush: () => {
    for (const command of window.dataLayer) if (typeof command === 'function') command();
    for (const timer of timers) timer();
  }, timeout: () => timers.forEach((fn) => fn()), accept: () => accept.handlers.click(),
    reject: () => reject.handlers.click(), open: () => settings.handlers.click(), reloads: () => reloads };
}
const saved = (accepted, time = Date.now()) => JSON.stringify({ accepted, time });
test('new visitors and refusals never load Google', () => {
  const r = run(); assert.equal(r.scripts.length, 0); assert.equal(r.banner.hidden, false);
  r.reject(); assert.equal(r.scripts.length, 0); assert.equal(r.banner.hidden, true);
  assert.equal(JSON.parse(r.jar.get('sion-consent-v1')).accepted, false);
});
test('acceptance updates consent before a single tag load; withdrawal reloads without consent', () => {
  const r = run(); r.accept(); r.open(); r.accept();
  assert.equal(r.scripts.length, 1);
  const commands = r.window.dataLayer.map((a) => Array.from(a));
  assert.equal(commands[0][1], 'default');
  const grant = commands.findIndex((a) => a[1] === 'update' && a[2].ad_storage === 'granted');
  assert.ok(grant < commands.findIndex((a) => a[0] === 'config'));
  assert.equal(commands[grant][2].analytics_storage, 'denied');
  r.open(); r.reject(); assert.equal(r.reloads(), 0);
  r.flush(); assert.equal(r.reloads(), 1);
  const next = run(r.jar.get('sion-consent-v1')); assert.equal(next.scripts.length, 0);
});
test('saved choices, expiration, malformed values and unavailable storage fail closed', () => {
  assert.equal(run(saved(true)).scripts.length, 1);
  for (const value of [saved(false), '{', saved(true, 0), saved(true, Date.now() + 100000), '{"accepted":"true"}']) {
    assert.equal(run(value).scripts.length, 0);
  }
  const r = run(undefined, true); assert.equal(r.scripts.length, 0); r.accept(); r.reject(); r.timeout();
  assert.equal(r.reloads(), 1);
});
test('revocation in another tab disables the loaded tag', () => {
  const r = run(saved(true)); r.jar.set('sion-consent-v1', saved(false));
  r.events.storage({ key: 'sion-consent-v1' }); r.flush(); assert.equal(r.reloads(), 1);
});
test('all pages use only the consent loader and offer settings', () => {
  for (const file of ['index.html', 'impressum.html', 'datenschutz.html']) {
    const html = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /googletagmanager\.com|gtag\('config'/);
    assert.equal((html.match(/src="\/js\/consent.js"/g) || []).length, 1);
    assert.match(html, /data-cookie-settings/); assert.match(html, /id="cookie-banner"/);
  }
});

test('lead conversions require active advertising consent and contain no form data', () => {
  const r = run();
  const conversions = () => r.window.dataLayer.filter((a) => a[0] === 'event');
  r.window.trackLeadConversion(); assert.equal(conversions().length, 0);
  r.reject(); r.window.trackLeadConversion(); assert.equal(conversions().length, 0);
  r.accept(); r.window.trackLeadConversion();
  assert.equal(conversions().length, 1);
  assert.equal(conversions()[0][1], 'conversion');
  assert.deepEqual(JSON.parse(JSON.stringify(conversions()[0][2])), {
    send_to: 'AW-18299309565/_tzgCLGytfccEP2b5ZVE', value: 1, currency: 'EUR',
  });
  r.reject(); r.window.trackLeadConversion(); assert.equal(conversions().length, 1);
});
