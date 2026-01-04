import Mustache from 'mustache';
import templateMeta from '../templates/default/template.json';
import badgeMarkup from '../templates/default/badge.mustache?raw';
import templateStyles from '../templates/default/theme.css?raw';

const templates = {
  default: {
    id: 'default',
    meta: templateMeta,
    markup: badgeMarkup,
    styles: templateStyles,
  },
};

export function listTemplates() {
  return Object.values(templates).map(({ id, meta }) => ({ id, ...meta }));
}

export function getTemplate(id = 'default') {
  return templates[id] || templates.default;
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
  return getTemplate(templateId).styles;
}

export function templateMetaFor(templateId = 'default') {
  const template = getTemplate(templateId);
  return { id: template.id, ...template.meta };
}
