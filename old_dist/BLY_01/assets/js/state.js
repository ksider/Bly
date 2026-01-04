(function (global) {
    const {LocalStore} = global.BadgeStorage;
    const {createId, deepClone} = global.BadgeUtils;

    const PARTICIPANTS_KEY = 'participants';
    const SETTINGS_KEY = 'settings';
    const SELECTION_KEY = 'selection';
    const TEMPLATE_KEY = 'templateId';

    const DEFAULT_SETTINGS = {
        pageSize: 'A4',
        orientation: 'landscape',
        customPageWidth: 210,
        customPageHeight: 297,
        badgeWidth: 96,
        badgeHeight: 73.5,
        gap: 4,
        margin: 10,
    };

    class AppState extends EventTarget {
        constructor(store = new LocalStore()) {
            super();
            this.store = store;
            this.participants = [];
            this.selection = new Set();
            this.settings = {...DEFAULT_SETTINGS};
            this.templateId = null;

            this._hydrate();
        }

        _hydrate() {
            const storedParticipants = this.store.load(PARTICIPANTS_KEY, []);
            if (Array.isArray(storedParticipants)) {
                this.participants = storedParticipants
                    .map((item) => this._normalizeParticipant(item))
                    .filter(Boolean);
            }

            const storedSettings = this.store.load(SETTINGS_KEY, {});
            if (storedSettings && typeof storedSettings === 'object') {
                this.settings = {...DEFAULT_SETTINGS, ...storedSettings};
            }

            const storedTemplateId = this.store.load(TEMPLATE_KEY, null);
            if (typeof storedTemplateId === 'string') {
                this.templateId = storedTemplateId;
            }

            const storedSelection = this.store.load(SELECTION_KEY, []);
            if (Array.isArray(storedSelection)) {
                this.selection = new Set(storedSelection);
                this._sanitizeSelection();
            }
        }

        _normalizeParticipant(input) {
            if (!input) {
                return null;
            }
            if (input.id && input.values) {
                return {
                    id: input.id,
                    values: {...input.values},
                    createdAt: input.createdAt || Date.now(),
                    updatedAt: input.updatedAt || input.createdAt || Date.now(),
                };
            }
            const values = {...input};
            delete values.id;
            delete values.createdAt;
            delete values.updatedAt;
            return {
                id: createId('participant'),
                values,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
        }

        _persistParticipants() {
            this.store.save(PARTICIPANTS_KEY, this.participants);
        }

        _persistSettings() {
            this.store.save(SETTINGS_KEY, this.settings);
        }

        _persistTemplate() {
            this.store.save(TEMPLATE_KEY, this.templateId);
        }

        _persistSelection() {
            this.store.save(SELECTION_KEY, [...this.selection]);
        }

        _emit(type, detail = {}) {
            this.dispatchEvent(new CustomEvent(type, {detail}));
        }

    setTemplate(id, options = {}) {
        const force = Boolean(options.force);
        if (!force && this.templateId === id) {
            return;
        }
        this.templateId = id;
        this._persistTemplate();
        this._emit('template', {id});
        }

        setSettings(patch) {
            this.settings = {...this.settings, ...patch};
            this._persistSettings();
            this._emit('settings', {settings: deepClone(this.settings)});
        }

        resetSettings() {
            this.settings = {...DEFAULT_SETTINGS};
            this._persistSettings();
            this._emit('settings', {settings: deepClone(this.settings)});
        }

        getSettings() {
            return deepClone(this.settings);
        }

        addParticipant(values) {
            const participant = {
                id: createId('participant'),
                values: deepClone(values),
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            this.participants = [...this.participants, participant];
            this._persistParticipants();
            this.selection.add(participant.id);
            this._persistSelection();
            this._emit('participants', {participants: deepClone(this.participants)});
            this._emit('selection', {selection: [...this.selection]});
            return participant.id;
        }

        updateParticipant(id, values) {
            let updated = false;
            this.participants = this.participants.map((item) => {
                if (item.id !== id) {
                    return item;
                }
                updated = true;
                return {
                    ...item,
                    values: deepClone(values),
                    updatedAt: Date.now(),
                };
            });
            if (updated) {
                this._persistParticipants();
                this._emit('participants', {participants: deepClone(this.participants)});
            }
        }

        deleteParticipant(id) {
            const before = this.participants.length;
            this.participants = this.participants.filter((item) => item.id !== id);
            if (this.participants.length !== before) {
                this._persistParticipants();
                this.selection.delete(id);
                this._persistSelection();
                this._emit('participants', {participants: deepClone(this.participants)});
                this._emit('selection', {selection: [...this.selection]});
            }
        }

        deleteParticipants(ids) {
            const idSet = new Set(ids);
            const before = this.participants.length;
            this.participants = this.participants.filter((item) => !idSet.has(item.id));
            if (this.participants.length !== before) {
                this._persistParticipants();
                idSet.forEach((id) => this.selection.delete(id));
                this._persistSelection();
                this._emit('participants', {participants: deepClone(this.participants)});
                this._emit('selection', {selection: [...this.selection]});
            }
        }

        setParticipants(list) {
            this.participants = list.map((item) => this._normalizeParticipant(item)).filter(Boolean);
            this._persistParticipants();
            this._sanitizeSelection();
            this._persistSelection();
            this._emit('participants', {participants: deepClone(this.participants)});
            this._emit('selection', {selection: [...this.selection]});
        }

        clearParticipants() {
            this.participants = [];
            this.selection.clear();
            this._persistParticipants();
            this._persistSelection();
            this._emit('participants', {participants: []});
            this._emit('selection', {selection: []});
        }

        selectAll() {
            this.selection = new Set(this.participants.map((item) => item.id));
            this._persistSelection();
            this._emit('selection', {selection: [...this.selection]});
        }

        clearSelection() {
            this.selection.clear();
            this._persistSelection();
            this._emit('selection', {selection: []});
        }

        invertSelection() {
            const next = new Set();
            this.participants.forEach((item) => {
                if (!this.selection.has(item.id)) {
                    next.add(item.id);
                }
            });
            this.selection = next;
            this._persistSelection();
            this._emit('selection', {selection: [...this.selection]});
        }

        toggleSelection(id) {
            if (this.selection.has(id)) {
                this.selection.delete(id);
            } else {
                this.selection.add(id);
            }
            this._persistSelection();
            this._emit('selection', {selection: [...this.selection]});
        }

        getSelection() {
            return new Set(this.selection);
        }

        wipe() {
            this.participants = [];
            this.settings = {...DEFAULT_SETTINGS};
            this.selection.clear();
            this.templateId = null;
            this.store.remove(PARTICIPANTS_KEY);
            this.store.remove(SETTINGS_KEY);
            this.store.remove(SELECTION_KEY);
            this.store.remove(TEMPLATE_KEY);
            this._emit('participants', {participants: []});
            this._emit('settings', {settings: deepClone(this.settings)});
            this._emit('selection', {selection: []});
            this._emit('template', {id: this.templateId});
        }

        _sanitizeSelection() {
            const existingIds = new Set(this.participants.map((item) => item.id));
            this.selection = new Set([...this.selection].filter((id) => existingIds.has(id)));
        }
    }

    function getDefaultSettings() {
        return {...DEFAULT_SETTINGS};
    }

    global.BadgeState = {
        AppState,
        getDefaultSettings,
    };
})(window);
