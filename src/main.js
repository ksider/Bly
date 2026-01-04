import 'purecss/build/pure-min.css';
import './ui/styles/app.css';
import './ui/styles/print.css';
import QRCode from 'qrcode';
import {
  addParticipant,
  deleteParticipant,
  getState,
  resetProject,
  setBadgeSettings,
  setPageSettings,
  setParticipants,
  setTemplate,
  subscribe,
  updateParticipant,
  setTableColumns,
} from './store/store.js';
import { computeLayout } from './core/layout_calc.js';
import { paginate } from './core/paginator.js';
import { renderBadge, templateStylesFor, usedFields } from './core/template_engine.js';
import { attachPrintHandlers } from './core/print.js';
import { importFromCSV, importFromJSON, exportToCSV, exportToJSON } from './core/import_export.js';
import SettingsPanel from './ui/components/SettingsPanel.js';
import ParticipantsTable from './ui/components/ParticipantsTable.js';
import ParticipantEditor from './ui/components/ParticipantEditor.js';
import TemplatePicker from './ui/components/TemplatePicker.js';
import Toolbar from './ui/components/Toolbar.js';

const app = document.querySelector('#app');

const toolbar = Toolbar({
  onImportCSV: handleCSVImport,
  onImportJSON: handleJSONImport,
  onExportCSV: handleCSVExport,
  onExportJSON: handleJSONExport,
  onReset: () => confirm('Reset current project?') && resetProject(),
  onPrint: () => window.print(),
});

const settingsPanel = SettingsPanel({
  onPageChange: (payload) => setPageSettings(payload),
  onBadgeChange: (payload) => setBadgeSettings(payload),
});

const participantEditor = ParticipantEditor({
  onSave: (payload) => {
    if (payload.id && findParticipant(payload.id)) {
      updateParticipant(payload.id, payload);
    } else {
      addParticipant(payload);
    }
  },
  onCancel: () => participantEditor.clear(),
});

document.body.appendChild(participantEditor.element);

const templatePicker = TemplatePicker({
  onSelect: (id) => setTemplate(id),
});

const participantsTable = ParticipantsTable({
  onAdd: () => participantEditor.open(),
  onEdit: (id) => {
    const record = findParticipant(id);
    if (record) participantEditor.open(record);
  },
  onDelete: (id) => {
    if (confirm('Delete participant?')) deleteParticipant(id);
  },
  onColumnsChange: (cols) => setTableColumns(cols),
});

const layoutStyle = document.createElement('style');
layoutStyle.id = 'template-style';
document.head.appendChild(layoutStyle);

const workspace = document.createElement('div');
workspace.className = 'workspace';

const leftColumn = document.createElement('div');
leftColumn.className = 'stack';
leftColumn.append(settingsPanel.element, templatePicker.element, participantsTable.element);

const rightColumn = document.createElement('div');
rightColumn.className = 'stack preview-wrapper';
const previewArea = document.createElement('div');
previewArea.className = 'preview-area';
rightColumn.append(previewArea);

app.append(toolbar.element, workspace);
workspace.append(leftColumn, rightColumn);

attachPrintHandlers(toolbar.printButton);
renderApp(getState());
subscribe(renderApp);

function renderApp(state) {
  const layout = computeLayout(state.pageSettings, state.badgeSettings);
  settingsPanel.update(state, layout);
  templatePicker.update(state.templateId);
  participantEditor.setVisibleFields(usedFields(state.templateId));
  participantsTable.update(state.participants, state.tableColumns);
  layoutStyle.textContent = templateStylesFor(state.templateId);
  renderPages(state, layout);
}

function renderPages(state, layout) {
  previewArea.innerHTML = '';
  const pages = paginate(state.participants, layout, { fillBlanks: state.badgeSettings.autoGrid });

  pages.forEach((pageItems, pageIndex) => {
    const page = document.createElement('div');
    page.className = 'page';
    const isLetter = state.pageSettings.paperSize === 'Letter';
    if (isLetter) {
      const widthIn = (layout.page.widthMm / 25.4).toFixed(4);
      const heightIn = (layout.page.heightMm / 25.4).toFixed(4);
      page.style.width = `${widthIn}in`;
      page.style.height = `${heightIn}in`;
    } else {
      page.style.width = `${layout.page.widthMm}mm`;
      page.style.height = `${layout.page.heightMm}mm`;
    }

    const grid = document.createElement('div');
    grid.className = 'page-grid';
    grid.style.marginTop = `${state.pageSettings.marginTopMm}mm`;
    grid.style.marginRight = `${state.pageSettings.marginRightMm}mm`;
    grid.style.marginBottom = `${state.pageSettings.marginBottomMm}mm`;
    grid.style.marginLeft = `${state.pageSettings.marginLeftMm}mm`;
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${layout.cols}, ${layout.badge.widthMm}mm)`;
    grid.style.gridTemplateRows = `repeat(${layout.rows}, ${layout.badge.heightMm}mm)`;
    grid.style.columnGap = `${layout.gapX}mm`;
    grid.style.rowGap = `${layout.gapY}mm`;

    pageItems.forEach((participant) => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (participant) {
        const badgeWrapper = document.createElement('div');
        badgeWrapper.className = 'badge template-theme';
        badgeWrapper.innerHTML = renderBadge(participant, state.templateId);
        const actions = document.createElement('div');
        actions.className = 'badge-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'pure-button pure-button-primary icon-button';
        editBtn.setAttribute('aria-label', 'Edit participant');
        editBtn.innerHTML = '<span class="material-symbols-outlined">edit</span>';
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          participantEditor.open(participant);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'pure-button button-error icon-button';
        deleteBtn.setAttribute('aria-label', 'Delete participant');
        deleteBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('Delete participant?')) deleteParticipant(participant.id);
        });

        actions.append(editBtn, deleteBtn);
        badgeWrapper.append(actions);
        cell.appendChild(badgeWrapper);
        injectQR(badgeWrapper, participant.qrValue);
      }
      grid.appendChild(cell);
    });

    page.appendChild(grid);
    previewArea.appendChild(page);
    if (pageIndex === pages.length - 1) {
      page.style.pageBreakAfter = 'auto';
    }
  });
}

async function injectQR(badgeWrapper, value) {
  if (!value) return;
  const holder = badgeWrapper.querySelector('[data-qr]');
  if (!holder) return;
  const canvas = document.createElement('canvas');
  holder.innerHTML = '';
  holder.appendChild(canvas);
  const sizePx = Math.round(16 * 3.78);
  try {
    await QRCode.toCanvas(canvas, String(value), { width: sizePx, margin: 0 });
  } catch (e) {
    console.warn('QR generation failed', e);
  }
}

function findParticipant(id) {
  return getState().participants.find((p) => String(p.id) === String(id));
}

function handleCSVImport(text) {
  const { participants, errors } = importFromCSV(text);
  if (errors.length) {
    alert(`CSV errors: ${errors.map((e) => e.message || e).join('\n')}`);
    return;
  }
  setParticipants([...getState().participants, ...participants]);
}

function handleJSONImport(text) {
  const { participants, errors } = importFromJSON(text);
  if (errors.length) {
    alert(`JSON errors: ${errors.map((e) => e.message || e).join('\n')}`);
    return;
  }
  setParticipants([...getState().participants, ...participants]);
}

function handleCSVExport() {
  const csv = exportToCSV(getState().participants);
  downloadFile(csv, 'participants.csv', 'text/csv');
}

function handleJSONExport() {
  const json = exportToJSON(getState().participants);
  downloadFile(json, 'participants.json', 'application/json');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
