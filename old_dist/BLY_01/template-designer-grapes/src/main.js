import grapesjs from 'grapesjs';
import blocksBasic from 'grapesjs-blocks-basic';
import 'grapesjs/dist/css/grapes.min.css';
import './style.css';

const BADGE_WIDTH_MM = 90;
const BADGE_HEIGHT_MM = 55;
const PX_PER_MM = 3.78;
const BADGE_WIDTH_PX = Math.round(BADGE_WIDTH_MM * PX_PER_MM);
const BADGE_HEIGHT_PX = Math.round(BADGE_HEIGHT_MM * PX_PER_MM);

const root = document.getElementById('root');
root.innerHTML = `
  <div class="app">
    <header class="app-header">
      <h1>GrapesJS Badge Builder</h1>
      <p>Используйте стандартные блоки GrapesJS. Зона бейджа фиксирована: 90×55 мм. Поля с <code>{{placeholder}}</code> станут данными Bly.</p>
    </header>
    <div class="workspace">
      <aside class="sidebar">
        <h2>Блоки</h2>
        <div id="blocks"></div>
      </aside>
      <div class="editor-wrapper">
        <div id="editor"></div>
      </div>
    </div>
    <section class="export-panel">
      <div class="export-actions">
        <button type="button" id="resetButton">Сбросить макет</button>
        <button type="button" id="exportButton">Экспортировать</button>
      </div>
      <label>
        HTML
        <textarea id="htmlOutput" readonly></textarea>
      </label>
      <label>
        CSS
        <textarea id="cssOutput" readonly></textarea>
      </label>
      <label>
        Manifest JSON
        <textarea id="manifestOutput" readonly></textarea>
      </label>
    </section>
  </div>
`;

const editor = grapesjs.init({
  container: '#editor',
  fromElement: false,
  height: '100%',
  width: '100%',
  storageManager: false,
  deviceManager: {
    devices: [
      { id: 'badge', name: 'Badge 90x55', width: `${BADGE_WIDTH_PX}px`, height: `${BADGE_HEIGHT_PX}px` },
      { id: 'desktop', name: 'Desktop', width: '100%' },
    ],
  },
  selectorManager: {
    componentFirst: true,
  },
  blockManager: {
    appendTo: false,
  },
  plugins: [blocksBasic],
  canvasStyle: `
    body { background: transparent; }
    .badge-wrapper {
      width: ${BADGE_WIDTH_PX}px;
      height: ${BADGE_HEIGHT_PX}px;
      margin: 40px auto;
      border-radius: 18px;
      background: #ffffff;
      box-shadow: 0 30px 60px -48px rgba(15, 23, 42, 0.55);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.25);
    }
    .badge-content {
      position: relative;
      width: 100%;
      height: 100%;
      padding: 18px 20px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .badge-field {
      position: relative;
      font-weight: 700;
      font-size: 24px;
      color: #1f2937;
    }
    .badge-field::after {
      content: attr(data-field);
      position: absolute;
      bottom: -18px;
      left: 0;
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(30, 64, 175, 0.65);
    }
    .badge-shape {
      display: block;
    }
    .badge-image {
      background: #cbd5f5;
      border-radius: 16px;
      overflow: hidden;
    }
  `,
});

editor.setDevice('badge');
setupFieldComponent();
setupInitialComponents();
wireExport();

editor.on('load', () => {
  editor.BlockManager.render('#blocks');
});

function setupInitialComponents() {
  const initialMarkup = `
    <div class="badge-wrapper">
      <div class="badge-content">
        <div class="badge-field" data-field="name">{{name}}</div>
        <div class="badge-field" data-field="company" style="font-size:18px;font-weight:500;color:#475569;">{{company}}</div>
      </div>
    </div>
  `;
  editor.setComponents(initialMarkup.trim());

  const badgeWrapper = editor.getWrapper().find('.badge-wrapper')[0];
  const badgeContent = editor.getWrapper().find('.badge-content')[0];

  if (badgeWrapper) {
    badgeWrapper.set({
      droppable: false,
      draggable: false,
      removable: false,
      copyable: false,
      highlightable: true,
      selectable: true,
    });
  }

  if (badgeContent) {
    badgeContent.set({
      droppable: true,
      draggable: false,
      removable: false,
      copyable: false,
      name: 'Содержимое бейджа',
    });
  }
}

function setupFieldComponent() {
  const domComponents = editor.DomComponents;
  domComponents.addType('badge-field', {
    extend: 'text',
    isComponent: (el) => el.hasAttribute?.('data-field'),
    model: {
      defaults: {
        attributes: { 'data-field': 'field' },
        traits: [
          {
            type: 'text',
            label: 'Поле',
            name: 'data-field',
            changeProp: 1,
          },
        ],
      },
      init() {
        this.on('change:attributes:data-field', this.updatePlaceholder);
        this.updatePlaceholder();
      },
      updatePlaceholder() {
        const field = this.getAttributes()?.['data-field'] || 'field';
        this.components(`{{${field}}}`);
      },
    },
  });

  editor.on('component:add', (component) => {
    if (component === editor.getWrapper()) {
      return;
    }
    const badgeContent = editor.getWrapper().find('.badge-content')[0];
    if (!badgeContent) {
      return;
    }
    if (component.is('badge-field')) {
      component.getTrait('data-field')?.set('value', component.getAttributes()['data-field'] || 'field');
    }
    const parent = component.parent();
    if (parent && parent === editor.getWrapper()) {
      badgeContent.append(component);
    }
  });
}

function wireExport() {
  const exportButton = document.getElementById('exportButton');
  const resetButton = document.getElementById('resetButton');
  const htmlOutput = document.getElementById('htmlOutput');
  const cssOutput = document.getElementById('cssOutput');
  const manifestOutput = document.getElementById('manifestOutput');

  exportButton?.addEventListener('click', () => {
    const html = editor.getHtml();
    const css = editor.getCss();
    htmlOutput.value = html.trim();
    cssOutput.value = css.trim();
    manifestOutput.value = JSON.stringify(buildManifest(html), null, 2);
  });

  resetButton?.addEventListener('click', () => {
    if (confirm('Очистить макет?')) {
      setupInitialComponents();
    }
  });
}

function buildManifest(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const fields = new Map();
  doc.querySelectorAll('[data-field]').forEach((node) => {
    const id = (node.getAttribute('data-field') || 'field').trim();
    if (!id || fields.has(id)) {
      return;
    }
    fields.set(id, {
      id,
      label: id,
      type: 'text',
      required: true,
    });
  });
  return {
    id: `grapes-template-${Date.now()}`,
    name: 'Grapes Badge Template',
    description: 'Шаблон, построенный в GrapesJS',
    badgeSize: {
      width: BADGE_WIDTH_MM,
      height: BADGE_HEIGHT_MM,
    },
    fields: Array.from(fields.values()),
  };
}
