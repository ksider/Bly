export const storageKey = 'badge-maker-project';

export const paperPresets = {
  A4: { widthMm: 210, heightMm: 297 },
  Letter: { widthMm: 215.9, heightMm: 279.4 },
};

export const badgePresets = {
  '90x55': { widthMm: 90, heightMm: 55 },
  '100x70': { widthMm: 100, heightMm: 70 },
  A6: { widthMm: 148, heightMm: 105 },
};

export const defaultState = {
  participants: [],
  pageSettings: {
    paperSize: 'A4',
    customWidthMm: 210,
    customHeightMm: 297,
    orientation: 'portrait',
    marginTopMm: 10,
    marginRightMm: 10,
    marginBottomMm: 10,
    marginLeftMm: 10,
  },
  badgeSettings: {
    sizePreset: '90x55',
    customWidthMm: 90,
    customHeightMm: 55,
    orientation: 'landscape',
    gapXmm: 4,
    gapYmm: 4,
    autoGrid: true,
  },
  templateId: 'default',
  tableColumns: ['displayName'],
};

export const participantSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    id: { type: ['string', 'number'] },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    displayName: { type: 'string' },
    role: { type: 'string' },
    company: { type: 'string' },
    title: { type: 'string' },
    email: { type: 'string' },
    qrValue: { type: 'string' },
    country: { type: 'string' },
    city: { type: 'string' },
    phone: { type: 'string' },
    badgeType: { type: 'string' },
    note: { type: 'string' },
    eventName: { type: 'string' },
    eventDate: { type: 'string' },
    eventLocation: { type: 'string' },
    eventLogo: { type: 'string' },
    sponsorLogo: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
  },
};

export const participantsArraySchema = {
  type: 'array',
  items: participantSchema,
};

export const participantsPayloadSchema = {
  anyOf: [
    participantsArraySchema,
    {
      type: 'object',
      properties: {
        participants: participantsArraySchema,
        meta: { type: 'object', additionalProperties: true },
      },
      required: ['participants'],
      additionalProperties: true,
    },
  ],
};
