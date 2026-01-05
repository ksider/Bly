const FIELDS = [
  { name: 'eventName', label: 'Event name', type: 'text' },
  { name: 'eventDate', label: 'Event date', type: 'text' },
  { name: 'eventLocation', label: 'Event location', type: 'text' },
  { name: 'eventLogo', label: 'Event logo URL', type: 'text' },
  { name: 'sponsorLogo', label: 'Sponsor logo (URL or comma-separated)', type: 'text' },
];

export default function EventMetaPanel({ onChange }) {
  const container = document.createElement('section');
  container.className = 'panel';

  const title = document.createElement('h3');
  title.textContent = 'Event Meta';
  container.appendChild(title);

  const form = document.createElement('form');
  form.className = 'pure-form pure-form-stacked';
  container.appendChild(form);

  const grid = document.createElement('div');
  grid.className = 'pure-g';
  form.appendChild(grid);

  const inputs = {};
  FIELDS.forEach((field) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'pure-u-1 pure-u-md-1-2 pure-control-group';
    const label = document.createElement('label');
    label.textContent = field.label;
    label.htmlFor = field.name;
    const input = document.createElement('input');
    input.type = field.type;
    input.id = field.name;
    input.name = field.name;
    input.className = 'pure-input-1';
    input.addEventListener('input', () => {
      const payload = readValues();
      onChange?.(payload);
    });
    wrapper.append(label, input);
    grid.appendChild(wrapper);
    inputs[field.name] = input;
  });

  const hint = document.createElement('p');
  hint.className = 'help-text';
  hint.textContent = 'Values are available in Mustache via {{eventName}}… or nested {{meta.eventName}}.';
  container.appendChild(hint);

  function readValues() {
    const raw = Object.fromEntries(
      Object.entries(inputs).map(([k, el]) => [k, el.value.trim()])
    );
    return {
      ...raw,
      sponsorLogo: raw.sponsorLogo
        ? raw.sponsorLogo.split(',').map((s) => s.trim()).filter(Boolean)
        : '',
    };
  }

  function update(meta = {}) {
    Object.entries(inputs).forEach(([key, el]) => {
      if (key === 'sponsorLogo' && Array.isArray(meta.sponsorLogo)) {
        el.value = meta.sponsorLogo.join(', ');
      } else {
        el.value = meta[key] ?? '';
      }
    });
  }

  return { element: container, update };
}
