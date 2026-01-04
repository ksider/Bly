(function (global) {
    const {
        mmToPx,
        clamp,
        debounce,
    } = global.BadgeDesignerUtils;

    class BadgeCanvas {
        constructor(state, container) {
            this.state = state;
            this.container = container;
            this.frame = document.createElement('div');
            this.frame.className = 'badge-frame';
            this.container.appendChild(this.frame);

            this.elementsMap = new Map();
            this.dragContext = null;

            this._bindEvents();
            this.renderBadge();
            this.renderElements();

            this.state.on('badge', () => this.renderBadge());
            this.state.on('elements', () => this.renderElements());
            this.state.on('selection', () => this.updateSelection());
            this.state.on('grid', () => this.updateGrid());

            this.resizeObserver = new ResizeObserver(debounce(() => this.renderBadge(), 120));
            this.resizeObserver.observe(this.container);
        }

        _bindEvents() {
            this.container.addEventListener('pointerdown', (event) => this.handlePointerDown(event));
            window.addEventListener('pointermove', (event) => this.handlePointerMove(event));
            window.addEventListener('pointerup', () => this.handlePointerUp());
            this.container.addEventListener('dblclick', (event) => this.handleDoubleClick(event));
        }

        renderBadge() {
            const {width, height} = this.state.badgeSize;
            const pxWidth = mmToPx(width);
            const pxHeight = mmToPx(height);
            this.frame.style.width = `${pxWidth}px`;
            this.frame.style.height = `${pxHeight}px`;

            this.frame.style.backgroundSize = this.state.gridSize > 0
                ? `${this.state.gridSize * 4}px ${this.state.gridSize * 4}px`
                : '';
        }

        renderElements() {
            const currentIds = new Set();
            const badgeRect = this.frame.getBoundingClientRect();

            this.state.elements.forEach((element) => {
                currentIds.add(element.id);
                const node = this.elementsMap.get(element.id) || this.createElementNode(element.id);
                this.updateElementNode(node, element, badgeRect);
            });

            // remove outdated
            [...this.elementsMap.keys()].forEach((id) => {
                if (!currentIds.has(id)) {
                    const node = this.elementsMap.get(id);
                    node?.remove();
                    this.elementsMap.delete(id);
                }
            });

            this.toggleHint();
        }

        updateSelection() {
            const selected = this.state.selectedId;
            this.elementsMap.forEach((node, id) => {
                if (id === selected) {
                    node.classList.add('active');
                } else {
                    node.classList.remove('active');
                }
            });
        }

        updateGrid() {
            this.frame.dataset.snap = this.state.snapToGrid ? 'on' : 'off';
            this.renderBadge();
        }

        createElementNode(id) {
            const node = document.createElement('div');
            node.className = 'badge-element';
            node.dataset.elementId = id;

            const content = document.createElement('div');
            content.className = 'badge-element__content';
            node.appendChild(content);

            ['nw', 'ne', 'sw', 'se'].forEach((dir) => {
                const handle = document.createElement('span');
                handle.className = `resize-handle handle-${dir}`;
                handle.dataset.handle = dir;
                node.appendChild(handle);
            });

            this.frame.appendChild(node);
            this.elementsMap.set(id, node);
            return node;
        }

        updateElementNode(node, element, badgeRect) {
            node.style.width = `${element.width}px`;
            node.style.height = `${element.height}px`;
            node.style.transform = `translate(${element.x}px, ${element.y}px) rotate(${element.rotation}deg)`;
            node.style.zIndex = String(element.zIndex);

            const content = node.querySelector('.badge-element__content');
            if (!content) {
                return;
            }

            content.innerHTML = '';
            switch (element.type) {
                case 'text':
                case 'field': {
                    const text = document.createElement('div');
                    text.style.display = 'flex';
                    text.style.alignItems = 'center';
                    text.style.justifyContent = this.mapTextAlign(element.textAlign);
                    text.style.width = '100%';
                    text.style.height = '100%';
                    text.style.padding = '0.25rem';
                    text.style.color = element.color || '#0f172a';
                    text.style.fontSize = `${element.fontSize || 16}px`;
                    text.style.fontWeight = element.fontWeight || 400;
                    text.style.letterSpacing = element.letterSpacing ? `${element.letterSpacing}px` : '';
                    text.style.textTransform = element.textTransform || 'none';
                    text.textContent = element.type === 'field'
                        ? `{{${element.fieldKey || 'field'}}}`
                        : element.content || 'Текст';
                    content.appendChild(text);
                    break;
                }
                case 'image': {
                    const image = document.createElement('div');
                    image.style.width = '100%';
                    image.style.height = '100%';
                    image.style.background = element.source
                        ? `url(${element.source}) center/cover no-repeat`
                        : 'linear-gradient(135deg, rgba(37, 99, 235, 0.35), rgba(37, 99, 235, 0.15))';
                    image.style.borderRadius = `${element.borderRadius || 0}px`;
                    image.style.display = 'flex';
                    image.style.alignItems = 'center';
                    image.style.justifyContent = 'center';
                    image.style.color = 'rgba(15, 23, 42, 0.65)';
                    image.style.fontSize = '0.8rem';
                    image.textContent = element.description || 'Лого';
                    content.appendChild(image);
                    break;
                }
                case 'shape':
                default: {
                    const shape = document.createElement('div');
                    shape.style.width = '100%';
                    shape.style.height = '100%';
                    shape.style.borderRadius = `${element.borderRadius || 0}px`;
                    shape.style.background = element.background || 'rgba(37, 99, 235, 0.15)';
                    shape.style.opacity = element.opacity ?? 1;
                    content.appendChild(shape);
                    break;
                }
            }

            if (this.state.selectedId === element.id) {
                node.classList.add('active');
            } else {
                node.classList.remove('active');
            }
        }

        mapTextAlign(value) {
            switch (value) {
                case 'center':
                    return 'center';
                case 'right':
                    return 'flex-end';
                default:
                    return 'flex-start';
            }
        }

        handlePointerDown(event) {
            const elementNode = event.target.closest('.badge-element');
            if (!elementNode) {
                if (event.target === this.container || event.target === this.frame) {
                    this.state.clearSelection();
                }
                return;
            }

            event.preventDefault();
            const elementId = elementNode.dataset.elementId;
            if (!elementId) {
                return;
            }

            const handle = event.target.closest('.resize-handle');
            const elementData = this.state.elements.find((item) => item.id === elementId);
            if (!elementData) {
                return;
            }

            const rect = this.frame.getBoundingClientRect();
            const pointerStart = {
                x: event.clientX,
                y: event.clientY,
            };

            this.state.selectElement(elementId);
            elementNode.setPointerCapture(event.pointerId);

            if (handle) {
                this.dragContext = {
                    mode: 'resize',
                    handle: handle.dataset.handle,
                    elementId,
                    start: pointerStart,
                    initial: {...elementData},
                    frameRect: rect,
                };
            } else {
                this.dragContext = {
                    mode: 'move',
                    elementId,
                    start: pointerStart,
                    initial: {...elementData},
                    frameRect: rect,
                };
            }
        }

        handlePointerMove(event) {
            if (!this.dragContext) {
                return;
            }
            event.preventDefault();

            const deltaX = event.clientX - this.dragContext.start.x;
            const deltaY = event.clientY - this.dragContext.start.y;

            if (this.dragContext.mode === 'move') {
                let nextX = this.dragContext.initial.x + deltaX;
                let nextY = this.dragContext.initial.y + deltaY;
                if (this.state.snapToGrid && this.state.gridSize > 0) {
                    const snap = this.state.gridSize;
                    nextX = Math.round(nextX / snap) * snap;
                    nextY = Math.round(nextY / snap) * snap;
                }
                nextX = clamp(nextX, 0, this.dragContext.frameRect.width - this.dragContext.initial.width);
                nextY = clamp(nextY, 0, this.dragContext.frameRect.height - this.dragContext.initial.height);
                this.state.moveElement(this.dragContext.elementId, {x: nextX, y: nextY});
            } else if (this.dragContext.mode === 'resize') {
                const direction = this.dragContext.handle;
                let {width, height, x, y} = this.dragContext.initial;
                let newWidth = width;
                let newHeight = height;
                let newX = x;
                let newY = y;

                if (direction.includes('e')) {
                    newWidth = width + deltaX;
                }
                if (direction.includes('s')) {
                    newHeight = height + deltaY;
                }
                if (direction.includes('w')) {
                    newWidth = width - deltaX;
                    newX = x + deltaX;
                }
                if (direction.includes('n')) {
                    newHeight = height - deltaY;
                    newY = y + deltaY;
                }

                newWidth = clamp(newWidth, 12, this.dragContext.frameRect.width);
                newHeight = clamp(newHeight, 12, this.dragContext.frameRect.height);
                newX = clamp(newX, 0, this.dragContext.frameRect.width - newWidth);
                newY = clamp(newY, 0, this.dragContext.frameRect.height - newHeight);

                if (this.state.snapToGrid && this.state.gridSize > 0) {
                    const snap = this.state.gridSize;
                    newX = Math.round(newX / snap) * snap;
                    newY = Math.round(newY / snap) * snap;
                    newWidth = Math.round(newWidth / snap) * snap;
                    newHeight = Math.round(newHeight / snap) * snap;
                }

                this.state.updateElement(this.dragContext.elementId, {
                    x: newX,
                    y: newY,
                    width: newWidth,
                    height: newHeight,
                });
            }
        }

        handlePointerUp() {
            this.dragContext = null;
        }

        handleDoubleClick(event) {
            const elementNode = event.target.closest('.badge-element');
            if (!elementNode) {
                return;
            }
            const elementId = elementNode.dataset.elementId;
            if (!elementId) {
                return;
            }
            const element = this.state.elements.find((item) => item.id === elementId);
            if (element?.type === 'text' || element?.type === 'field') {
                const nextContent = window.prompt('Изменить текст', element.content || element.placeholder || '');
                if (typeof nextContent === 'string') {
                    if (element.type === 'field') {
                        this.state.updateElement(elementId, {placeholder: nextContent});
                    } else {
                        this.state.updateElement(elementId, {content: nextContent});
                    }
                }
            }
        }

        toggleHint() {
            const hint = this.container.querySelector('.canvas-hint');
            if (!hint) {
                return;
            }
            hint.style.display = this.state.elements.length === 0 ? 'block' : 'none';
        }
    }

    global.BadgeCanvas = BadgeCanvas;
})(window);
