import badgeDefault from './defaults/badge.mustache?raw';
import themeDefault from './defaults/theme.less?raw';
import templateDefaultRaw from './defaults/template.json?raw';
import { compileLessSource, renderToSafeHtml, applyPreview } from './render.js';
import { fetchSampleData, downloadFile, readFileAsText } from './io.js';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-less';

const FIELD_SETS = {
  Required: ['id', 'firstName', 'lastName'],
  Recommended: [
    'displayName',
    'role',
    'company',
    'title',
    'country',
    'city',
    'email',
    'phone',
    'qrValue',
    'badgeType',
    'note'
  ],
  Event: ['eventName', 'eventDate', 'eventLocation', 'eventLogo', 'sponsorLogo']
};

const SNIPPETS = {
  base: badgeDefault.trim(),
  conditional: '{{#company}}<div class="company">{{company}}</div>{{/company}}',
  image: '{{#eventLogo}}<img class="logo" src="{{eventLogo}}" alt="logo" />{{/eventLogo}}'
};

export function initApp() {
  const app = document.getElementById('app');
  if (!app) return;

  const templateMeta = parseTemplateJson(templateDefaultRaw);
  const sizeParsed = parseSize(templateMeta.size || '90x55mm');

  const state = {
    htmlTemplate: badgeDefault.trim(),
    lessSource: themeDefault.trim(),
    templateMeta: {
      name: templateMeta.name || '',
      description: templateMeta.description || '',
      size: templateMeta.size || formatSize(sizeParsed.widthMm, sizeParsed.heightMm)
    },
    widthMm: sizeParsed.widthMm,
    heightMm: sizeParsed.heightMm,
    sampleData: null,
    participantIndex: 0
  };

  app.innerHTML = buildLayout();

  const htmlEditor = document.getElementById('html-editor');
  const lessEditor = document.getElementById('less-editor');
  const htmlHighlight = document.getElementById('html-highlight');
  const lessHighlight = document.getElementById('less-highlight');
  const metaNameInput = document.getElementById('meta-name');
  const metaDescInput = document.getElementById('meta-description');
  const metaSizeInput = document.getElementById('meta-size');
  const widthInput = document.getElementById('width-mm');
  const heightInput = document.getElementById('height-mm');
  const participantSelect = document.getElementById('participant-select');
  const errorPanel = document.getElementById('error-panel');
  const iframe = document.getElementById('preview-frame');

  setEditorText(htmlEditor, state.htmlTemplate);
  setEditorText(lessEditor, state.lessSource);
  renderHighlight(htmlEditor, state.htmlTemplate, 'markup');
  renderHighlight(lessEditor, state.lessSource, 'less');
  metaNameInput.value = state.templateMeta.name;
  metaDescInput.value = state.templateMeta.description;
  metaSizeInput.value = state.templateMeta.size;
  widthInput.value = state.widthMm;
  heightInput.value = state.heightMm;

  wireFieldChips(htmlEditor, state, scheduleRender);
  wireSnippets(htmlEditor, state, scheduleRender);
  wireFileInputs(state, htmlEditor, lessEditor, metaNameInput, metaDescInput, metaSizeInput, widthInput, heightInput, scheduleRender);
  wireDownloadButtons(state, htmlEditor, lessEditor);

  htmlEditor.addEventListener('input', () => {
    const caret = getCaretOffset(htmlEditor);
    state.htmlTemplate = getEditorText(htmlEditor);
    renderHighlight(htmlEditor, state.htmlTemplate, 'markup', caret);
    scheduleRender();
  });

  lessEditor.addEventListener('input', () => {
    const caret = getCaretOffset(lessEditor);
    state.lessSource = getEditorText(lessEditor);
    renderHighlight(lessEditor, state.lessSource, 'less', caret);
    scheduleRender();
  });

  htmlEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      insertAtCursor(htmlEditor, '\n');
      state.htmlTemplate = getEditorText(htmlEditor);
      renderHighlight(htmlEditor, state.htmlTemplate, 'markup', getCaretOffset(htmlEditor));
      scheduleRender();
    }
  });

  lessEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      insertAtCursor(lessEditor, '\n');
      state.lessSource = getEditorText(lessEditor);
      renderHighlight(lessEditor, state.lessSource, 'less', getCaretOffset(lessEditor));
      scheduleRender();
    }
  });

  metaNameInput.addEventListener('input', () => updateMetaField(state, 'name', metaNameInput.value, metaSizeInput, widthInput, heightInput, scheduleRender));
  metaDescInput.addEventListener('input', () => updateMetaField(state, 'description', metaDescInput.value, metaSizeInput, widthInput, heightInput, scheduleRender));
  metaSizeInput.addEventListener('input', () => handleSizeStringChange(state, metaSizeInput.value, widthInput, heightInput, scheduleRender));
  widthInput.addEventListener('input', () => handleDimensionChange(state, widthInput, heightInput, metaSizeInput, scheduleRender));
  heightInput.addEventListener('input', () => handleDimensionChange(state, widthInput, heightInput, metaSizeInput, scheduleRender));

  participantSelect.addEventListener('change', () => {
    state.participantIndex = Number(participantSelect.value) || 0;
    scheduleRender();
  });

  document.getElementById('reload-sample').addEventListener('click', async () => {
    await loadSample(state, participantSelect, scheduleRender);
  });

  const scheduleRenderDebounced = debounce(() => performRender(state, iframe, errorPanel, participantSelect), 250);
  function scheduleRender() {
    scheduleRenderDebounced();
  }

  loadSample(state, participantSelect, scheduleRender).then(() => scheduleRender());
}

function buildLayout() {
  return `
    <div class="topbar">
      <div class="title">Template Playground</div>
      <div class="toolbar">
        <button class="btn small" id="download-template">Download template.json</button>
        <button class="btn small" id="download-html">Download badge.mustache</button>
        <button class="btn small" id="download-less">Download theme.css</button>
        <label class="btn small secondary">
          Load template.json
          <input type="file" id="load-template" accept="application/json" hidden />
        </label>
        <label class="btn small secondary">
          Load badge.mustache
          <input type="file" id="load-html" accept=".mustache,.html,text/plain" hidden />
        </label>
        <label class="btn small secondary">
          Load theme.less
          <input type="file" id="load-less" accept=".less,.css,text/plain" hidden />
        </label>
      </div>
    </div>
    <div class="layout">
      <section class="panel toolbox-panel">
        <h4 class="section-title">Fields</h4>
        ${Object.entries(FIELD_SETS)
          .map(
            ([label, fields]) => `
            <div class="field-group">
              <div class="hint">${label}</div>
              <div class="chip-group">
                ${fields.map((f) => `<button class="chip" data-insert="{{${f}}}">${f}</button>`).join('')}
              </div>
            </div>
          `
          )
          .join('')}
        <h4 class="section-title" style="margin-top:12px;">Snippets</h4>
        <div class="snippet-buttons">
          <button class="btn small" data-snippet="base">Insert base badge HTML</button>
          <button class="btn small secondary" data-snippet="conditional">Insert conditional block</button>
          <button class="btn small secondary" data-snippet="image">Insert image example</button>
        </div>
      </section>
      <section class="panel editors">
        <div class="editor-block">
          <div class="editor-header">
            <div class="section-title">HTML (Mustache)</div>
          </div>
          <pre id="html-editor" class="editor-shell code-editor language-markup" spellcheck="false" contenteditable="true" tabindex="0"></pre>
        </div>
        <div class="editor-block">
          <div class="editor-header">
            <div class="section-title">LESS Styles</div>
          </div>
          <pre id="less-editor" class="editor-shell code-editor language-less" spellcheck="false" contenteditable="true" tabindex="0"></pre>
        </div>
      </section>
      <section class="panel preview-panel">
        <div class="preview-shell">
          <div class="badge-stage">
            <iframe id="preview-frame" class="badge-frame" title="Badge preview"></iframe>
          </div>
        </div>
        <div>
          <div class="section-title">Template Meta & Size</div>
          <div class="settings-grid">
            <div class="field">
              <label for="meta-name">Name</label>
              <input id="meta-name" placeholder="Template name" />
            </div>
            <div class="field">
              <label for="meta-description">Description</label>
              <input id="meta-description" placeholder="Short description" />
            </div>
            <div class="field">
              <label for="meta-size">Size label</label>
              <input id="meta-size" placeholder="90x55mm" />
            </div>
          </div>
          <div class="badge-size" style="margin-top:8px;">
            <div class="field">
              <label for="width-mm">Width (mm)</label>
              <input id="width-mm" type="number" min="20" step="1" />
            </div>
            <div class="field">
              <label for="height-mm">Height (mm)</label>
              <input id="height-mm" type="number" min="20" step="1" />
            </div>
          </div>
          <div class="hint" style="margin-top:6px;">Size syncs both the label and the live preview frame.</div>
        </div>
        <div>
          <div class="section-title">Sample Data</div>
          <div class="loaders">
            <button class="btn small" id="reload-sample">Load /example/sample.json</button>
            <div class="field" style="min-width:160px;">
              <label for="participant-select">Participant</label>
              <select id="participant-select"></select>
            </div>
          </div>
          <div class="hint" style="margin-top:6px;">Context merges meta + participant, with extras fullName and badgeClass.</div>
          <div id="error-panel" class="error-panel empty" style="margin-top:8px;">No errors.</div>
        </div>
      </section>
    </div>
  `;
}

function parseTemplateJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { name: '', description: '', size: '90x55mm' };
  }
}

function parseSize(size) {
  const match = /([0-9.]+)\s*x\s*([0-9.]+)\s*mm?/i.exec(size || '');
  if (!match) return { widthMm: 90, heightMm: 55 };
  return { widthMm: parseFloat(match[1]), heightMm: parseFloat(match[2]) };
}

function formatSize(width, height) {
  const w = Number.isFinite(width) ? width : 90;
  const h = Number.isFinite(height) ? height : 55;
  return `${w}x${h}mm`;
}

function wireFieldChips(htmlEditor, state, scheduleRender) {
  document.querySelectorAll('.chip[data-insert]').forEach((chip) => {
    chip.addEventListener('click', () => {
      insertAtCursor(htmlEditor, chip.dataset.insert);
      state.htmlTemplate = getEditorText(htmlEditor);
      renderHighlight(htmlEditor, state.htmlTemplate, 'markup');
      scheduleRender();
    });
  });
}

function wireSnippets(htmlEditor, state, scheduleRender) {
  document.querySelectorAll('[data-snippet]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.snippet;
      const snippet = SNIPPETS[key] || '';
      if (!snippet) return;
      if (key === 'base') {
        setEditorText(htmlEditor, snippet);
      } else {
        insertAtCursor(htmlEditor, snippet);
      }
      state.htmlTemplate = getEditorText(htmlEditor);
      renderHighlight(htmlEditor, state.htmlTemplate, 'markup');
      scheduleRender();
    });
  });
}

function wireFileInputs(state, htmlEditor, lessEditor, metaNameInput, metaDescInput, metaSizeInput, widthInput, heightInput, scheduleRender) {
  document.getElementById('load-template').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const parsed = parseTemplateJson(text);
      state.templateMeta = {
        name: parsed.name || '',
        description: parsed.description || '',
        size: parsed.size || state.templateMeta.size
      };
      const sizeParsed = parseSize(state.templateMeta.size);
      state.widthMm = sizeParsed.widthMm;
      state.heightMm = sizeParsed.heightMm;
      metaNameInput.value = state.templateMeta.name;
      metaDescInput.value = state.templateMeta.description;
      metaSizeInput.value = state.templateMeta.size;
      widthInput.value = state.widthMm;
      heightInput.value = state.heightMm;
      scheduleRender();
    } catch (err) {
      alert(`Failed to load template.json: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  });

  document.getElementById('load-html').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      setEditorText(htmlEditor, text);
      state.htmlTemplate = text;
      renderHighlight(htmlEditor, state.htmlTemplate, 'markup');
      scheduleRender();
    } catch (err) {
      alert(`Failed to load badge.mustache: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  });

  document.getElementById('load-less').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      setEditorText(lessEditor, text);
      state.lessSource = text;
      renderHighlight(lessEditor, state.lessSource, 'less');
      scheduleRender();
    } catch (err) {
      alert(`Failed to load theme.less: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  });
}

function wireDownloadButtons(state, htmlEditor, lessEditor) {
  document.getElementById('download-template').addEventListener('click', () => {
    downloadFile('template.json', buildTemplateJson(state));
  });
  document.getElementById('download-html').addEventListener('click', () => {
    downloadFile('badge.mustache', getEditorText(htmlEditor));
  });
  document.getElementById('download-less').addEventListener('click', async () => {
    try {
      const css = await compileLessSource(getEditorText(lessEditor));
      downloadFile('theme.css', css);
    } catch (err) {
      alert(`LESS compile failed: ${err.message}`);
    }
  });
}

function updateMetaField(state, key, value, metaSizeInput, widthInput, heightInput, scheduleRender) {
  state.templateMeta[key] = value;
  if (key === 'size') {
    const parsed = parseSize(value);
    state.widthMm = parsed.widthMm;
    state.heightMm = parsed.heightMm;
    widthInput.value = state.widthMm;
    heightInput.value = state.heightMm;
  } else {
    metaSizeInput.value = state.templateMeta.size;
  }
  scheduleRender();
}

function handleSizeStringChange(state, sizeString, widthInput, heightInput, scheduleRender) {
  state.templateMeta.size = sizeString;
  const parsed = parseSize(sizeString);
  state.widthMm = parsed.widthMm;
  state.heightMm = parsed.heightMm;
  widthInput.value = state.widthMm;
  heightInput.value = state.heightMm;
  scheduleRender();
}

function handleDimensionChange(state, widthInput, heightInput, metaSizeInput, scheduleRender) {
  const w = parseFloat(widthInput.value) || state.widthMm;
  const h = parseFloat(heightInput.value) || state.heightMm;
  state.widthMm = Math.max(20, w);
  state.heightMm = Math.max(20, h);
  metaSizeInput.value = formatSize(state.widthMm, state.heightMm);
  state.templateMeta.size = metaSizeInput.value;
  scheduleRender();
}

function buildTemplateJson(state) {
  return JSON.stringify(
    {
      name: state.templateMeta.name,
      description: state.templateMeta.description,
      size: state.templateMeta.size || formatSize(state.widthMm, state.heightMm)
    },
    null,
    2
  );
}

async function loadSample(state, participantSelect, scheduleRender) {
  state.sampleData = await fetchSampleData();
  const participants = state.sampleData.participants || [];
  participantSelect.innerHTML = participants
    .map((p, idx) => `<option value="${idx}">${idx}: ${p.displayName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unnamed'}</option>`)
    .join('');
  if (!participants.length) {
    participantSelect.innerHTML = '<option value="0">No participants</option>';
  }
  state.participantIndex = 0;
  participantSelect.value = '0';
  scheduleRender();
}

async function performRender(state, iframe, errorPanel, participantSelect) {
  const errors = [];
  const sample = state.sampleData || { meta: {}, participants: [] };
  const participant = sample.participants[state.participantIndex] || sample.participants[0] || {};
  const meta = sample.meta || {};
  const context = buildRenderContext(meta, participant);

  let safeHtml = '';
  try {
    safeHtml = await renderToSafeHtml(state.htmlTemplate, context);
  } catch (err) {
    errors.push(`Mustache render: ${err.message}`);
  }

  let css = '';
  try {
    css = await compileLessSource(state.lessSource);
  } catch (err) {
    errors.push(`LESS: ${err.message}`);
  }

  updateErrorPanel(errorPanel, errors);

  if (errors.length) {
    applyPreview(iframe, {
      html: `<div style="padding:12px;font-family:sans-serif;color:#f8fafc;">Fix errors to see the badge.</div>`,
      css: '',
      widthMm: state.widthMm,
      heightMm: state.heightMm
    });
    return;
  }

  applyPreview(iframe, {
    html: safeHtml,
    css,
    widthMm: state.widthMm,
    heightMm: state.heightMm
  });
}

function buildRenderContext(meta, participant) {
  const context = { ...(meta || {}), ...(participant || {}) };
  const fullNameCandidate = context.displayName || `${context.firstName || ''} ${context.lastName || ''}`.trim();
  context.fullName = fullNameCandidate.trim();
  const badgeSource = context.badgeType || context.role || '';
  context.badgeClass = badgeSource
    ? badgeSource
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    : '';
  return context;
}

function updateErrorPanel(panel, errors) {
  if (!panel) return;
  if (!errors.length) {
    panel.textContent = 'No errors.';
    panel.classList.add('empty');
    return;
  }
  panel.classList.remove('empty');
  panel.innerHTML = errors.map((err) => `<div>• ${escapeHtml(err)}</div>`).join('');
}

function debounce(fn, delay = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderHighlight(editor, text, languageKey, caretOverride) {
  if (!editor) return;
  const caretOffset = typeof caretOverride === 'number' ? caretOverride : getCaretOffset(editor);
  const lang = Prism.languages[languageKey] || Prism.languages.markup;
  editor.innerHTML = Prism.highlight(text || '', lang, languageKey);
  setCaretOffset(editor, caretOffset);
}

function insertAtCursor(editor, text) {
  const offset = getCaretOffset(editor);
  const current = getEditorText(editor);
  const next = current.slice(0, offset) + text + current.slice(offset);
  renderHighlight(editor, next, editor.classList.contains('language-less') ? 'less' : 'markup', offset + text.length);
}

function getEditorText(editor) {
  return editor?.innerText || '';
}

function setEditorText(editor, text) {
  if (!editor) return;
  renderHighlight(editor, text, editor.classList.contains('language-less') ? 'less' : 'markup', text ? text.length : 0);
}

function getCaretOffset(root) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return 0;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer)) return 0;
  const preRange = range.cloneRange();
  preRange.selectNodeContents(root);
  preRange.setEnd(range.startContainer, range.startOffset);
  return preRange.toString().length;
}

function setCaretOffset(root, offset) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let currentOffset = 0;
  let node = walker.nextNode();
  let lastNode = null;
  while (node) {
    lastNode = node;
    const nextOffset = currentOffset + node.textContent.length;
    if (offset <= nextOffset) {
      const range = document.createRange();
      const pos = Math.max(0, offset - currentOffset);
      range.setStart(node, pos);
      range.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    currentOffset = nextOffset;
    node = walker.nextNode();
  }
  if (lastNode) {
    const range = document.createRange();
    range.setStart(lastNode, lastNode.textContent.length);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
}
