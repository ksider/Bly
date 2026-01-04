import { defaultState, storageKey } from './schema.js';

const listeners = new Set();

function readStorage() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { ...defaultState, participants: [] };
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch (e) {
    console.warn('Failed to read storage, using defaults', e);
    return { ...defaultState, participants: [] };
  }
}

let state = readStorage();

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (e) {
    console.warn('Unable to persist project', e);
  }
}

function notify() {
  listeners.forEach((cb) => cb(getState()));
}

export function getState() {
  return structuredClone ? structuredClone(state) : JSON.parse(JSON.stringify(state));
}

export function setTemplate(templateId) {
  state.templateId = templateId;
  persist();
  notify();
}

export function setTableColumns(columns) {
  const unique = Array.from(new Set(columns || []));
  if (!unique.includes('displayName')) unique.unshift('displayName');
  state.tableColumns = unique;
  persist();
  notify();
}

export function setPageSettings(settings) {
  state.pageSettings = { ...state.pageSettings, ...settings };
  persist();
  notify();
}

export function setBadgeSettings(settings) {
  state.badgeSettings = { ...state.badgeSettings, ...settings };
  persist();
  notify();
}

export function setParticipants(list) {
  state.participants = [...list];
  persist();
  notify();
}

export function addParticipant(participant) {
  const participantWithId = {
    id: participant.id ?? crypto.randomUUID?.() ?? Date.now().toString(),
    ...participant,
  };
  state.participants = [...state.participants, participantWithId];
  persist();
  notify();
}

export function updateParticipant(id, updates) {
  state.participants = state.participants.map((p) =>
    String(p.id) === String(id) ? { ...p, ...updates } : p
  );
  persist();
  notify();
}

export function deleteParticipant(id) {
  state.participants = state.participants.filter((p) => String(p.id) !== String(id));
  persist();
  notify();
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function resetProject() {
  state = { ...defaultState, participants: [] };
  persist();
  notify();
}
