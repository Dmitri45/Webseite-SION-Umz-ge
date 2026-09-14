import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../../js/script.js', import.meta.url), 'utf8');
function setup(fetchResult, trackingFails = false) {
  let submit, tracked = 0, resets = 0;
  const status = {}, button = { textContent: 'Senden', disabled: false };
  const form = { addEventListener(_, fn) { submit = fn; }, querySelector() { return button; },
    setAttribute() {}, removeAttribute() {}, reset() { resets++; } };
  const photos = { files: [], addEventListener() {} };
  vm.runInNewContext(source, {
    document: { querySelector(s) { return ({ '#contactForm': form, '#formStatus': status, '#photos': photos })[s]; } },
    window: { trackLeadConversion() { tracked++; if (trackingFails) throw Error('tracking'); } },
    FormData: class { delete() {} append() {} },
    PhotoUpload: { async prepare() { return []; } },
    fetch: fetchResult,
  });
  return { submit: () => submit({ preventDefault() {} }), status, button,
    tracked: () => tracked, resets: () => resets };
}
test('form tracks once only after the server confirms success; duplicate submits are ignored', async () => {
  let resolve;
  const r = setup(() => new Promise((done) => { resolve = done; }));
  const pending = r.submit(); await Promise.resolve();
  assert.equal(r.tracked(), 0); await r.submit();
  resolve({ ok: true, json: async () => ({}) }); await pending;
  assert.equal(r.tracked(), 1); assert.equal(r.resets(), 1);
});
test('HTTP and network failures never record a conversion', async () => {
  for (const fetch of [async () => ({ ok: false, json: async () => ({ error: 'failed' }) }),
    async () => { throw Error('network'); }]) {
    const r = setup(fetch); await r.submit(); assert.equal(r.tracked(), 0); assert.equal(r.resets(), 0);
  }
});
test('tracking errors do not change successful form feedback', async () => {
  const r = setup(async () => ({ ok: true, json: async () => ({}) }), true);
  await r.submit(); assert.match(r.status.textContent, /erfolgreich gesendet/);
  assert.equal(r.button.disabled, false);
});
