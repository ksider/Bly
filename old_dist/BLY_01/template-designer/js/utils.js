window.BadgeDesignerUtils = (function () {
    const PX_PER_MM = 3.7795275591; // 96 DPI

    function mmToPx(value) {
        return value * PX_PER_MM;
    }

    function pxToMm(value) {
        return value / PX_PER_MM;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function createId(prefix = 'item') {
        return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
    }

    function formatNumber(value, decimals = 2) {
        const factor = 10 ** decimals;
        return Math.round(value * factor) / factor;
    }

    function debounce(fn, delay = 120) {
        let timer = null;
        return (...args) => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => fn(...args), delay);
        };
    }

    class SimpleEventEmitter {
        constructor() {
            this.listeners = new Map();
        }

        on(event, handler) {
            const handlers = this.listeners.get(event) || [];
            handlers.push(handler);
            this.listeners.set(event, handlers);
        }

        off(event, handler) {
            const handlers = this.listeners.get(event);
            if (!handlers) {
                return;
            }
            const next = handlers.filter((item) => item !== handler);
            this.listeners.set(event, next);
        }

        emit(event, payload) {
            const handlers = this.listeners.get(event);
            if (!handlers || handlers.length === 0) {
                return;
            }
            handlers.forEach((handler) => handler(payload));
        }
    }

    return {
        mmToPx,
        pxToMm,
        clamp,
        createId,
        formatNumber,
        debounce,
        SimpleEventEmitter,
        PX_PER_MM,
    };
})();
