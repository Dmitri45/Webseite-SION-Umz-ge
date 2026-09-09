import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';

process.env.BREVO_API_KEY = 'test-key';
process.env.BREVO_TEMPLATE_ID = '3';
process.env.MAIL_FROM = 'sender@example.com';
process.env.MAIL_TO = 'recipient@example.com';
const { default: app } = await import('../app.js');
const { config } = await import('../config/env.js');
const nativeFetch = globalThis.fetch;

function contactForm() {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    name: '<Test>',
    email: 'test@example.com',
    phone: '123456',
    fromAddress: 'Düsseldorf',
    toAddress: 'Neuss',
  }))
    form.append(key, value);
  return form;
}

test('contact API preserves responses and email contents', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => {
    globalThis.fetch = nativeFetch;
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const submit = (body) => nativeFetch(`${base}/api/contact`, { method: 'POST', body });
  let mail;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
    mail = JSON.parse(options.body);
    return new Response('{}', { status: 201 });
  };

  await t.test('homepage is served', async () => {
    const response = await nativeFetch(base);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /SION Umzüge/);
  });
  await t.test('required fields return 400', async () => {
    const response = await submit(new FormData());
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, 'Bitte alle Pflichtfelder ausfüllen.');
  });
  await t.test('email uses template 3 with parameters and attachment', async () => {
    const form = contactForm();
    form.append('services', 'Montage');
    form.append('services', 'Transport');
    form.append('photos', new Blob(['photo'], { type: 'image/jpeg' }), 'photo.jpg');
    const response = await submit(form);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(mail.templateId, 3);
    assert.equal(mail.htmlContent, undefined);
    assert.equal(mail.params.name, '<Test>');
    assert.equal(mail.params.services, 'Montage, Transport');
    assert.equal(mail.params.date, '–');
    assert.equal(mail.params.fromAddress, 'Düsseldorf');
    assert.equal(Object.keys(mail.params).length, 20);
    assert.equal(mail.replyTo.email, 'test@example.com');
    assert.deepEqual(mail.to, [{ email: 'recipient@example.com' }]);
    assert.deepEqual(mail.sender, {
      name: 'SION Umzüge Website',
      email: 'sender@example.com',
    });
    assert.deepEqual(mail.attachment, [{ name: 'photo.jpg', content: 'cGhvdG8=' }]);
  });
  await t.test('too many photos return JSON error', async () => {
    const form = contactForm();
    for (let i = 0; i < 16; i++)
      form.append('photos', new Blob(['x'], { type: 'image/jpeg' }), `${i}.jpg`);
    const response = await submit(form);
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /Upload fehlgeschlagen/);
  });
  await t.test('15 photos are accepted', async () => {
    const form = contactForm();
    for (let i = 0; i < 15; i++) {
      form.append('photos', new Blob(['x'], { type: 'image/jpeg' }), `${i}.jpg`);
    }
    assert.equal((await submit(form)).status, 200);
    assert.equal(mail.attachment.length, 15);
  });
  await t.test('combined size limit is enforced before sending email', async () => {
    const previousMail = mail;
    const form = contactForm();
    for (let i = 0; i < 2; i++) {
      form.append(
        'photos',
        new Blob([new Uint8Array(6 * 1024 * 1024 + 1)], { type: 'image/jpeg' }),
        `${i}.jpg`,
      );
    }
    const response = await submit(form);
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /insgesamt maximal 12 MB/);
    assert.equal(mail, previousMail);
  });
  await t.test('unsupported formats are rejected rather than silently dropped', async () => {
    const form = contactForm();
    form.append('photos', new Blob(['x'], { type: 'image/heic' }), 'photo.heic');
    const response = await submit(form);
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /JPEG/);
  });
  await t.test('Brevo failure returns 502', async () => {
    globalThis.fetch = async () => new Response('test failure', { status: 503 });
    const response = await submit(contactForm());
    assert.equal(response.status, 502);
    assert.equal((await response.json()).error, 'E-Mail konnte nicht versendet werden.');
  });
  await t.test('missing configuration returns 500', async () => {
    const originalKey = config.mail.apiKey;
    try {
      config.mail.apiKey = '';
      const response = await submit(contactForm());
      assert.equal(response.status, 500);
      assert.equal((await response.json()).error, 'E-Mail-Versand ist noch nicht konfiguriert.');
    } finally {
      config.mail.apiKey = originalKey;
    }
  });

  await t.test('missing sender configuration returns 500', async () => {
    const originalFrom = config.mail.from;
    try {
      config.mail.from = '';
      const response = await submit(contactForm());
      assert.equal(response.status, 500);
      assert.equal((await response.json()).error, 'E-Mail-Versand ist noch nicht konfiguriert.');
    } finally {
      config.mail.from = originalFrom;
    }
  });
});
