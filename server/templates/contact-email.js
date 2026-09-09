const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );

export function buildContactEmail(formData) {
  const services = Array.isArray(formData.services)
    ? formData.services
    : formData.services
      ? [formData.services]
      : [];
  const rows = [
    ['Name', formData.name],
    ['E-Mail', formData.email],
    ['Telefon', formData.phone],
    ['Wunschtermin', formData.date],
    ['Auszug', formData.fromAddress],
    ['Etage Auszug', formData.fromFloor],
    ['Aufzug Auszug', formData.fromElevator],
    ['Parken Auszug', formData.fromParking],
    ['Treppenhaus Auszug', formData.fromStairs],
    ['Einzug', formData.toAddress],
    ['Etage Einzug', formData.toFloor],
    ['Aufzug Einzug', formData.toElevator],
    ['Parken Einzug', formData.toParking],
    ['Treppenhaus Einzug', formData.toStairs],
    ['Leistungen', services.join(', ') || '–'],
    ['Kartons von SION', `${formData.boxesNeeded || '–'} / ${formData.boxesNeededCount || 0}`],
    ['Eigene Kartons', `${formData.ownBoxes || '–'} / ${formData.ownBoxesCount || 0}`],
    ['Nachricht', formData.message || '–'],
  ];
  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td><b>${escapeHtml(label)}</b></td><td>${escapeHtml(value)}</td></tr>`,
    )
    .join('');

  return `<h2>Neue Umzugsanfrage</h2><table cellpadding="7">${tableRows}</table>`;
}
