(function (global) {

    class PaletteController {
        constructor(state, paletteNode) {
            this.state = state;
            this.paletteNode = paletteNode;
            this.currentTool = null;
            this.canvasRef = null;

            this._bindPalette();
        }

        _bindPalette() {
            if (!this.paletteNode) {
                return;
            }
            this.paletteNode.addEventListener('click', (event) => {
                const button = event.target.closest('[data-element-type]');
                if (!button) {
                    return;
                }
                const type = button.dataset.elementType;
                this.toggleTool(type, button);
            });
        }

        toggleTool(type, button) {
            const active = this.paletteNode.querySelector('.element-button.active');
            if (active) {
                active.classList.remove('active');
            }
            if (this.currentTool === type) {
                this.currentTool = null;
                return;
            }
            this.currentTool = type;
            button?.classList.add('active');
        }

        setCanvas(canvas) {
            this.canvasRef = canvas;
        }

        spawnElement(point) {
            const type = this.currentTool || 'text';
            const element = this.state.addElement(type);
            if (!element) {
                return null;
            }
            if (point) {
                this.state.updateElement(element.id, point);
            }
            return element;
        }
    }

    global.BadgePalette = PaletteController;
})(window);
