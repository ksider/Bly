(function (global) {
    const {
        SimpleEventEmitter,
        createId,
        clamp,
    } = global.BadgeDesignerUtils;

    const DEFAULT_BADGE = {width: 90, height: 55};
    const DEFAULT_GRID = 8;

    const ELEMENT_PRESETS = {
        text: {
            width: 120,
            height: 32,
            content: 'Заголовок',
            fontSize: 18,
            fontWeight: 600,
            textAlign: 'left',
            color: '#0f172a',
        },
        field: {
            width: 140,
            height: 36,
            fieldKey: 'name',
            placeholder: 'Имя участника',
            fontSize: 20,
            fontWeight: 700,
            textAlign: 'left',
            color: '#1d4ed8',
        },
        image: {
            width: 80,
            height: 80,
            objectFit: 'cover',
            source: '',
            description: 'Логотип',
            borderRadius: 12,
            fieldKey: 'image',
        },
        shape: {
            width: 120,
            height: 40,
            background: '#2563eb',
            borderRadius: 12,
            opacity: 0.12,
        },
    };

    function createElement(type, overrides = {}) {
        const preset = ELEMENT_PRESETS[type] || ELEMENT_PRESETS.text;
        const id = createId('element');
        return {
            id,
            type,
            x: 20,
            y: 20,
            width: preset.width,
            height: preset.height,
            rotation: 0,
            zIndex: 1,
            ...preset,
            ...overrides,
        };
    }

    class BadgeDesignerState extends SimpleEventEmitter {
        constructor() {
            super();
            this.elements = [];
            this.selectedId = null;
            this.badgeSize = {...DEFAULT_BADGE};
            this.gridSize = DEFAULT_GRID;
            this.snapToGrid = true;
            this.sampleFields = new Map();
        }

        getSelected() {
            return this.elements.find((item) => item.id === this.selectedId) || null;
        }

        addElement(type, overrides) {
            const element = createElement(type, overrides);
            element.zIndex = this.elements.length + 1;
            this.elements.push(element);
            this.selectedId = element.id;
            this.emit('elements');
            this.emit('selection', this.getSelected());
            return element;
        }

        updateElement(id, changes) {
            const index = this.elements.findIndex((item) => item.id === id);
            if (index === -1) {
                return;
            }
            this.elements[index] = {
                ...this.elements[index],
                ...changes,
            };
            this.emit('elements');
            if (this.selectedId === id) {
                this.emit('selection', this.getSelected());
            }
        }

        moveElement(id, {x, y}) {
            this.updateElement(id, {x, y});
        }

        resizeElement(id, {width, height}) {
            const clampedWidth = clamp(width, 8, 800);
            const clampedHeight = clamp(height, 8, 800);
            this.updateElement(id, {width: clampedWidth, height: clampedHeight});
        }

        selectElement(id) {
            if (this.selectedId === id) {
                return;
            }
            this.selectedId = id;
            this.emit('selection', this.getSelected());
        }

        clearSelection() {
            this.selectedId = null;
            this.emit('selection', null);
        }

        removeElement(id) {
            const index = this.elements.findIndex((item) => item.id === id);
            if (index === -1) {
                return;
            }
            this.elements.splice(index, 1);
            this.emit('elements');
            if (this.selectedId === id) {
                this.clearSelection();
            }
        }

        bringForward(id) {
            const index = this.elements.findIndex((item) => item.id === id);
            if (index === -1 || index === this.elements.length - 1) {
                return;
            }
            const [element] = this.elements.splice(index, 1);
            this.elements.splice(index + 1, 0, element);
            this.reindex();
        }

        sendBackward(id) {
            const index = this.elements.findIndex((item) => item.id === id);
            if (index <= 0) {
                return;
            }
            const [element] = this.elements.splice(index, 1);
            this.elements.splice(index - 1, 0, element);
            this.reindex();
        }

        reindex() {
            this.elements = this.elements.map((item, idx) => ({
                ...item,
                zIndex: idx + 1,
            }));
            this.emit('elements');
        }

        updateBadgeSize(width, height) {
            this.badgeSize = {
                width: clamp(width, 40, 200),
                height: clamp(height, 40, 200),
            };
            this.emit('badge');
        }

        setGridSize(size) {
            this.gridSize = clamp(size, 0, 40);
            this.emit('grid');
        }

        setSnap(enabled) {
            this.snapToGrid = Boolean(enabled);
            this.emit('grid');
        }

        setSampleField(key, value) {
            if (!key) {
                return;
            }
            this.sampleFields.set(String(key), value ?? '');
            this.emit('fields');
        }

        getData() {
            return {
                badge: {...this.badgeSize},
                gridSize: this.gridSize,
                snapToGrid: this.snapToGrid,
                elements: this.elements.map((item) => ({...item})),
                fields: Object.fromEntries(this.sampleFields.entries()),
            };
        }

        loadData(payload) {
            if (!payload) {
                return;
            }
            this.badgeSize = {
                width: payload.badge?.width ?? DEFAULT_BADGE.width,
                height: payload.badge?.height ?? DEFAULT_BADGE.height,
            };
            this.gridSize = payload.gridSize ?? DEFAULT_GRID;
            this.snapToGrid = payload.snapToGrid ?? true;
            this.elements = Array.isArray(payload.elements)
                ? payload.elements.map((item, idx) => ({
                    ...item,
                    id: item.id || createId('element'),
                    zIndex: idx + 1,
                }))
                : [];
            this.sampleFields = new Map(Object.entries(payload.fields || {}));
            this.selectedId = null;
            this.emit('badge');
            this.emit('grid');
            this.emit('elements');
            this.emit('selection', null);
        }
    }

    global.BadgeDesignerState = BadgeDesignerState;
    global.BadgeDesignerDefaults = {
        ELEMENT_PRESETS,
        DEFAULT_BADGE,
        DEFAULT_GRID,
    };
})(window);
