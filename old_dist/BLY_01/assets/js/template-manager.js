(function (global) {
    const {deepClone, createId} = global.BadgeUtils;
const PRESET_TEMPLATES = global.BadgeTemplatePresets || [];
const MANIFEST_TEMPLATES = global.BadgeTemplateManifest || [];
    const CUSTOM_TEMPLATES_KEY = 'customTemplates';

    class TemplateManager {
        constructor(store) {
            this.store = store;
            this.builtIn = new Map();
            this.custom = new Map();
            this.loaded = false;
        }

        async load(indexPath = 'templates/index.json') {
            await this._loadFromManifest(indexPath);
            if (this.builtIn.size === 0) {
                this._loadFromManifestArray(MANIFEST_TEMPLATES);
            }
            if (this.builtIn.size === 0) {
                this._loadFromPresets();
            }
            this._loadCustom();
            this.loaded = true;
        }

    async _loadFromManifest(indexPath) {
        if (window.location.protocol === 'file:') {
            return;
        }
        try {
            const response = await fetch(indexPath, {cache: 'no-store'});
                if (!response.ok) {
                    console.warn(`TemplateManager: не удалось получить ${indexPath}: ${response.status}`);
                    return;
                }
                const list = await response.json();
                if (!Array.isArray(list)) {
                    return;
                }
                list.forEach((item) => {
                    if (!item || !item.id) {
                        return;
                    }
                    const template = normalizeTemplate({
                        ...item,
                        builtIn: true,
                    });
                    this.builtIn.set(template.id, template);
                });
        } catch (error) {
            console.warn('TemplateManager: ошибка при загрузке списка шаблонов', error);
        }
    }

    _loadFromManifestArray(list) {
        if (!Array.isArray(list)) {
            return;
        }
        list.forEach((item) => {
            if (!item || !item.id || this.builtIn.has(item.id)) {
                return;
            }
            const template = normalizeTemplate({
                ...item,
                builtIn: true,
            });
            this.builtIn.set(template.id, template);
        });
    }

        _loadFromPresets() {
            PRESET_TEMPLATES.forEach((item) => {
                if (!item || !item.id || this.builtIn.has(item.id)) {
                    return;
                }
                const template = normalizeTemplate({
                    ...item,
                    builtIn: true,
                });
                this.builtIn.set(template.id, template);
            });
        }

        _loadCustom() {
            const saved = this.store.load(CUSTOM_TEMPLATES_KEY, []);
            if (!Array.isArray(saved)) {
                return;
            }
            saved.forEach((item) => {
                if (!item || !item.id) {
                    return;
                }
                const template = normalizeTemplate({
                    ...item,
                    builtIn: false,
                });
                this.custom.set(template.id, template);
            });
        }

        list() {
            const combined = [...this.builtIn.values(), ...this.custom.values()];
            return combined.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        }

        async getById(id) {
            const template = this.builtIn.get(id) || this.custom.get(id);
            if (!template) {
                return null;
            }
            if (!template.markup && template.markupPath) {
                template.markup = await this._fetchText(template.markupPath);
            }
            if (!template.styles && template.stylePath) {
                template.styles = await this._fetchText(template.stylePath);
            }
            return deepClone(template);
        }

        async _fetchText(path) {
            if (window.location.protocol === 'file:' && !/^https?:/i.test(path)) {
                return '';
            }
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    console.warn(`TemplateManager: ошибка загрузки файла ${path}: ${response.status}`);
                    return '';
                }
                return await response.text();
            } catch (error) {
                console.warn(`TemplateManager: ошибка при получении ${path}`, error);
                return '';
            }
        }

        isCustom(id) {
            return this.custom.has(id);
        }

        createCustom(template) {
            const id = template.id && !this.builtIn.has(template.id) && !this.custom.has(template.id)
                ? template.id
                : createId('template');
            const record = normalizeTemplate({
                ...template,
                id,
                builtIn: false,
            });
            this.custom.set(id, record);
            this._persistCustom();
            return id;
        }

        updateCustom(id, patch) {
            if (!this.custom.has(id)) {
                throw new Error(`TemplateManager: нельзя обновить несуществующий шаблон ${id}`);
            }
            const current = this.custom.get(id);
            const updated = normalizeTemplate({
                ...current,
                ...patch,
                id,
                builtIn: false,
            });
            this.custom.set(id, updated);
            this._persistCustom();
        }

        deleteCustom(id) {
            if (this.custom.delete(id)) {
                this._persistCustom();
                return true;
            }
            return false;
        }

        clearCustom() {
            if (this.custom.size === 0) {
                this.store.remove(CUSTOM_TEMPLATES_KEY);
                return;
            }
            this.custom.clear();
            this._persistCustom();
        }

        _persistCustom() {
            const data = [...this.custom.values()].map((item) => {
                const {builtIn, ...rest} = item;
                return rest;
            });
            if (data.length === 0) {
                this.store.remove(CUSTOM_TEMPLATES_KEY);
            } else {
                this.store.save(CUSTOM_TEMPLATES_KEY, data);
            }
        }
    }

    function sanitizeSize(size) {
        if (!size) {
            return null;
        }
        const width = Number(size.width);
        const height = Number(size.height);
        if (!Number.isFinite(width) || !Number.isFinite(height)) {
            return null;
        }
        return {width, height};
    }

    function normalizeTemplate(template) {
        const fields = Array.isArray(template.fields) ? template.fields : [];
        const normalizedFields = fields
            .filter(Boolean)
            .map((field) => ({
                id: field.id || field.name || createId('field'),
                label: field.label || field.id || 'Поле',
                type: field.type === 'textarea' ? 'textarea' : 'text',
                required: Boolean(field.required),
                placeholder: field.placeholder || '',
            }));

        return {
            id: template.id,
            name: template.name || 'Шаблон',
            description: template.description || '',
            fields: normalizedFields,
            badgeSize: sanitizeSize(template.badgeSize) || {width: 90, height: 55},
            markup: template.markup || '',
            styles: template.styles || '',
            markupPath: template.markupPath || null,
            stylePath: template.stylePath || null,
            defaultSettings: template.defaultSettings || null,
            builtIn: Boolean(template.builtIn),
        };
    }

    global.BadgeTemplateManager = {
        TemplateManager,
    };
})(window);
