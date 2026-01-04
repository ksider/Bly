(function (global) {
    const {
        formatNumber,
        clamp,
        debounce,
    } = global.BadgeDesignerUtils;

    class PropertiesPanel {
        constructor(state, container) {
            this.state = state;
            this.container = container;
            this.currentId = null;

            this.state.on('selection', (element) => this.render(element));
            this.state.on('elements', () => this.refresh());

            this.templateCache = new Map();
        }

        render(element) {
            this.currentId = element?.id || null;
            if (!element) {
                this.container.innerHTML = `<p class="empty-state">Выберите элемент на холсте, чтобы отредактировать его параметры.</p>`;
                return;
            }
            const html = this.buildForm(element);
            this.container.innerHTML = html;
            this.bindForm(element);
        }

        refresh() {
            if (!this.currentId) {
                return;
            }
            const element = this.state.elements.find((item) => item.id === this.currentId);
            if (!element) {
                this.render(null);
                return;
            }
            this.render(element);
        }

        buildForm(element) {
            const base = `
                <label>
                    <span>Позиция X</span>
                    <input type="number" data-prop="x" value="${formatNumber(element.x, 1)}" step="1">
                </label>
                <label>
                    <span>Позиция Y</span>
                    <input type="number" data-prop="y" value="${formatNumber(element.y, 1)}" step="1">
                </label>
                <label>
                    <span>Ширина</span>
                    <input type="number" data-prop="width" value="${formatNumber(element.width, 1)}" step="1" min="12">
                </label>
                <label>
                    <span>Высота</span>
                    <input type="number" data-prop="height" value="${formatNumber(element.height, 1)}" step="1" min="12">
                </label>
                <label>
                    <span>Поворот</span>
                    <input type="number" data-prop="rotation" value="${formatNumber(element.rotation || 0, 1)}" step="1">
                </label>
            `;

            let specific = '';
            if (element.type === 'text') {
                specific = `
                    <label>
                        <span>Текст</span>
                        <textarea data-prop="content">${element.content || ''}</textarea>
                    </label>
                    <label>
                        <span>Размер шрифта</span>
                        <input type="number" data-prop="fontSize" value="${element.fontSize || 16}" min="8" max="96">
                    </label>
                    <label>
                        <span>Начертание</span>
                        <select data-prop="fontWeight">
                            ${this.options([300, 400, 500, 600, 700], element.fontWeight || 400)}
                        </select>
                    </label>
                    <label>
                        <span>Цвет</span>
                        <input type="color" data-prop="color" value="${element.color || '#0f172a'}">
                    </label>
                    <label>
                        <span>Выравнивание</span>
                        <select data-prop="textAlign">
                            ${this.options(['left', 'center', 'right'], element.textAlign || 'left')}
                        </select>
                    </label>
                `;
            } else if (element.type === 'field') {
                specific = `
                    <label>
                        <span>Поле</span>
                        <input type="text" data-prop="fieldKey" value="${element.fieldKey || 'field'}">
                    </label>
                    <label>
                        <span>Подпись</span>
                        <input type="text" data-prop="placeholder" value="${element.placeholder || ''}">
                    </label>
                    <label>
                        <span>Размер шрифта</span>
                        <input type="number" data-prop="fontSize" value="${element.fontSize || 18}" min="8" max="96">
                    </label>
                    <label>
                        <span>Цвет</span>
                        <input type="color" data-prop="color" value="${element.color || '#1d4ed8'}">
                    </label>
                    <label>
                        <span>Выравнивание</span>
                        <select data-prop="textAlign">
                            ${this.options(['left', 'center', 'right'], element.textAlign || 'left')}
                        </select>
                    </label>
                `;
            } else if (element.type === 'image') {
                specific = `
                    <label>
                        <span>Источник</span>
                        <input type="text" data-prop="source" value="${element.source || ''}" placeholder="URL изображения или base64">
                    </label>
                    <label>
                        <span>Описание</span>
                        <input type="text" data-prop="description" value="${element.description || ''}">
                    </label>
                    <label>
                        <span>Радиус</span>
                        <input type="number" data-prop="borderRadius" value="${element.borderRadius || 0}" min="0" max="200">
                    </label>
                `;
            } else if (element.type === 'shape') {
                specific = `
                    <label>
                        <span>Цвет</span>
                        <input type="color" data-prop="background" value="${element.background || '#2563eb'}">
                    </label>
                    <label>
                        <span>Прозрачность</span>
                        <input type="range" data-prop="opacity" min="0" max="1" step="0.05" value="${element.opacity ?? 1}">
                    </label>
                    <label>
                        <span>Радиус</span>
                        <input type="number" data-prop="borderRadius" value="${element.borderRadius || 0}" min="0" max="200">
                    </label>
                `;
            }

            return base + specific + this.layerControls();
        }

        options(list, current) {
            return list.map((value) => {
                const label = typeof value === 'string' ? value : String(value);
                const selected = String(value) === String(current) ? ' selected' : '';
                return `<option value="${value}"${selected}>${label}</option>`;
            }).join('');
        }

        layerControls() {
            return `
                <div class="toolbar-chip-group">
                    <button type="button" data-action="layer-up" class="toolbar-chip">Выше</button>
                    <button type="button" data-action="layer-down" class="toolbar-chip">Ниже</button>
                    <button type="button" data-action="delete" class="toolbar-chip" data-variant="danger">Удалить</button>
                </div>
            `;
        }

        bindForm(element) {
            const inputs = this.container.querySelectorAll('[data-prop]');
            inputs.forEach((input) => {
                const handler = debounce(() => {
                    const prop = input.dataset.prop;
                    let value = input.value;
                    if (!prop) {
                        return;
                    }
                    if (input.type === 'number' || input.type === 'range') {
                        value = Number(value);
                        if (Number.isNaN(value)) {
                            return;
                        }
                    }
                    this.state.updateElement(element.id, {[prop]: value});
                }, 120);
                input.addEventListener('input', handler);
                input.addEventListener('change', handler);
            });

            this.container.querySelectorAll('[data-action]').forEach((button) => {
                button.addEventListener('click', () => {
                    const action = button.dataset.action;
                    if (action === 'layer-up') {
                        this.state.bringForward(element.id);
                    } else if (action === 'layer-down') {
                        this.state.sendBackward(element.id);
                    } else if (action === 'delete') {
                        if (window.confirm('Удалить элемент?')) {
                            this.state.removeElement(element.id);
                        }
                    }
                });
            });
        }
    }

    global.BadgePropertiesPanel = PropertiesPanel;
})(window);
