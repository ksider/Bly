(function (global) {
    const TEMPLATE_SOURCES = {
        'modern-landscape': {
            name: 'Modern Landscape',
            markup: '../templates/modern-landscape/markup.html',
            styles: '../templates/modern-landscape/style.css',
        },
        'minimal-portrait': {
            name: 'Minimal Portrait',
            markup: '../templates/minimal-portrait/markup.html',
            styles: '../templates/minimal-portrait/style.css',
        },
        'compact-grid': {
            name: 'Compact Grid',
            markup: '../templates/compact-grid/markup.html',
            styles: '../templates/compact-grid/style.css',
        },
    };

    const state = new global.BadgeDesignerState();
    const canvasNode = document.getElementById('badgeCanvas');
    const paletteNode = document.getElementById('elementPalette');
    const propertiesNode = document.getElementById('propertiesBody');
    const layerListNode = document.getElementById('layerList');

    const markupOutput = document.getElementById('markupOutput');
    const stylesOutput = document.getElementById('stylesOutput');
    const manifestOutput = document.getElementById('manifestOutput');

    const markupSurface = document.getElementById('markupEditor');
    const stylesSurface = document.getElementById('stylesEditor');
    const manifestSurface = document.getElementById('manifestEditor');

    const badgeWidthInput = document.getElementById('badgeWidthInput');
    const badgeHeightInput = document.getElementById('badgeHeightInput');
    const gridSizeInput = document.getElementById('gridSizeInput');
    const snapInput = document.getElementById('snapToGridInput');
    const loadButton = document.getElementById('loadTemplateButton');
    const exportButton = document.getElementById('exportTemplateButton');
    const connectTemplatesButton = document.getElementById('connectTemplatesButton');

    const canvas = new global.BadgeCanvas(state, canvasNode);
    const palette = new global.BadgePalette(state, paletteNode);
    const properties = new global.BadgePropertiesPanel(state, propertiesNode);

    const editors = {
        markup: global.BadgeCodeEditor.createEditor(markupSurface, markupOutput, 'html'),
        styles: global.BadgeCodeEditor.createEditor(stylesSurface, stylesOutput, 'css'),
        manifest: global.BadgeCodeEditor.createEditor(manifestSurface, manifestOutput, 'json'),
    };

    const exporter = new global.BadgeTemplateExporter(state, {
        markup: markupOutput,
        styles: stylesOutput,
        manifest: manifestOutput,
    }, editors);

    palette.setCanvas(canvas);

    setupBadgeControls();
    setupLayerList();
    setupCodeTabs();
    setupCanvasInsertion();
    setupFileLoading();
    setupTemplateLibrary();
    setupExport();
    setupDeleteShortcut();

    let templateDirectoryHandle = null;

    function setupBadgeControls() {
        badgeWidthInput?.addEventListener('input', () => {
            const value = Number(badgeWidthInput.value);
            if (!Number.isNaN(value)) {
                state.updateBadgeSize(value, state.badgeSize.height);
            }
        });
        badgeHeightInput?.addEventListener('input', () => {
            const value = Number(badgeHeightInput.value);
            if (!Number.isNaN(value)) {
                state.updateBadgeSize(state.badgeSize.width, value);
            }
        });
        gridSizeInput?.addEventListener('input', () => {
            const value = Number(gridSizeInput.value);
            if (!Number.isNaN(value)) {
                state.setGridSize(value);
            }
        });
        snapInput?.addEventListener('change', () => {
            state.setSnap(snapInput.checked);
        });

        state.on('badge', () => {
            if (badgeWidthInput) {
                badgeWidthInput.value = state.badgeSize.width;
            }
            if (badgeHeightInput) {
                badgeHeightInput.value = state.badgeSize.height;
            }
        });
    }

    function setupLayerList() {
        function renderLayers() {
            if (!layerListNode) {
                return;
            }
            layerListNode.innerHTML = '';
            const fragment = document.createDocumentFragment();
            [...state.elements].reverse().forEach((element) => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'layer-item';
                item.dataset.elementId = element.id;
                item.innerHTML = `
                    <span>${iconForType(element.type)} ${nameForElement(element)}</span>
                    <span>#${element.zIndex}</span>
                `;
                if (state.selectedId === element.id) {
                    item.classList.add('active');
                }
                fragment.appendChild(item);
            });
            layerListNode.appendChild(fragment);
        }

        function iconForType(type) {
            switch (type) {
                case 'text':
                    return '🅣';
                case 'field':
                    return '🅕';
                case 'image':
                    return '🖼';
                case 'shape':
                    return '⬒';
                default:
                    return '⬚';
            }
        }

        function nameForElement(element) {
            switch (element.type) {
                case 'text':
                    return element.content?.slice(0, 18) || 'Текст';
                case 'field':
                    return `{{${element.fieldKey || 'field'}}}`;
                case 'image':
                    return element.description || 'Изображение';
                case 'shape':
                    return 'Фигура';
                default:
                    return 'Элемент';
            }
        }

        layerListNode?.addEventListener('click', (event) => {
            const button = event.target.closest('.layer-item');
            if (!button) {
                return;
            }
            state.selectElement(button.dataset.elementId);
        });

        state.on('elements', renderLayers);
        state.on('selection', renderLayers);
        renderLayers();
    }

    function setupCodeTabs() {
        const tabs = document.querySelectorAll('.code-tab');
        const containers = {
            markup: document.querySelector('.code-editor[data-editor-id="markup"]'),
            styles: document.querySelector('.code-editor[data-editor-id="styles"]'),
            manifest: document.querySelector('.code-editor[data-editor-id="manifest"]'),
        };
        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.codeTab;
                if (!target) {
                    return;
                }
                tabs.forEach((btn) => {
                    const isActive = btn === tab;
                    btn.classList.toggle('active', isActive);
                    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
                });
                Object.entries(containers).forEach(([key, container]) => {
                    container?.classList.toggle('active', key === target);
                });
                editors[target]?.focus?.();
            });
        });
        containers.markup?.classList.add('active');
        const defaultTab = document.querySelector('.code-tab[data-code-tab="markup"]');
        defaultTab?.classList.add('active');
        defaultTab?.setAttribute('aria-selected', 'true');
    }

    function setupCanvasInsertion() {
        if (!canvasNode) {
            return;
        }
        canvasNode.addEventListener('pointerdown', (event) => {
            const frame = canvas.frame;
            if (!frame) {
                return;
            }
            const elementTarget = event.target.closest('.badge-element');
            if (elementTarget) {
                return;
            }
            if (!palette.currentTool) {
                return;
            }
            const rect = frame.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
                return;
            }
            const element = palette.spawnElement();
            if (!element) {
                return;
            }
            const position = {
                x: Math.max(0, x - element.width / 2),
                y: Math.max(0, y - element.height / 2),
            };
            state.updateElement(element.id, position);
        });
    }

    function setupFileLoading() {
        if (!loadButton) {
            return;
        }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.style.display = 'none';
        document.body.appendChild(input);

        loadButton.addEventListener('click', () => input.click());
        input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (!file) {
                return;
            }
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                state.loadData(data);
            } catch (error) {
                console.error('Не удалось импортировать макет', error);
                alert('Ошибка импорта. Проверьте формат файла.');
            } finally {
                input.value = '';
            }
        });
    }

    function setupTemplateLibrary() {
        const library = document.getElementById('templateLibrary');
        connectTemplatesButton?.addEventListener('click', async () => {
            const handle = await requestTemplateDirectory();
            if (handle) {
                templateDirectoryHandle = handle;
                alert('Каталог шаблонов подключен. Теперь можно загружать примеры без запуска сервера.');
            }
        });

        library?.addEventListener('click', async (event) => {
            const button = event.target.closest('[data-template]');
            if (!button) {
                return;
            }
            const id = button.dataset.template;
            const source = TEMPLATE_SOURCES[id];
            if (!source) {
                return;
            }
            try {
                const [markup, styles] = await Promise.all([
                    loadTemplateAsset(source.markup),
                    loadTemplateAsset(source.styles),
                ]);
                editors.markup?.setValue(markup.trim());
                editors.styles?.setValue(styles.trim());
                editors.manifest?.setValue(JSON.stringify({
                    id,
                    name: source.name,
                    description: 'Импортировано из каталога шаблонов.',
                }, null, 2));
            } catch (error) {
                console.error('Не удалось загрузить шаблон', error);
                alert(error.message || 'Не удалось загрузить шаблон. Попробуйте подключить папку шаблонов или открыть редактор через локальный сервер.');
            }
        });
    }

    function setupExport() {
        exportButton?.addEventListener('click', () => {
            const data = state.getData();
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const date = new Date().toISOString().slice(0, 10);
            const link = document.createElement('a');
            link.href = url;
            link.download = `badge-designer-${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }

    function setupDeleteShortcut() {
        window.addEventListener('keydown', (event) => {
            if (event.key !== 'Delete' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }
            const target = event.target;
            if (isEditableElement(target)) {
                return;
            }
            const selected = state.getSelected();
            if (!selected) {
                return;
            }
            event.preventDefault();
            state.removeElement(selected.id);
        });
    }

    function isEditableElement(node) {
        if (!node) {
            return false;
        }
        const editable = node.closest('input, textarea, [contenteditable="true"]');
        return Boolean(editable);
    }

    async function loadTemplateAsset(path) {
        if (window.location.protocol !== 'file:') {
            return fetchTextOverHttp(path);
        }
        if (!templateDirectoryHandle) {
            throw new Error('Для загрузки примера подключите папку `templates` или запустите локальный сервер (npx serve).');
        }
        return readFileFromDirectory(path);
    }

    async function fetchTextOverHttp(path) {
        const response = await fetch(path, {cache: 'no-store'});
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.text();
    }

    async function requestTemplateDirectory() {
        if (!window.showDirectoryPicker) {
            alert('Браузер не поддерживает выбор каталога. Используйте Chrome или запустите локальный сервер.');
            return null;
        }
        try {
            const handle = await window.showDirectoryPicker({
                id: 'badge-templates',
                mode: 'read',
            });
            return handle;
        } catch (error) {
            if (error && error.name !== 'AbortError') {
                console.warn('Не удалось получить доступ к каталогу шаблонов', error);
            }
            return null;
        }
    }

    async function readFileFromDirectory(path) {
        const normalized = normalizeTemplatePath(path);
        const segments = normalized.split('/');
        let currentHandle = templateDirectoryHandle;
        for (let i = 0; i < segments.length; i += 1) {
            const part = segments[i];
            const isLast = i === segments.length - 1;
            if (isLast) {
                const fileHandle = await currentHandle.getFileHandle(part);
                const file = await fileHandle.getFile();
                return await file.text();
            }
            currentHandle = await currentHandle.getDirectoryHandle(part);
        }
        throw new Error('Файл не найден в выбранном каталоге.');
    }

    function normalizeTemplatePath(path) {
        return path
            .replace(/^\.\.\//, '')
            .replace(/^templates\//, '')
            .trim();
    }
})(window);
