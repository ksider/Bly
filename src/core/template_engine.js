import Mustache from 'mustache';

const metaModules = import.meta.glob('../templates/*/template.json', { eager: true });
const markupModules = import.meta.glob('../templates/*/badge.mustache', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const styleModules = import.meta.glob('../templates/*/theme.css', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function toStringModule(mod) {
  if (typeof mod === 'string') return mod;
  if (mod && typeof mod.default === 'string') return mod.default;
  return '';
}

function buildTemplates() {
  const entries = Object.entries(metaModules).map(([path, mod]) => {
    const match = path.match(/..\/templates\/([^/]+)\//);
    if (!match) return null;
    const id = match[1];
    const meta = mod?.default ?? mod;
    const markup = toStringModule(markupModules[`../templates/${id}/badge.mustache`]);
    const styles = toStringModule(styleModules[`../templates/${id}/theme.css`]);
    return [id, { id, meta, markup, styles }];
  });
  const map = {};
  entries.filter(Boolean).forEach(([id, tpl]) => {
    map[id] = tpl;
  });
  return map;
}

const templates = buildTemplates();

export function listTemplates() {
  return Object.values(templates).map(({ id, meta }) => ({ id, ...meta }));
}

export function getTemplate(id = 'default') {
  return templates[id] || templates.default || Object.values(templates)[0];
}

export function usedFields(templateId = 'default') {
  const template = getTemplate(templateId);
  const markup = template?.markup || '';
  const regex = /{{\s*#?\/?([\w]+)[^}]*}}/g;
  const names = new Set();
  let match;
  while ((match = regex.exec(markup))) {
    const name = match[1];
    if (name && name !== 'else') names.add(name);
  }
  return Array.from(names);
}

export function renderBadge(participant, templateId = 'default') {
  const template = getTemplate(templateId);
  return Mustache.render(template.markup, participant);
}

export function templateStylesFor(templateId = 'default') {
  return getTemplate(templateId)?.styles || '';
}

export function templateMetaFor(templateId = 'default') {
  const template = getTemplate(templateId);
  if (!template) return { id: templateId };
  return { id: template.id, ...template.meta };
}
