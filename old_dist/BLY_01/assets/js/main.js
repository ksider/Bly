(function (global) {
const {LocalStore} = global.BadgeStorage;
const {TemplateManager} = global.BadgeTemplateManager;
const {AppState} = global.BadgeState;
const {
    renderTemplateString,
    chunkArray,
    toNumber,
    clamp,
    mm,
    escapeHTML,
    deepClone,
    createId,
    debounce,
} = global.BadgeUtils;
const CodeEditorAPI = global.BadgeCodeEditor || {};

const PAGE_SIZES = {
    A4: {width: 210, height: 297},
    Letter: {width: 215.9, height: 279.4},
};

const SIZE_PRESETS = [
    {id: 'preset-96x73_5', label: '96x73.5', width: 96, height: 73.5},
    {id: 'preset-110x70', label: '110x70', width: 110, height: 70},
    {id: 'preset-90x60', label: '90x60', width: 90, height: 60},
    {id: 'preset-60x90', label: '60x90', width: 60, height: 90},
    {id: 'preset-85x155', label: '85x155', width: 85, height: 155},
];

const store = new LocalStore();
const templateManager = new TemplateManager(store);
const state = new AppState(store);

const elements = {
    templateSelect: document.getElementById('templateSelect'),
    templateDescription: document.getElementById('templateDescription'),
    templateSample: document.getElementById('templateSample'),
    customizeTemplateButton: document.getElementById('customizeTemplateButton'),
    printButton: document.getElementById('printButton'),
    exportButton: document.getElementById('exportButton'),
    importButton: document.getElementById('importButton'),
    clearParticipantsButton: document.getElementById('clearParticipantsButton'),
    resetSettingsButton: document.getElementById('resetSettingsButton'),
    clearStorageButton: document.getElementById('clearStorageButton'),
    addParticipantButton: document.getElementById('addParticipantButton'),
    participantList: document.getElementById('participantList'),
    participantSearch: document.getElementById('participantSearch'),
    deleteSelectedButton: document.getElementById('deleteSelectedButton'),
    selectionTools: document.querySelector('.selection-tools'),
    printArea: document.getElementById('printArea'),
    previewInfo: document.getElementById('previewInfo'),
    pageSizeSelect: document.getElementById('pageSizeSelect'),
    customPageSizeFields: document.getElementById('customPageSizeFields'),
    customPageWidth: document.getElementById('customPageWidth'),
    customPageHeight: document.getElementById('customPageHeight'),
    orientationInputs: document.querySelectorAll('input[name="orientation"]'),
    badgeWidth: document.getElementById('badgeWidth'),
    badgeHeight: document.getElementById('badgeHeight'),
    badgeGap: document.getElementById('badgeGap'),
    pageMargin: document.getElementById('pageMargin'),
    badgeSizePresets: document.getElementById('badgeSizePresets'),
    participantDialog: document.getElementById('participantDialog'),
    participantForm: document.getElementById('participantForm'),
    participantFormFields: document.getElementById('participantFormFields'),
    participantDialogTitle: document.getElementById('participantDialogTitle'),
    importDialog: document.getElementById('importDialog'),
    importForm: document.getElementById('importForm'),
    importTextarea: document.getElementById('importTextarea'),
    templateEditorDialog: document.getElementById('templateEditorDialog'),
    templateEditorForm: document.getElementById('templateEditorForm'),
    templateEditorTitle: document.getElementById('templateEditorTitle'),
    templateName: document.getElementById('templateName'),
    templateDescriptionInput: document.getElementById('templateDescriptionInput'),
    templateFieldsContainer: document.getElementById('templateFieldsContainer'),
    templateMarkup: document.getElementById('templateMarkup'),
    templateStyles: document.getElementById('templateStyles'),
    templateBadgeWidth: document.getElementById('templateBadgeWidth'),
    templateBadgeHeight: document.getElementById('templateBadgeHeight'),
    addTemplateFieldButton: document.getElementById('addTemplateFieldButton'),
    deleteTemplateButton: document.getElementById('deleteTemplateButton'),
    activeTemplateStyle: document.getElementById('activeTemplateStyle'),
    layoutStyle: document.getElementById('layoutStyle'),
};

let currentTemplate = null;
let participantDialogMode = 'create';
let editingParticipantId = null;
let searchTerm = '';
let templateDialogMode = 'create';
let editingTemplateId = null;
let editingTemplateFields = [];
let markupCodeEditor = null;
let stylesCodeEditor = null;

bootstrap();

async function bootstrap() {
    try {
        await templateManager.load();
    } catch (error) {
        console.warn('Не удалось загрузить список шаблонов, будут использованы встроенные варианты.', error);
    }
    initialize();
}

function initialize() {
    setupEventListeners();
    initializeCodeEditors();
    renderSizePresets();
    populateTemplateSelect();
    ensureInitialTemplate().then(() => {
        syncSettingsInputs(state.getSettings());
        renderParticipants();
        renderPreview();
        updatePreviewInfo();
    });
}

function initializeCodeEditors() {
    if (typeof CodeEditorAPI.attach !== 'function') {
        return;
    }
    if (elements.templateMarkup) {
        markupCodeEditor = CodeEditorAPI.attach(elements.templateMarkup);
    }
    if (elements.templateStyles) {
        stylesCodeEditor = CodeEditorAPI.attach(elements.templateStyles);
    }
}

function setupEventListeners() {
    state.addEventListener('participants', () => {
        renderParticipants();
        renderPreview();
        updatePreviewInfo();
        updateTemplateSample(currentTemplate);
    });

    state.addEventListener('selection', () => {
        renderParticipants();
        renderPreview();
        updatePreviewInfo();
    });

    state.addEventListener('settings', (event) => {
        syncSettingsInputs(event.detail.settings);
        renderPreview();
        updatePreviewInfo();
    });

    state.addEventListener('template', (event) => {
        const {id} = event.detail;
        loadTemplate(id, {applyDefaults: true});
    });

    if (elements.templateSelect) {
        elements.templateSelect.addEventListener('change', (event) => {
            const id = event.target.value;
            if (id) {
                state.setTemplate(id);
            }
        });
    }

    if (elements.customizeTemplateButton) {
        elements.customizeTemplateButton.addEventListener('click', () => {
            if (!currentTemplate) {
                return;
            }
            openTemplateDialog();
        });
    }

    elements.printButton?.addEventListener('click', () => {
        window.print();
    });

    elements.exportButton?.addEventListener('click', exportParticipants);

    elements.importButton?.addEventListener('click', () => {
        elements.importTextarea.value = '';
        elements.importDialog.showModal();
    });

    elements.importForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        if (event.submitter && event.submitter.value === 'cancel') {
            elements.importDialog.close('cancel');
            return;
        }
        importParticipants();
    });

    elements.clearParticipantsButton?.addEventListener('click', () => {
        if (state.participants.length === 0) {
            return;
        }
        if (confirm('Очистить список участников? Отменить действие будет нельзя.')) {
            state.clearParticipants();
        }
    });

    elements.resetSettingsButton?.addEventListener('click', () => {
        state.resetSettings();
    });

    elements.clearStorageButton?.addEventListener('click', () => {
        if (confirm('Сбросить все данные, включая шаблоны и участников?')) {
            state.wipe();
            templateManager.clearCustom();
            populateTemplateSelect();
            ensureInitialTemplate();
        }
    });

    elements.addParticipantButton?.addEventListener('click', () => {
        openParticipantDialog('create');
    });

    elements.participantForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        if (event.submitter && event.submitter.value === 'cancel') {
            elements.participantDialog.close('cancel');
            return;
        }
        submitParticipantForm();
    });

    elements.participantDialog?.addEventListener('close', () => {
        editingParticipantId = null;
        participantDialogMode = 'create';
    });

    elements.importDialog?.addEventListener('close', () => {
        elements.importTextarea.value = '';
    });

    elements.templateEditorForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        if (event.submitter && event.submitter.value === 'cancel') {
            elements.templateEditorDialog.close('cancel');
            return;
        }
        submitTemplateForm();
    });

    elements.templateEditorDialog?.addEventListener('close', () => {
        editingTemplateId = null;
        templateDialogMode = 'create';
        editingTemplateFields = [];
    });

    elements.addTemplateFieldButton?.addEventListener('click', () => {
        addTemplateField();
    });

    elements.templateFieldsContainer?.addEventListener('input', handleTemplateFieldChange);
    elements.templateFieldsContainer?.addEventListener('change', handleTemplateFieldChange);
    elements.templateFieldsContainer?.addEventListener('click', handleTemplateFieldClick);

    elements.badgeSizePresets?.addEventListener('click', (event) => {
        const button = event.target.closest('button.size-preset');
        if (!button) {
            return;
        }
        const width = Number(button.dataset.width);
        const height = Number(button.dataset.height);
        if (!Number.isFinite(width) || !Number.isFinite(height)) {
            return;
        }
        applySizePreset(width, height);
    });

    elements.participantSearch?.addEventListener('input', debounce((event) => {
        searchTerm = event.target.value.trim().toLowerCase();
        renderParticipants();
    }, 150));

    elements.deleteSelectedButton?.addEventListener('click', () => {
        const selected = [...state.getSelection()];
        if (selected.length === 0) {
            return;
        }
        if (confirm(`Удалить ${selected.length} выбранных участника?`)) {
            state.deleteParticipants(selected);
        }
    });

    elements.selectionTools?.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) {
            return;
        }
        const action = button.dataset.action;
        if (action === 'select-all') {
            state.selectAll();
        } else if (action === 'clear-selection') {
            state.clearSelection();
        } else if (action === 'invert-selection') {
            state.invertSelection();
        }
    });

    elements.participantList?.addEventListener('change', (event) => {
        const checkbox = event.target.closest('input[type="checkbox"][data-participant]');
        if (!checkbox) {
            return;
        }
        const id = checkbox.dataset.participant;
        state.toggleSelection(id);
    });

    elements.participantList?.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) {
            return;
        }
        const id = button.dataset.id;
        const action = button.dataset.action;
        if (action === 'edit') {
            openParticipantDialog('edit', id);
        } else if (action === 'duplicate') {
            duplicateParticipant(id);
        } else if (action === 'delete') {
            state.deleteParticipant(id);
        }
    });

    elements.printArea?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-preview-action]');
        if (!button) {
            return;
        }
        const id = button.dataset.id;
        const action = button.dataset.previewAction;
        if (!id) {
            return;
        }
        if (action === 'edit') {
            openParticipantDialog('edit', id);
        } else if (action === 'delete') {
            if (confirm('Удалить этого участника?')) {
                state.deleteParticipant(id);
            }
        }
    });

    [elements.participantDialog, elements.importDialog, elements.templateEditorDialog]
        .filter(Boolean)
        .forEach((dialog) => {
            dialog.addEventListener('mousedown', (event) => {
                const form = dialog.querySelector('form');
                if (!form) {
                    return;
                }
                const rect = form.getBoundingClientRect();
                const inside = event.clientX >= rect.left && event.clientX <= rect.right
                    && event.clientY >= rect.top && event.clientY <= rect.bottom;
                if (!inside) {
                    event.preventDefault();
                    dialog.close('cancel');
                }
            });
        });

    elements.pageSizeSelect?.addEventListener('change', (event) => {
        const value = event.target.value;
        const settings = {};
        if (value !== 'Custom') {
            settings.pageSize = value;
            if (value in PAGE_SIZES) {
                const base = PAGE_SIZES[value];
                settings.customPageWidth = base.width;
                settings.customPageHeight = base.height;
            }
        } else {
            settings.pageSize = 'Custom';
        }
        state.setSettings(settings);
    });

    elements.customPageWidth?.addEventListener('input', debounce(() => {
        updateNumericSetting('customPageWidth', elements.customPageWidth, {min: 50, max: 1000, fallback: 210});
    }, 150));
    elements.customPageHeight?.addEventListener('input', debounce(() => {
        updateNumericSetting('customPageHeight', elements.customPageHeight, {min: 50, max: 1000, fallback: 297});
    }, 150));
    elements.badgeWidth?.addEventListener('input', debounce(() => {
        updateNumericSetting('badgeWidth', elements.badgeWidth, {min: 20, max: 300, fallback: 90});
    }, 150));
    elements.badgeHeight?.addEventListener('input', debounce(() => {
        updateNumericSetting('badgeHeight', elements.badgeHeight, {min: 20, max: 300, fallback: 55});
    }, 150));
    elements.badgeGap?.addEventListener('input', debounce(() => {
        updateNumericSetting('gap', elements.badgeGap, {min: 0, max: 50, fallback: 4});
    }, 150));
    elements.pageMargin?.addEventListener('input', debounce(() => {
        updateNumericSetting('margin', elements.pageMargin, {min: 0, max: 40, fallback: 10});
    }, 150));

    elements.orientationInputs?.forEach((input) => {
        input.addEventListener('change', (event) => {
            if (event.target.checked) {
                state.setSettings({orientation: event.target.value});
            }
        });
    });
}

function populateTemplateSelect() {
    const templates = templateManager.list();
    if (!elements.templateSelect) {
        return;
    }
    elements.templateSelect.innerHTML = '';
    if (templates.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Шаблоны не найдены';
        elements.templateSelect.appendChild(option);
        elements.templateSelect.disabled = true;
        return;
    }
    elements.templateSelect.disabled = false;
    const fragment = document.createDocumentFragment();
    templates.forEach((template) => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        if (templateManager.isCustom(template.id)) {
            option.textContent += ' •';
        }
        fragment.appendChild(option);
    });
    elements.templateSelect.appendChild(fragment);
}

function renderSizePresets() {
    if (!elements.badgeSizePresets) {
        return;
    }
    const fragment = document.createDocumentFragment();
    SIZE_PRESETS.forEach((preset) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'size-preset';
        button.dataset.width = String(preset.width);
        button.dataset.height = String(preset.height);
        button.dataset.presetId = preset.id;
        button.textContent = `${preset.label} мм`;
        fragment.appendChild(button);
    });
    elements.badgeSizePresets.innerHTML = '';
    elements.badgeSizePresets.appendChild(fragment);
    updateSizePresetHighlight(state.getSettings());
}

function updateSizePresetHighlight(settings) {
    if (!elements.badgeSizePresets) {
        return;
    }
    const buttons = elements.badgeSizePresets.querySelectorAll('.size-preset');
    buttons.forEach((button) => {
        const width = Number(button.dataset.width);
        const height = Number(button.dataset.height);
        const isActive = matchPreset(settings, {width, height});
        button.classList.toggle('active', isActive);
    });
}

function matchPreset(settings, preset) {
    if (!settings) {
        return false;
    }
    const tolerance = 0.05;
    return Math.abs((settings.badgeWidth ?? 0) - preset.width) <= tolerance
        && Math.abs((settings.badgeHeight ?? 0) - preset.height) <= tolerance;
}

function applySizePreset(width, height) {
    const updates = {
        badgeWidth: width,
        badgeHeight: height,
    };
    state.setSettings(updates);
    updateSizePresetHighlight(state.getSettings());
    if (elements.badgeWidth) {
        elements.badgeWidth.value = width;
    }
    if (elements.badgeHeight) {
        elements.badgeHeight.value = height;
    }
}

async function ensureInitialTemplate() {
    const templates = templateManager.list();
    if (templates.length === 0) {
        currentTemplate = null;
        elements.templateDescription.textContent = 'Добавьте новый шаблон, чтобы начать работу.';
        elements.activeTemplateStyle.textContent = '';
        updateTemplateSample(null);
        return;
    }
    const exists = templates.some((item) => item.id === state.templateId);
    if (!state.templateId || !exists) {
        const defaultTemplate = templates[0];
        state.setTemplate(defaultTemplate.id);
        return;
    }
    await loadTemplate(state.templateId, {applyDefaults: false});
}

async function loadTemplate(id, {applyDefaults} = {applyDefaults: false}) {
    if (!id) {
        currentTemplate = null;
        elements.templateDescription.textContent = 'Выберите шаблон, чтобы увидеть предпросмотр.';
        elements.activeTemplateStyle.textContent = '';
        updateTemplateSample(null);
        renderPreview();
        renderParticipants();
        return;
    }
    const template = await templateManager.getById(id);
    if (!template) {
        console.warn(`Не удалось загрузить шаблон ${id}`);
        return;
    }
    currentTemplate = template;
    if (elements.templateSelect && elements.templateSelect.value !== id) {
        elements.templateSelect.value = id;
    }
    elements.templateDescription.textContent = template.description || 'Шаблон без описания.';
    applyTemplateStyles(template.styles);
    updateTemplateSample(template);
    if (applyDefaults) {
        applyTemplateDefaults(template);
    }
    renderParticipants();
    renderPreview();
    updatePreviewInfo();
}

function applyTemplateStyles(styles) {
    elements.activeTemplateStyle.textContent = styles || '';
}

function updateTemplateSample(template) {
    if (!elements.templateSample) {
        return;
    }
    if (!template) {
        elements.templateSample.textContent = '[]';
        return;
    }
    const sampleObject = buildTemplateSample(template);
    if (!sampleObject || Object.keys(sampleObject).length === 0) {
        elements.templateSample.textContent = '[]';
        return;
    }
    elements.templateSample.textContent = JSON.stringify([sampleObject], null, 2);
}

function buildTemplateSample(template) {
    const fields = Array.isArray(template.fields) ? template.fields : [];
    const participants = state.participants || [];
    const base = participants.length > 0 ? {...participants[0].values} : {};

    if (fields.length === 0) {
        return Object.keys(base).length > 0 ? base : null;
    }

    const sample = {};
    fields.forEach((field, index) => {
        const key = field.id || `field_${index}`;
        let value = base[key];
        if (value === undefined || value === null || value === '') {
            value = exampleValueForField(field, index);
        }
        sample[key] = value;
    });

    return sample;
}

function exampleValueForField(field, index) {
    const key = (field.id || '').toLowerCase();
    const label = (field.label || '').toLowerCase();
    const source = key || label;

    if (source.includes('lastname') || source.includes('surname') || source.includes('фам')) {
        return 'Иванов';
    }
    if (source.includes('firstname') || source.includes('given') || source.includes('имя')) {
        return 'Иван';
    }
    if (source.includes('middlename') || source.includes('отч')) {
        return 'Иванович';
    }
    if (source.includes('company') || source.includes('org') || source.includes('компан')) {
        return 'Компания «Пример»';
    }
    if (source.includes('role') || source.includes('роль')) {
        return 'member';
    }
    if (source.includes('nameorder')) {
        return 'eastern';
    }
    if (source.includes('city') || source.includes('город')) {
        return 'Москва';
    }
    if (source.includes('tagline') || source.includes('track')) {
        return 'Main Stage';
    }
    if (source.includes('job') || source.includes('position') || source.includes('должн')) {
        return 'Инженер-исследователь';
    }
    if (source.includes('email')) {
        return 'example@example.com';
    }
    if (source.includes('phone')) {
        return '+7 (900) 000-00-00';
    }
    const baseValue = field.placeholder || field.label;
    if (baseValue) {
        return baseValue;
    }
    return `value_${index + 1}`;
}

function buildTemplateContext(template, values) {
    const context = deepClone(values || {});
    const defaults = template?.defaultSettings || {};
    const nameOrder = String(context.nameOrder || defaults.nameOrder || 'western').toLowerCase();

    let explicitName = typeof context.name === 'string' ? context.name.trim() : '';
    const tokens = explicitName ? explicitName.split(/\s+/) : [];

    let firstName = context.firstName && String(context.firstName).trim();
    let lastName = context.lastName && String(context.lastName).trim();
    let middleName = context.middleName && String(context.middleName).trim();

    if (!firstName || !lastName) {
        if (nameOrder === 'western') {
            if (tokens.length === 1) {
                firstName = firstName || tokens[0];
            } else if (tokens.length >= 2) {
                firstName = firstName || tokens[0];
                lastName = lastName || tokens[tokens.length - 1];
                if (!middleName && tokens.length > 2) {
                    middleName = tokens.slice(1, -1).join(' ');
                }
            }
        } else {
            if (tokens.length === 1) {
                lastName = lastName || tokens[0];
            } else if (tokens.length >= 2) {
                lastName = lastName || tokens[0];
                firstName = firstName || tokens[1];
                if (!middleName && tokens.length > 2) {
                    middleName = tokens.slice(2).join(' ');
                }
            }
        }
    }

    if (!explicitName) {
        explicitName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
    }

    context.name = explicitName;
    context.displayFirstName = firstName || '';
    context.displayLastName = lastName || '';
    context.displayMiddleName = middleName || '';
    context.displayName = explicitName;

    return context;
}

function applyTemplateDefaults(template) {
    const updates = {};
    if (template.badgeSize) {
        updates.badgeWidth = template.badgeSize.width;
        updates.badgeHeight = template.badgeSize.height;
    }
    if (template.defaultSettings && typeof template.defaultSettings === 'object') {
        Object.assign(updates, template.defaultSettings);
    }
    if (Object.keys(updates).length > 0) {
        state.setSettings(updates);
    }
}

function syncSettingsInputs(settings) {
    if (!settings) {
        return;
    }
    if (elements.pageSizeSelect) {
        const existing = Array.from(elements.pageSizeSelect.options).some((option) => option.value === settings.pageSize);
        elements.pageSizeSelect.value = existing ? settings.pageSize : 'Custom';
    }
    if (elements.customPageSizeFields) {
        const isCustom = settings.pageSize === 'Custom' || !PAGE_SIZES[settings.pageSize];
        elements.customPageSizeFields.style.display = isCustom ? 'grid' : 'none';
        if (isCustom) {
            elements.customPageWidth.value = settings.customPageWidth ?? '';
            elements.customPageHeight.value = settings.customPageHeight ?? '';
        } else if (PAGE_SIZES[settings.pageSize]) {
            const base = PAGE_SIZES[settings.pageSize];
            elements.customPageWidth.value = base.width;
            elements.customPageHeight.value = base.height;
        }
    }

    elements.orientationInputs?.forEach((input) => {
        input.checked = input.value === settings.orientation;
    });
    if (elements.badgeWidth) {
        elements.badgeWidth.value = settings.badgeWidth ?? '';
    }
    if (elements.badgeHeight) {
        elements.badgeHeight.value = settings.badgeHeight ?? '';
    }
    if (elements.badgeGap) {
        elements.badgeGap.value = settings.gap ?? '';
    }
    if (elements.pageMargin) {
        elements.pageMargin.value = settings.margin ?? '';
    }
    updateSizePresetHighlight(settings);
    updateLayoutStyles();
}

function updateLayoutStyles() {
    const settings = state.getSettings();
    const {pageWidth, pageHeight} = resolvePageSize(settings);
    const css = `
@page {
    size: ${pageWidth}mm ${pageHeight}mm;
    margin: ${settings.margin}mm;
}
`;
    elements.layoutStyle.textContent = css;
}

function renderParticipants() {
    if (!elements.participantList) {
        return;
    }
    const participants = state.participants || [];
    const selection = state.getSelection();
    const container = elements.participantList;
    container.innerHTML = '';

    const filtered = participants.filter((participant) => {
        if (!searchTerm) {
            return true;
        }
        const values = participant.values || {};
        return Object.values(values).some((value) => value && value.toLowerCase().includes(searchTerm));
    });

    if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = participants.length === 0
            ? 'Добавьте участников, чтобы сгенерировать бейджи.'
            : 'Совпадений не найдено. Измените текст поиска.';
        container.appendChild(empty);
        return;
    }

    const fragment = document.createDocumentFragment();
    filtered.forEach((participant) => {
        fragment.appendChild(createParticipantCard(participant, selection));
    });
    container.appendChild(fragment);
}

function createParticipantCard(participant, selection) {
    const item = document.createElement('div');
    item.className = 'participant-item';
    item.dataset.id = participant.id;

    const values = participant.values || {};
    const fields = Array.isArray(currentTemplate?.fields) && currentTemplate.fields.length > 0
        ? currentTemplate.fields
        : inferFields(values);

    const primaryField = fields[0]?.id || 'name';
    const primaryValue = values[primaryField] || values.name || 'Без имени';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selection.has(participant.id);
    checkbox.dataset.participant = participant.id;

    const name = document.createElement('div');
    name.className = 'participant-name';
    name.textContent = primaryValue;

    const actions = document.createElement('div');
    actions.className = 'participant-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.dataset.action = 'edit';
    editButton.dataset.id = participant.id;
    editButton.textContent = '✎';
    editButton.title = 'Редактировать';

    const duplicateButton = document.createElement('button');
    duplicateButton.type = 'button';
    duplicateButton.dataset.action = 'duplicate';
    duplicateButton.dataset.id = participant.id;
    duplicateButton.textContent = '⧉';
    duplicateButton.title = 'Дублировать';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.id = participant.id;
    deleteButton.className = 'danger';
    deleteButton.textContent = '✕';
    deleteButton.title = 'Удалить';

    actions.appendChild(editButton);
    actions.appendChild(duplicateButton);
    actions.appendChild(deleteButton);

    item.appendChild(checkbox);
    item.appendChild(name);
    item.appendChild(actions);
    return item;
}

function inferFields(values) {
    return Object.keys(values).map((key) => ({
        id: key,
        label: key,
        type: 'text',
        required: false,
    }));
}

function renderPreview() {
    const container = elements.printArea;
    if (!container) {
        return;
    }
    container.innerHTML = '';
    if (!currentTemplate || !currentTemplate.markup) {
        const placeholder = document.createElement('div');
        placeholder.className = 'empty-state';
        placeholder.textContent = 'Выберите шаблон, чтобы увидеть предпросмотр.';
        container.appendChild(placeholder);
        return;
    }
    const selection = state.getSelection();
    const selected = state.participants.filter((item) => selection.has(item.id));
    if (selected.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'empty-state';
        placeholder.textContent = 'Выберите участников, чтобы сформировать страницы для печати.';
        container.appendChild(placeholder);
        return;
    }

    const settings = state.getSettings();
    const layout = computeLayout(settings);
    const perPage = Math.max(1, layout.perPage);
    const pages = chunkArray(selected, perPage);

    const fragment = document.createDocumentFragment();
    pages.forEach((pageItems, index) => {
        fragment.appendChild(renderPreviewPage(pageItems, index, layout));
    });
    container.appendChild(fragment);
}

function renderPreviewPage(items, index, layout) {
    const page = document.createElement('div');
    page.className = 'page';
    page.setAttribute('data-page', `Страница ${index + 1}`);
    page.style.width = mm(layout.pageWidth);
    page.style.height = mm(layout.pageHeight);
    page.style.setProperty('--page-inner-gap', mm(layout.margin));

    const grid = document.createElement('div');
    grid.className = 'badge-grid';
    grid.style.setProperty('--columns', layout.columns);
    grid.style.setProperty('--badge-width', mm(layout.badgeWidth));
    grid.style.setProperty('--badge-height', mm(layout.badgeHeight));
    grid.style.setProperty('--gap', mm(layout.gap));

    items.forEach((participant) => {
        const badgeWrapper = document.createElement('div');
        badgeWrapper.className = 'badge-item';
        badgeWrapper.dataset.participantId = participant.id;
        const context = buildTemplateContext(currentTemplate, participant.values);
        const markup = renderTemplateString(currentTemplate.markup, context);
        badgeWrapper.innerHTML = markup;

        const controls = document.createElement('div');
        controls.className = 'badge-controls';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'badge-control-button';
        editButton.dataset.previewAction = 'edit';
        editButton.dataset.id = participant.id;
        editButton.title = 'Редактировать участника';
        editButton.setAttribute('aria-label', 'Редактировать участника');
        editButton.textContent = '✎';

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'badge-control-button danger';
        deleteButton.dataset.previewAction = 'delete';
        deleteButton.dataset.id = participant.id;
        deleteButton.title = 'Удалить участника';
        deleteButton.setAttribute('aria-label', 'Удалить участника');
        deleteButton.textContent = '✕';

        controls.appendChild(editButton);
        controls.appendChild(deleteButton);
        badgeWrapper.appendChild(controls);

        grid.appendChild(badgeWrapper);
    });

    // Fill empty cells so the grid stays aligned
    const totalCells = layout.columns * layout.rows;
    const missing = totalCells - items.length;
    for (let i = 0; i < missing; i += 1) {
        const filler = document.createElement('div');
        filler.className = 'badge-item';
        grid.appendChild(filler);
    }

    page.appendChild(grid);
    return page;
}

function updatePreviewInfo() {
    if (!elements.previewInfo) {
        return;
    }
    const total = state.participants.length;
    const selected = state.getSelection().size;
    if (!currentTemplate || selected === 0) {
        elements.previewInfo.textContent = `${selected} из ${total} участников выбрано`;
        return;
    }
    const layout = computeLayout(state.getSettings());
    const perPage = Math.max(1, layout.perPage);
    const pageCount = Math.max(1, Math.ceil(selected / perPage));
    elements.previewInfo.textContent = `${selected} из ${total} участников · ${layout.columns} × ${layout.rows} бейджей на страницу · ${pageCount} ${decline(pageCount, 'страница', 'страницы', 'страниц')}`;
}

function computeLayout(settings) {
    const {pageWidth, pageHeight} = resolvePageSize(settings);
    const margin = clamp(settings.margin ?? 10, 0, Math.min(pageWidth, pageHeight) / 3);
    const usableWidth = Math.max(pageWidth - margin * 2, 20);
    const usableHeight = Math.max(pageHeight - margin * 2, 20);
    const badgeWidth = clamp(settings.badgeWidth ?? 90, 20, 300);
    const badgeHeight = clamp(settings.badgeHeight ?? 55, 20, 300);
    const gap = clamp(settings.gap ?? 4, 0, 50);

    const columns = Math.max(1, Math.floor((usableWidth + gap) / (badgeWidth + gap)));
    const rows = Math.max(1, Math.floor((usableHeight + gap) / (badgeHeight + gap)));
    const perPage = Math.max(1, columns * rows);

    return {
        pageWidth,
        pageHeight,
        margin,
        badgeWidth,
        badgeHeight,
        gap,
        columns,
        rows,
        perPage,
    };
}

function resolvePageSize(settings) {
    let width;
    let height;
    if (settings.pageSize === 'Custom') {
        width = clamp(settings.customPageWidth ?? 210, 50, 1000);
        height = clamp(settings.customPageHeight ?? 297, 50, 1000);
    } else if (settings.pageSize && PAGE_SIZES[settings.pageSize]) {
        width = PAGE_SIZES[settings.pageSize].width;
        height = PAGE_SIZES[settings.pageSize].height;
    } else {
        width = 210;
        height = 297;
    }
    if (settings.orientation === 'landscape') {
        return {pageWidth: height, pageHeight: width};
    }
    return {pageWidth: width, pageHeight: height};
}

function openParticipantDialog(mode, id = null) {
    participantDialogMode = mode;
    editingParticipantId = id;
    const fields = currentTemplate?.fields;
    const values = mode === 'edit' ? getParticipantValues(id) : {};
    renderParticipantForm(fields, values);
    elements.participantDialogTitle.textContent = mode === 'edit' ? 'Редактирование участника' : 'Новый участник';
    elements.participantDialog.showModal();
}

function renderParticipantForm(fields, values) {
    const container = elements.participantFormFields;
    container.innerHTML = '';
    const templateFields = Array.isArray(fields) && fields.length > 0
        ? deepClone(fields)
        : inferFields(values);
    if (templateFields.length === 0) {
        templateFields.push({
            id: 'name',
            label: 'Имя',
            type: 'text',
            required: true,
        });
    }
    const fragment = document.createDocumentFragment();
    templateFields.forEach((field) => {
        fragment.appendChild(createParticipantField(field, values[field.id] || ''));
    });
    container.appendChild(fragment);
}

function createParticipantField(field, value) {
    const wrapper = document.createElement('label');
    wrapper.className = 'field';
    const title = document.createElement('span');
    title.textContent = field.label || field.id;
    wrapper.appendChild(title);
    let control;
    if (field.type === 'textarea') {
        control = document.createElement('textarea');
        control.rows = 3;
    } else {
        control = document.createElement('input');
        control.type = 'text';
    }
    control.name = field.id;
    control.required = Boolean(field.required);
    control.value = value || '';
    if (field.placeholder) {
        control.placeholder = field.placeholder;
    }
    wrapper.appendChild(control);
    return wrapper;
}

function getParticipantValues(id) {
    const participant = state.participants.find((item) => item.id === id);
    return participant ? deepClone(participant.values) : {};
}

function submitParticipantForm() {
    const formData = new FormData(elements.participantForm);
    const values = {};
    formData.forEach((value, key) => {
        values[key] = String(value).trim();
    });
    if (participantDialogMode === 'edit' && editingParticipantId) {
        state.updateParticipant(editingParticipantId, values);
    } else {
        state.addParticipant(values);
    }
    elements.participantDialog.close();
}

function duplicateParticipant(id) {
    const participant = state.participants.find((item) => item.id === id);
    if (!participant) {
        return;
    }
    const copy = deepClone(participant.values);
    if (copy.name) {
        copy.name = `${copy.name} (копия)`;
    }
    state.addParticipant(copy);
}

function importParticipants() {
    const raw = elements.importTextarea.value.trim();
    if (!raw) {
        elements.importDialog.close();
        return;
    }
    try {
        const parsed = JSON.parse(raw);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        let added = 0;
        items.forEach((item) => {
            if (item && typeof item === 'object' && !Array.isArray(item)) {
                state.addParticipant(item);
                added += 1;
            }
        });
        elements.importDialog.close();
        if (added === 0) {
            alert('Не удалось найти подходящих объектов для импорта.');
        }
    } catch (error) {
        alert('Ошибка разбора JSON. Проверьте формат данных.');
        console.warn('Импорт JSON: не удалось разобрать строку', error);
    }
}

function exportParticipants() {
    const data = state.participants.map((participant) => participant.values);
    if (data.length === 0) {
        alert('Список участников пуст.');
        return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `badge-participants-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function updateNumericSetting(key, element, {min, max, fallback}) {
    if (!element) {
        return;
    }
    const value = clamp(toNumber(element.value, fallback), min, max);
    element.value = value;
    state.setSettings({[key]: value});
}

function openTemplateDialog() {
    if (!currentTemplate) {
        return;
    }
    const isCustom = templateManager.isCustom(currentTemplate.id);
    templateDialogMode = isCustom ? 'edit' : 'create';
    editingTemplateId = isCustom ? currentTemplate.id : null;
    elements.templateEditorTitle.textContent = isCustom ? 'Редактирование шаблона' : 'Новый шаблон на основе выбранного';
    elements.templateName.value = isCustom ? currentTemplate.name : `${currentTemplate.name} (копия)`;
    elements.templateDescriptionInput.value = currentTemplate.description || '';
    const markupValue = currentTemplate.markup || '';
    const stylesValue = currentTemplate.styles || '';
    if (markupCodeEditor) {
        markupCodeEditor.setValue(markupValue);
    } else {
        elements.templateMarkup.value = markupValue;
    }
    if (stylesCodeEditor) {
        stylesCodeEditor.setValue(stylesValue);
    } else {
        elements.templateStyles.value = stylesValue;
    }
    elements.templateBadgeWidth.value = currentTemplate.badgeSize?.width ?? 90;
    elements.templateBadgeHeight.value = currentTemplate.badgeSize?.height ?? 55;
    editingTemplateFields = deepClone(currentTemplate.fields || []);
    if (editingTemplateFields.length === 0) {
        editingTemplateFields = [
            {id: 'name', label: 'Имя', type: 'text', required: true},
        ];
    }
    renderTemplateFields();
    elements.deleteTemplateButton.style.display = isCustom ? 'inline-flex' : 'none';
    if (markupCodeEditor) {
        requestAnimationFrame(() => {
            markupCodeEditor.refresh();
        });
    }
    if (stylesCodeEditor) {
        requestAnimationFrame(() => {
            stylesCodeEditor.refresh();
        });
    }
    elements.templateEditorDialog.showModal();
}

function renderTemplateFields() {
    const container = elements.templateFieldsContainer;
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    editingTemplateFields.forEach((field, index) => {
        fragment.appendChild(createTemplateFieldRow(field, index));
    });
    container.appendChild(fragment);
    syncMarkupPlaceholders();
}

function syncMarkupPlaceholders() {
    if (!markupCodeEditor) {
        return;
    }
    const placeholders = editingTemplateFields.map((field) => field.id).filter((id) => Boolean(id));
    markupCodeEditor.setPlaceholders(placeholders);
}

function createTemplateFieldRow(field, index) {
    const row = document.createElement('div');
    row.className = 'template-field-row';
    row.dataset.index = String(index);

    row.innerHTML = `
        <label class="field">
            <span>Код</span>
            <input type="text" value="${escapeHTML(field.id)}" data-field="id" required>
        </label>
        <label class="field">
            <span>Подпись</span>
            <input type="text" value="${escapeHTML(field.label || '')}" data-field="label">
        </label>
        <label class="field">
            <span>Тип</span>
            <select data-field="type">
                <option value="text"${field.type !== 'textarea' ? ' selected' : ''}>Текст</option>
                <option value="textarea"${field.type === 'textarea' ? ' selected' : ''}>Многострочный</option>
            </select>
        </label>
        <div class="field-actions">
            <label>
                <input type="checkbox" data-field="required"${field.required ? ' checked' : ''}>
                <span>Обязательно</span>
            </label>
            <button type="button" class="ghost small danger" data-action="remove-field">Удалить</button>
        </div>
    `;
    return row;
}

function handleTemplateFieldChange(event) {
    const row = event.target.closest('.template-field-row');
    if (!row) {
        return;
    }
    const index = Number(row.dataset.index);
    const field = editingTemplateFields[index];
    if (!field) {
        return;
    }
    const key = event.target.dataset.field;
    if (!key) {
        return;
    }
    if (key === 'required') {
        field.required = event.target.checked;
    } else if (key === 'type') {
        field.type = event.target.value === 'textarea' ? 'textarea' : 'text';
    } else if (key === 'id') {
        field.id = sanitizeFieldId(event.target.value);
        event.target.value = field.id;
    } else if (key === 'label') {
        field.label = event.target.value;
    }
    syncMarkupPlaceholders();
}

function handleTemplateFieldClick(event) {
    const button = event.target.closest('button[data-action="remove-field"]');
    if (!button) {
        return;
    }
    const row = button.closest('.template-field-row');
    if (!row) {
        return;
    }
    const index = Number(row.dataset.index);
    if (editingTemplateFields.length <= 1) {
        alert('В шаблоне должно остаться как минимум одно поле.');
        return;
    }
    editingTemplateFields.splice(index, 1);
    renderTemplateFields();
}

function addTemplateField() {
    const index = editingTemplateFields.length + 1;
    editingTemplateFields.push({
        id: `field_${index}`,
        label: `Поле ${index}`,
        type: 'text',
        required: false,
    });
    renderTemplateFields();
}

function sanitizeFieldId(value) {
    if (!value) {
        return createId('field');
    }
    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^\w-]+/g, '')
        || createId('field');
}

function submitTemplateForm() {
    const name = elements.templateName.value.trim();
    if (!name) {
        alert('Введите название шаблона.');
        return;
    }
    const badgeWidth = toNumber(elements.templateBadgeWidth.value, 90);
    const badgeHeight = toNumber(elements.templateBadgeHeight.value, 55);
    const fields = editingTemplateFields
        .map((field) => ({
            ...field,
            id: sanitizeFieldId(field.id),
            label: field.label?.trim() || field.id,
        }));
    const uniqueIds = new Set();
    for (const field of fields) {
        if (uniqueIds.has(field.id)) {
            alert(`Код поля "${field.id}" используется несколько раз.`);
            return;
        }
        uniqueIds.add(field.id);
    }
    const templateData = {
        name,
        description: elements.templateDescriptionInput.value.trim(),
        fields,
        badgeSize: {width: badgeWidth, height: badgeHeight},
        markup: elements.templateMarkup.value,
        styles: elements.templateStyles.value,
    };

    let newId = editingTemplateId;
    const isEditingExisting = templateDialogMode === 'edit' && editingTemplateId;
    if (isEditingExisting) {
        templateManager.updateCustom(editingTemplateId, templateData);
        newId = editingTemplateId;
    } else {
        newId = templateManager.createCustom(templateData);
    }

    populateTemplateSelect();
    if (isEditingExisting) {
        state.setTemplate(newId, {force: true});
    } else {
        state.setTemplate(newId);
    }
    elements.templateEditorDialog.close();
}

elements.deleteTemplateButton?.addEventListener('click', () => {
    if (!editingTemplateId) {
        return;
    }
    if (confirm('Удалить пользовательский шаблон?')) {
        templateManager.deleteCustom(editingTemplateId);
        populateTemplateSelect();
        ensureInitialTemplate();
        elements.templateEditorDialog.close();
    }
});

function decline(count, one, few, many) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) {
        return one;
    }
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
        return few;
    }
    return many;
}

})(window);
