const PhotoUpload = (() => {
  const MAX_PHOTOS = 15;
  const MAX_TOTAL_BYTES = 12 * 1024 * 1024;
  const MAX_DIMENSION = 1600;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  function validateFiles(files) {
    if (files.length > MAX_PHOTOS) throw new Error('Bitte maximal 15 Bilder auswählen.');
    if (files.some((file) => !ALLOWED_TYPES.includes(file.type))) {
      throw new Error('Bitte JPEG-, PNG- oder WebP-Bilder auswählen. HEIC bitte zuerst umwandeln.');
    }
  }

  async function compressPhoto(file) {
    const url = URL.createObjectURL(file);
    const image = new Image();
    const canvas = document.createElement('canvas');
    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error(`„${file.name}“ konnte nicht gelesen werden.`));
        image.src = url;
      });
      const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Die Bildverarbeitung ist in diesem Browser nicht verfügbar.');
      // JPEG has no transparency: use white rather than a black background.
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      if (!blob) throw new Error(`„${file.name}“ konnte nicht komprimiert werden.`);
      if (scale === 1 && blob.size >= file.size) return file;
      return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
    } finally {
      URL.revokeObjectURL(url);
      image.src = '';
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  async function prepare(files, onProgress = () => {}) {
    validateFiles(files);
    const prepared = [];
    let totalBytes = 0;
    // Decode one image at a time to reduce peak memory use on phones.
    for (const [index, file] of files.entries()) {
      onProgress(index + 1, files.length);
      const compressed = await compressPhoto(file);
      totalBytes += compressed.size;
      if (totalBytes > MAX_TOTAL_BYTES) {
        throw new Error(
          'Die Bilder sind nach der Komprimierung insgesamt größer als 12 MB. Bitte weniger Bilder auswählen.',
        );
      }
      prepared.push(compressed);
    }
    return prepared;
  }

  return { prepare, validateFiles };
})();
