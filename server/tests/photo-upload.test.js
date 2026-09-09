import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const source = readFileSync(new URL('../../js/photo-upload.js', import.meta.url), 'utf8');
function browser({ width = 4000, height = 3000, outputSize = 100, broken = false } = {}) {
  let drawn;
  let revoked = 0;
  let encoding;
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      fillRect() {},
      drawImage: (...args) => {
        drawn = args.slice(1);
      },
    }),
    toBlob: (callback, type, quality) => {
      encoding = { type, quality };
      callback(new Blob([new Uint8Array(outputSize)], { type }));
    },
  };
  const context = vm.createContext({
    File,
    Blob,
    URL: {
      createObjectURL: () => 'blob:test',
      revokeObjectURL: () => {
        revoked++;
      },
    },
    Image: class {
      naturalWidth = width;
      naturalHeight = height;
      set src(value) {
        if (value) queueMicrotask(() => (broken ? this.onerror() : this.onload()));
      }
    },
    document: { createElement: () => canvas },
  });
  vm.runInContext(source + '\nglobalThis.upload = PhotoUpload;', context);
  return { upload: context.upload, canvas, state: () => ({ drawn, revoked, encoding }) };
}
const photo = () => new File([new Uint8Array(200)], 'original.png', { type: 'image/png' });

test('resize and JPEG conversion preserve proportions and release resources', async () => {
  const fixture = browser();
  const original = photo();
  const progress = [];
  const [result] = await fixture.upload.prepare([original], (...args) => progress.push(args));
  assert.deepEqual(fixture.state().drawn, [0, 0, 1600, 1200]);
  assert.deepEqual(fixture.state().encoding, { type: 'image/jpeg', quality: 0.8 });
  assert.equal(result.name, 'original.jpg');
  assert.equal(result.type, 'image/jpeg');
  assert.equal(original.size, 200);
  assert.equal(fixture.state().revoked, 1);
  assert.equal(fixture.canvas.width, 0);
  assert.deepEqual(progress, [[1, 1]]);
});
test('small originals are retained when conversion increases size', async () => {
  const fixture = browser({ width: 800, height: 600, outputSize: 300 });
  const original = photo();
  assert.equal((await fixture.upload.prepare([original]))[0], original);
});
test('portrait orientation remains portrait', async () => {
  const fixture = browser({ width: 3000, height: 4000 });
  await fixture.upload.prepare([photo()]);
  assert.deepEqual(fixture.state().drawn, [0, 0, 1200, 1600]);
});
test('count, format and compressed total limits reject invalid selections', async () => {
  const fixture = browser({ outputSize: 7 * 1024 * 1024 });
  await assert.rejects(fixture.upload.prepare(Array.from({ length: 16 }, photo)), /15 Bilder/);
  await assert.rejects(
    fixture.upload.prepare([new File(['x'], 'photo.heic', { type: 'image/heic' })]),
    /HEIC/,
  );
  await assert.rejects(fixture.upload.prepare([photo(), photo()]), /12 MB/);
});
test('unreadable images fail cleanly and release the object URL', async () => {
  const fixture = browser({ broken: true });
  await assert.rejects(fixture.upload.prepare([photo()]), /konnte nicht gelesen/);
  assert.equal(fixture.state().revoked, 1);
});
