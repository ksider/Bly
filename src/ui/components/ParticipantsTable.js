const columnLabels = {
  displayName: 'Name',
  firstName: 'First Name',
  lastName: 'Last Name',
  role: 'Role',
  company: 'Company',
  title: 'Title',
  email: 'Email',
  qrValue: 'QR',
};

const selectableColumns = ['role', 'company', 'title', 'email', 'qrValue', 'firstName', 'lastName'];

export default function ParticipantsTable({ columns = ['displayName'], onColumnsChange, onAdd, onEdit, onDelete }) {
  const container = document.createElement('section');
  container.className = 'panel';

  const header = document.createElement('div');
  header.className = 'panel-header';
  header.innerHTML = `
    <h3>Participants</h3>
    <div class="panel-actions">
      <button class="pure-button" data-action="columns">Columns</button>
      <button class="pure-button pure-button-primary" data-action="add">Add</button>
    </div>
  `;
  container.appendChild(header);

  const table = document.createElement('table');
  table.className = 'pure-table pure-table-horizontal participant-table';
  container.appendChild(table);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay hidden';
  overlay.innerHTML = `
    <div class="modal-dialog panel">
      <div class="modal-header">
        <h3>Table columns</h3>
        <button class="pure-button" data-action="close">×</button>
      </div>
      <form class="pure-form pure-form-stacked columns-form">
        <p class="help-text">Name is always shown. Choose extra fields:</p>
        <div class="grid-2 column-options"></div>
        <div class="actions-row end">
          <button type="button" class="pure-button" data-action="cancel">Cancel</button>
          <button type="submit" class="pure-button pure-button-primary">Save</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  const form = overlay.querySelector('.columns-form');
  const optionsHost = overlay.querySelector('.column-options');

  selectableColumns.forEach((key) => {
    const wrapper = document.createElement('label');
    wrapper.className = 'pure-checkbox';
    wrapper.innerHTML = `<input type="checkbox" name="${key}" /> ${columnLabels[key] || key}`;
    optionsHost.appendChild(wrapper);
  });

  function renderRows(participants, activeColumns) {
    const cols = ['displayName', ...activeColumns.filter((c) => c !== 'displayName')];
    const headers = cols
      .map((col) => `<th>${columnLabels[col] || col}</th>`)
      .join('');

    const rows = participants
      .map(
        (p) => `
        <tr data-id="${p.id}">
          ${cols
            .map((col) => `<td data-col="${col}">${p[col] || ''}</td>`)
            .join('')}
          <td class="actions">
            <div class="row-actions">
              <button class="pure-button pure-button-primary icon-button" data-action="edit" aria-label="Edit participant">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button class="pure-button button-error icon-button" data-action="delete" aria-label="Delete participant">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </td>
        </tr>`
      )
      .join('');
    table.innerHTML = `
      <thead>
        <tr>${headers}<th></th></tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="5" class="empty">No participants yet</td></tr>'}</tbody>
    `;
  }

  table.addEventListener('click', (evt) => {
    const targetButton = evt.target.closest('[data-action]');
    if (!targetButton) return;
    const action = targetButton.dataset.action;
    if (action === 'edit' || action === 'delete') {
      const tr = targetButton.closest('tr[data-id]');
      if (!tr) return;
      const id = tr.dataset.id;
      if (action === 'edit') onEdit?.(id);
      if (action === 'delete') onDelete?.(id);
    }
  });

  header.addEventListener('click', (evt) => {
    if (evt.target.dataset.action === 'add') {
      onAdd?.();
    }
    if (evt.target.dataset.action === 'columns') {
      openOverlay();
    }
  });

  overlay.addEventListener('click', (evt) => {
    const action = evt.target.dataset.action;
    if (action === 'close' || action === 'cancel' || evt.target === overlay) {
      overlay.classList.add('hidden');
    }
  });

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const formData = new FormData(form);
    const selected = selectableColumns.filter((key) => formData.get(key));
    onColumnsChange?.(['displayName', ...selected]);
    overlay.classList.add('hidden');
  });

  function openOverlay() {
    const activeSet = new Set(currentColumns);
    selectableColumns.forEach((key) => {
      const input = form.elements.namedItem(key);
      if (input) input.checked = activeSet.has(key);
    });
    overlay.classList.remove('hidden');
  }

  let currentColumns = columns;

  function update(participants, cols = ['displayName']) {
    currentColumns = cols;
    renderRows(participants, cols);
  }

  return { element: container, update };
}
