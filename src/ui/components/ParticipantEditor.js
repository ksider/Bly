const fieldConfig = {
  id: { label: 'ID', type: 'text', placeholder: 'auto if empty' },
  firstName: { label: 'First Name', type: 'text' },
  lastName: { label: 'Last Name', type: 'text' },
  displayName: { label: 'Display Name', type: 'text' },
  role: { label: 'Role', type: 'text', placeholder: 'Speaker/Attendee/Organizer' },
  company: { label: 'Company', type: 'text' },
  title: { label: 'Title', type: 'text' },
  country: { label: 'Country', type: 'text' },
  city: { label: 'City', type: 'text' },
  email: { label: 'Email', type: 'email' },
  phone: { label: 'Phone', type: 'text' },
  qrValue: { label: 'QR Value', type: 'text', placeholder: 'URL / ID / vCard' },
  badgeType: { label: 'Badge Type', type: 'text', placeholder: 'staff / guest / vip' },
  note: { label: 'Note', type: 'text' },
  eventName: { label: 'Event Name', type: 'text' },
  eventDate: { label: 'Event Date', type: 'text' },
  eventLocation: { label: 'Event Location', type: 'text' },
  eventLogo: { label: 'Event Logo URL', type: 'text' },
  sponsorLogo: { label: 'Sponsor Logo (URL or comma-separated)', type: 'text' },
};

const requiredFields = ['id', 'firstName', 'lastName'];

export default function ParticipantEditor({ onSave, onCancel }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay hidden';

  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog panel';
  overlay.appendChild(dialog);

  dialog.innerHTML = `
    <div class="modal-header">
      <h3 id="editor-title">Add Participant</h3>
      <button class="pure-button" data-action="close">×</button>
    </div>
    <form class="pure-form pure-form-stacked" autocomplete="off">
      <div class="fields-grid"></div>
      <div class="actions-row end">
        <button type="button" class="pure-button" data-action="cancel">Cancel</button>
        <button type="submit" class="pure-button pure-button-primary">Save</button>
      </div>
    </form>
  `;

  const form = dialog.querySelector('form');
  const title = dialog.querySelector('#editor-title');
  const fieldsGrid = dialog.querySelector('.fields-grid');
  let editingId = null;
  let visibleFields = [...requiredFields, 'displayName', 'role', 'company', 'title', 'email', 'qrValue'];

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    if (payload.sponsorLogo) {
      payload.sponsorLogo = payload.sponsorLogo
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (editingId) payload.id = editingId;
    onSave?.(payload);
    clear();
    close();
  });

  overlay.addEventListener('click', (evt) => {
    const action = evt.target.dataset.action;
    if (action === 'cancel' || action === 'close') {
      evt.preventDefault();
      clear();
      close();
      onCancel?.();
    }
    if (evt.target === overlay) {
      clear();
      close();
      onCancel?.();
    }
  });

  function load(participant) {
    editingId = participant?.id || null;
    title.textContent = editingId ? 'Edit Participant' : 'Add Participant';
    Array.from(form.elements).forEach((el) => {
      if (!el.name) return;
      if (el.name === 'sponsorLogo' && Array.isArray(participant?.sponsorLogo)) {
        el.value = participant.sponsorLogo.join(', ');
      } else {
        el.value = participant?.[el.name] || '';
      }
    });
  }

  function clear() {
    editingId = null;
    form.reset();
    title.textContent = 'Add Participant';
  }

  function renderFields() {
    fieldsGrid.innerHTML = '';
    const uniq = Array.from(new Set([...requiredFields, ...visibleFields]));
    uniq.forEach((name) => {
      const cfg = fieldConfig[name] || { label: name, type: 'text' };
      const wrapper = document.createElement('label');
      wrapper.textContent = cfg.label || name;
      const input = document.createElement('input');
      input.name = name;
      input.type = cfg.type || 'text';
      if (cfg.placeholder) input.placeholder = cfg.placeholder;
      wrapper.appendChild(document.createElement('br'));
      wrapper.appendChild(input);
      wrapper.className = 'form-field';
      fieldsGrid.appendChild(wrapper);
    });
  }

  function setVisibleFields(fields = []) {
    visibleFields = fields;
    renderFields();
  }

  renderFields();

  function open(participant) {
    load(participant);
    overlay.classList.remove('hidden');
  }

  function close() {
    overlay.classList.add('hidden');
  }

  return { element: overlay, load, clear, open, close, setVisibleFields };
}
