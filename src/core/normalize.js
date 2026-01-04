const aliasMap = {
  firstname: 'firstName',
  'first name': 'firstName',
  first_name: 'firstName',
  lastname: 'lastName',
  'last name': 'lastName',
  last_name: 'lastName',
  fullname: 'displayName',
  'display name': 'displayName',
  name: 'displayName',
  role: 'role',
  company: 'company',
  organization: 'company',
  organisation: 'company',
  title: 'title',
  jobtitle: 'title',
  email: 'email',
  mail: 'email',
  qr: 'qrValue',
  qrcode: 'qrValue',
  qrvalue: 'qrValue',
  id: 'id',
  country: 'country',
  city: 'city',
  phone: 'phone',
  badge: 'badgeType',
  badgetype: 'badgeType',
  note: 'note',
  eventname: 'eventName',
  event_date: 'eventDate',
  eventdate: 'eventDate',
  eventlocation: 'eventLocation',
  eventlogo: 'eventLogo',
  sponsorlogo: 'sponsorLogo',
};

function cleanValue(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export function normalizeParticipant(raw) {
  const normalized = {};
  Object.entries(raw || {}).forEach(([key, value]) => {
    const safeKey = key.toLowerCase().trim();
    const target = aliasMap[safeKey];
    if (target) {
      normalized[target] = cleanValue(value);
    } else {
      normalized[safeKey] = cleanValue(value);
    }
  });

  if (!normalized.displayName) {
    const fullName = [normalized.firstName, normalized.lastName].filter(Boolean).join(' ').trim();
    normalized.displayName = fullName || normalized.company || normalized.email || 'Guest';
  }
  if (!normalized.id) {
    normalized.id = crypto.randomUUID?.() ?? Date.now().toString();
  }
  return normalized;
}

export function normalizeList(list) {
  return (list || []).map((item) => normalizeParticipant(item));
}
