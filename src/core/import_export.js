import Papa from 'papaparse';
import Ajv from 'ajv';
import { participantsArraySchema, participantsPayloadSchema } from '../store/schema.js';
import { normalizeList } from './normalize.js';

const ajv = new Ajv({ allErrors: true, coerceTypes: true, allowUnionTypes: true });
const validateParticipants = ajv.compile(participantsArraySchema);
const validatePayload = ajv.compile(participantsPayloadSchema);

export function importFromCSV(text) {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (result.errors?.length) {
    return { participants: [], errors: result.errors };
  }
  const participants = normalizeList(result.data);
  return { participants, errors: [] };
}

export function importFromJSON(text) {
  try {
    const parsed = JSON.parse(text);
    const validPayload = validatePayload(parsed);
    if (!validPayload) {
      return { participants: [], errors: validatePayload.errors || [] };
    }
    const participants =
      Array.isArray(parsed) ? parsed : Array.isArray(parsed.participants) ? parsed.participants : [];
    return { participants: normalizeList(participants), errors: [] };
  } catch (e) {
    return { participants: [], errors: [e] };
  }
}

export function exportToCSV(participants) {
  return Papa.unparse(participants);
}

export function exportToJSON(participants) {
  return JSON.stringify(participants, null, 2);
}
