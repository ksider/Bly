(function (global) {
    function escapeHTML(value) {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderTemplateString(template, data = {}) {
        if (!template) {
            return '';
        }
        const context = data || {};

        return template
            .replace(/{{{\s*([\w.-]+)\s*}}}/g, (_match, key) => {
                const value = getValue(context, key);
                return value === undefined || value === null ? '' : String(value);
            })
            .replace(/{{\s*([\w.-]+)\s*}}/g, (_match, key) => escapeHTML(getValue(context, key)));
    }

    function getValue(context, key) {
        const path = key.split('.');
        let current = context;
        for (const segment of path) {
            if (current === null || typeof current !== 'object' || !(segment in current)) {
                return '';
            }
            current = current[segment];
        }
        return current;
    }

    function chunkArray(items = [], chunkSize = 1) {
        const size = Math.max(1, chunkSize | 0);
        const result = [];
        for (let i = 0; i < items.length; i += size) {
            result.push(items.slice(i, i + size));
        }
        return result;
    }

    function toNumber(value, fallback = 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function mm(value) {
        return `${value}mm`;
    }

    function createId(prefix = 'id') {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
        const random = Math.random().toString(36).slice(2, 10);
        return `${prefix}-${random}`;
    }

    function deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function debounce(fn, wait = 200) {
        let timer = null;
        return (...args) => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                fn(...args);
            }, wait);
        };
    }

    global.BadgeUtils = {
        escapeHTML,
        renderTemplateString,
        chunkArray,
        toNumber,
        clamp,
        mm,
        createId,
        deepClone,
        debounce,
    };
})(window);
