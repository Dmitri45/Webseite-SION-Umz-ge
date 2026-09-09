const CONTACT_ENDPOINT = '/api/contact';
const form = document.querySelector('#contactForm');
const statusEl = document.querySelector('#formStatus');
const photos = document.querySelector('#photos');
const year = document.querySelector('#year');
const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-navigation');
if (year) year.textContent = new Date().getFullYear();

function setMenu(open) {
  if (!header || !menuToggle) return;
  header.dataset.menuOpen = String(open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
}

if (header && menuToggle && navigation) {
  menuToggle.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenu(false);
      menuToggle.focus();
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1080) setMenu(false);
  });
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = '';
    const files = [...photos.files];
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    if (btn.disabled) return;
    const payload = new FormData(form);
    payload.delete('photos');
    btn.disabled = true;
    form.setAttribute('aria-busy', 'true');
    btn.textContent = 'Anfrage wird gesendet …';
    try {
      const prepared = await PhotoUpload.prepare(files, (current, total) => {
        btn.textContent = 'Fotos werden verarbeitet …';
        statusEl.textContent = `Foto ${current} von ${total} wird verarbeitet …`;
      });
      for (const file of prepared) payload.append('photos', file, file.name);
      btn.textContent = 'Anfrage wird gesendet …';
      statusEl.textContent = 'Ihre Anfrage wird gesendet …';
      const response = await fetch(CONTACT_ENDPOINT, { method: 'POST', body: payload });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Die Anfrage konnte nicht gesendet werden.');
      form.reset();
      statusEl.textContent =
        'Vielen Dank! Ihre Anfrage wurde erfolgreich gesendet. Wir melden uns bei Ihnen.';
    } catch (err) {
      statusEl.textContent = err.message;
    } finally {
      form.removeAttribute('aria-busy');
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}

if (photos) {
  photos.addEventListener('change', () => {
    try {
      PhotoUpload.validateFiles([...photos.files]);
      statusEl.textContent = '';
    } catch (error) {
      statusEl.textContent = error.message;
    }
  });
}
