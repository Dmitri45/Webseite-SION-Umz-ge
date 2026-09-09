const FIELDS = [
  'name',
  'email',
  'phone',
  'date',
  'fromAddress',
  'fromFloor',
  'fromElevator',
  'fromParking',
  'fromStairs',
  'toAddress',
  'toFloor',
  'toElevator',
  'toParking',
  'toStairs',
  'boxesNeeded',
  'boxesNeededCount',
  'ownBoxes',
  'ownBoxesCount',
  'message',
];

export function buildContactParams(formData) {
  const params = Object.fromEntries(
    FIELDS.map((field) => [field, String(formData[field] ?? '').trim() || '–']),
  );
  const services = Array.isArray(formData.services)
    ? formData.services
    : formData.services
      ? [formData.services]
      : [];
  params.services = services.map(String).join(', ') || '–';
  return params;
}
