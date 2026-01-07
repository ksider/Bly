import { listTemplates } from '../../core/template_engine.js';

export default function TemplatePicker({ onSelect }) {
  const container = document.createElement('section');
  container.className = 'panel';

  const heading = document.createElement('h3');
  heading.textContent = 'Template';
  container.appendChild(heading);

  const playgroundLink = document.createElement('a');
  playgroundLink.href = '/template-playground/index.html';
  playgroundLink.target = '_blank';
  playgroundLink.rel = 'noreferrer';
  playgroundLink.textContent = 'Open template playground';
  playgroundLink.className = 'help-text';
  container.appendChild(playgroundLink);

  const select = document.createElement('select');
  select.className = 'pure-input-1';

  const templates = listTemplates();
  templates.forEach((tpl) => {
    const option = document.createElement('option');
    option.value = tpl.id;
    option.textContent = `${tpl.name} (${tpl.size})`;
    select.appendChild(option);
  });

  select.addEventListener('change', () => onSelect?.(select.value));
  container.appendChild(select);

  const description = document.createElement('p');
  description.className = 'help-text';
  container.appendChild(description);

  const sandbox = document.createElement('p');
  sandbox.className = 'help-text';
  sandbox.innerHTML =
    'Template sandbox: <a href="https://codepen.io/ksider/pen/bNeEyPr" target="_blank" rel="noreferrer">open in CodePen</a>';
  container.appendChild(sandbox);

  function update(templateId) {
    select.value = templateId;
    const selected = templates.find((t) => t.id === templateId) || templates[0];
    description.textContent = selected?.description || '';
  }

  update(templates[0]?.id);

  return { element: container, update };
}
