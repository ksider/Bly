(function (global) {
    const {CodeJar} = global;
    const TAB = '    ';

    function createEditor(surface, textarea, language) {
        if (!surface || !textarea || typeof CodeJar !== 'function') {
            return null;
        }
        const jar = CodeJar(surface, (editor) => {
            const code = editor.textContent;
            editor.innerHTML = formatCode(code, language);
        }, {
            tab: TAB,
            history: true,
        });
        jar.updateCode(textarea.value || '');
        jar.onUpdate((code) => {
            textarea.value = code;
            textarea.dispatchEvent(new Event('input', {bubbles: true}));
        });
        return {
            setValue(value) {
                const code = value || '';
                textarea.value = code;
                jar.updateCode(code);
            },
            getValue() {
                return textarea.value;
            },
            focus() {
                surface.focus();
            },
        };
    }

    function formatCode(source, language) {
        const sanitized = escapeHtml(source || '');
        if (language === 'css') {
            return highlightCss(sanitized);
        }
        if (language === 'json') {
            return highlightJson(sanitized);
        }
        return highlightHtml(sanitized);
    }

    function highlightHtml(text) {
        return text
            .replace(/(&lt;!--[\s\S]*?--&gt;)/g, wrap('comment'))
            .replace(/(&lt;!DOCTYPE[\s\S]+?&gt;)/gi, wrap('directive'))
            .replace(/(&lt;\/?[a-zA-Z][\w:-]*)([\s\S]*?)(&gt;)/g, (match, open, attrs, close) => {
                const tag = open.replace(/&lt;\/?/, '').replace(/[\s>]/g, '');
                const tagOpen = `<span class="code-token tag">${open}</span>`;
                const attrPart = attrs.replace(/([^\s=]+)(="[^"]*"|'[^']*')?/g, (attrMatch, name, value) => {
                    const nameHtml = `<span class="code-token attr">${name}</span>`;
                    if (!value) {
                        return nameHtml;
                    }
                    const valueHtml = `<span class="code-token value">${value}</span>`;
                    return `${nameHtml}${valueHtml}`;
                });
                const closing = `<span class="code-token tag">${close}</span>`;
                return `${tagOpen}${attrPart}${closing}`;
            })
            .replace(/({{[^}]+}})/g, wrap('placeholder'));
    }

    function highlightCss(text) {
        return text
            .replace(/\/\*[\s\S]*?\*\//g, wrap('comment'))
            .replace(/([^{\s][^{]*?)(?=\s*\{)/g, wrap('selector'))
            .replace(/([a-zA-Z-]+)(\s*:\s*)([^;{}]+)/g, (full, prop, sep, value) => {
                const property = `<span class="code-token attr">${prop}</span>`;
                const formattedValue = value
                    .replace(/(#(?:[0-9a-fA-F]{3}){1,2})/g, wrap('value'))
                    .replace(/(-?\d+(?:\.\d+)?(?:px|rem|em|vh|vw|%)?)/g, wrap('number'))
                    .replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, wrap('string'));
                return `${property}${sep}<span class="code-token value">${formattedValue}</span>`;
            })
            .replace(/({{[^}]+}})/g, wrap('placeholder'));
    }

    function highlightJson(text) {
        return text
            .replace(/(&quot;[^\n"]*&quot;)(\s*:\s*)/g, (match, key, sep) => `<span class="code-token attr">${key}</span>${sep}`)
            .replace(/(:\s*)(&quot;.*?&quot;)/g, (match, sep, value) => `${sep}<span class="code-token string">${value}</span>`)
            .replace(/\b(true|false|null)\b/g, wrap('value'))
            .replace(/(-?\d+(\.\d+)?)/g, wrap('number'))
            .replace(/({{[^}]+}})/g, wrap('placeholder'));
    }

    function wrap(className) {
        return (match) => `<span class="code-token ${className}">${match}</span>`;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    global.BadgeCodeEditor = {
        createEditor,
    };
})(window);
