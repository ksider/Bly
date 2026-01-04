(function (global) {
    const DEFAULT_OPTIONS = {
        language: 'plain',
        colorPicker: false,
    };
    const PLACEHOLDER_HINT = 'Поле {{...}}';
    const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
    const PLACEHOLDER_RE = /{{\s*[\w.-]+\s*}}/g;

    const editors = new WeakMap();

    class CodeEditor {
        constructor(textarea, options = {}) {
            if (!textarea) {
                throw new Error('CodeEditor: textarea element is required');
            }
            this.textarea = textarea;
            this.options = {...DEFAULT_OPTIONS, ...options};
            this.language = (this.options.language || '').toLowerCase();
            this.wrapper = null;
            this.body = null;
            this.highlights = null;
            this.placeholderSelect = null;
            this.colorInput = null;
            this.placeholders = [];
            this._animationFrame = null;

            this._createLayout();
            this._bindEvents();
            this.refresh();
        }

        _createLayout() {
            const wrapper = document.createElement('div');
            wrapper.className = 'code-editor';
            wrapper.dataset.language = this.language || 'plain';

            const parent = this.textarea.parentElement;
            const nextSibling = this.textarea.nextSibling;

            const toolbar = this._buildToolbar();
            const body = document.createElement('div');
            body.className = 'code-editor__body';

            const highlights = document.createElement('pre');
            highlights.className = 'code-editor__highlights';
            highlights.setAttribute('aria-hidden', 'true');

            this.textarea.classList.add('code-editor__textarea');
            this.textarea.setAttribute('data-code-editor-initialized', 'true');
            this.textarea.spellcheck = false;
            this.textarea.autocomplete = 'off';
            this.textarea.autocorrect = 'off';
            this.textarea.autocapitalize = 'off';
            this.textarea.rows = this.textarea.rows || 12;

            if (toolbar) {
                wrapper.appendChild(toolbar);
            }
            body.appendChild(highlights);
            wrapper.appendChild(body);
            if (parent) {
                if (nextSibling) {
                    parent.insertBefore(wrapper, nextSibling);
                } else {
                    parent.appendChild(wrapper);
                }
            }
            body.appendChild(this.textarea);

            this.wrapper = wrapper;
            this.body = body;
            this.highlights = highlights;
        }

        _buildToolbar() {
            const modeLabel = document.createElement('span');
            modeLabel.className = 'code-editor__mode';
            modeLabel.textContent = this._modeLabel();

            const toolbar = document.createElement('div');
            toolbar.className = 'code-editor__toolbar';

            const leftGroup = document.createElement('div');
            leftGroup.className = 'code-editor__toolbar-group';
            leftGroup.appendChild(modeLabel);

            const rightGroup = document.createElement('div');
            rightGroup.className = 'code-editor__toolbar-group';

            let hasRightContent = false;

            if (this.options.colorPicker) {
                const colorLabel = document.createElement('label');
                colorLabel.className = 'code-editor__color';
                colorLabel.title = 'Вставить значение цвета';

                const colorInput = document.createElement('input');
                colorInput.type = 'color';
                colorInput.value = '#3b82f6';
                colorLabel.appendChild(colorInput);

                const colorText = document.createElement('span');
                colorText.textContent = 'Цвет';
                colorLabel.appendChild(colorText);

                colorInput.addEventListener('input', (event) => {
                    const value = event.target.value;
                    if (value) {
                        this.insertColor(value);
                    }
                });

                this.colorInput = colorInput;
                rightGroup.appendChild(colorLabel);
                hasRightContent = true;
            }

            if (this.language === 'html') {
                const placeholderSelect = document.createElement('select');
                placeholderSelect.className = 'code-editor__placeholder';
                placeholderSelect.title = 'Вставить плейсхолдер поля';
                placeholderSelect.addEventListener('change', () => {
                    if (!placeholderSelect.value) {
                        return;
                    }
                    this.insertPlaceholder(placeholderSelect.value);
                    placeholderSelect.value = '';
                });
                this.placeholderSelect = placeholderSelect;
                rightGroup.appendChild(placeholderSelect);
                hasRightContent = true;
            }

            const tips = document.createElement('span');
            tips.className = 'code-editor__tips';
            tips.textContent = 'Tab ⇥ / Shift+Tab — отступ, Enter — автоотступ';
            rightGroup.appendChild(tips);
            hasRightContent = true;

            toolbar.appendChild(leftGroup);
            if (hasRightContent) {
                toolbar.appendChild(rightGroup);
            }

            return toolbar;
        }

        _bindEvents() {
            this.textarea.addEventListener('input', () => this.refresh());
            this.textarea.addEventListener('scroll', () => this._syncScroll());
            this.textarea.addEventListener('focus', () => this.wrapper.classList.add('code-editor--focus'));
            this.textarea.addEventListener('blur', () => this.wrapper.classList.remove('code-editor--focus'));
            this.textarea.addEventListener('keydown', (event) => this._handleKeyDown(event));
            this.textarea.addEventListener('paste', (event) => this._handlePaste(event));
        }

        _handleKeyDown(event) {
            if (event.key === 'Tab') {
                event.preventDefault();
                if (event.shiftKey) {
                    this._outdentSelection();
                } else {
                    this._indentSelection();
                }
                return;
            }

            if (event.key === 'Enter') {
                event.preventDefault();
                this._insertNewLineWithIndent();
            }
        }

        _handlePaste(event) {
            if (!event.clipboardData) {
                return;
            }
            const text = event.clipboardData.getData('text');
            if (!text) {
                return;
            }
            event.preventDefault();
            const normalized = text.replace(/\r\n?/g, '\n').replace(/\t/g, '    ');
            this._replaceSelection(normalized, 'end');
        }

        _indentSelection() {
            const indent = '    ';
            const {selectionStart, selectionEnd, value} = this.textarea;
            if (selectionStart !== selectionEnd) {
                const start = value.lastIndexOf('\n', selectionStart - 1) + 1;
                const end = value.indexOf('\n', selectionEnd);
                const endIndex = end === -1 ? value.length : end;
                const selected = value.slice(start, endIndex);
                const indented = selected.replace(/^/gm, indent);
                this.textarea.setRangeText(indented, start, endIndex, 'end');
                const lines = selected.split('\n').length;
                const newStart = selectionStart + indent.length;
                const newEnd = selectionEnd + indent.length * lines;
                this.textarea.setSelectionRange(newStart, newEnd);
            } else {
                this._replaceSelection(indent, 'end');
                return;
            }
            this._emitInput();
            this.refresh();
        }

        _outdentSelection() {
            const {selectionStart, selectionEnd, value} = this.textarea;
            const start = value.lastIndexOf('\n', selectionStart - 1) + 1;
            const end = selectionEnd;
            const selected = value.slice(start, end);
            const outdented = selected.replace(/^ {1,4}/gm, '');
            const diff = selected.length - outdented.length;
            this.textarea.setRangeText(outdented, start, end, 'end');
            const newStart = selectionStart - Math.min(4, selectionStart - start);
            const newEnd = selectionEnd - diff;
            this.textarea.setSelectionRange(Math.max(start, newStart), newEnd);
            this._emitInput();
            this.refresh();
        }

        _insertNewLineWithIndent() {
            const {selectionStart, value} = this.textarea;
            const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
            const currentLine = value.slice(lineStart, selectionStart);
            const indentMatch = currentLine.match(/^[ \t]*/);
            const baseIndent = indentMatch ? indentMatch[0].replace(/\t/g, '    ') : '';
            const extraIndent = /{\s*$/.test(currentLine) ? '    ' : '';
            this._replaceSelection(`\n${baseIndent}${extraIndent}`, 'end');
        }

        _replaceSelection(text, selectionMode = 'end') {
            const {selectionStart, selectionEnd} = this.textarea;
            this.textarea.setRangeText(text, selectionStart, selectionEnd, selectionMode);
            const caret = selectionMode === 'start'
                ? selectionStart
                : this.textarea.selectionEnd;
            this.textarea.setSelectionRange(caret, caret);
            this._emitInput();
            this.refresh();
        }

        insertColor(value) {
            this.insertText(value);
        }

        insertPlaceholder(value) {
            const {selectionStart, selectionEnd, value: currentValue} = this.textarea;
            const selected = currentValue.slice(selectionStart, selectionEnd).trim();
            const placeholder = value
                ? `{{${value}}}`
                : selected
                    ? `{{${selected}}}`
                    : '{{field}}';
            this.textarea.setRangeText(placeholder, selectionStart, selectionEnd, 'end');
            if (!value && !selected) {
                const start = selectionStart + 2;
                const end = this.textarea.selectionEnd - 2;
                this.textarea.setSelectionRange(start, end);
            } else {
                const caret = this.textarea.selectionStart;
                this.textarea.setSelectionRange(caret, caret);
            }
            this.textarea.focus();
            this._emitInput();
            this.refresh();
        }

        insertText(content) {
            this._replaceSelection(content, 'end');
        }

        setValue(value) {
            const normalized = (value || '').replace(/\r\n?/g, '\n');
            if (this.textarea.value !== normalized) {
                this.textarea.value = normalized;
                this.refresh();
            } else {
                this.refresh();
            }
        }

        refresh() {
            if (this._animationFrame) {
                cancelAnimationFrame(this._animationFrame);
            }
            this._animationFrame = requestAnimationFrame(() => {
                this._animationFrame = null;
                this._updateHighlights();
                this._syncScroll();
            });
        }

        focus() {
            this.textarea.focus();
        }

        setPlaceholders(placeholders) {
            this.placeholders = Array.isArray(placeholders)
                ? placeholders.filter((item) => typeof item === 'string' && item.trim().length > 0)
                : [];
            this._updatePlaceholderSelect();
        }

        _updatePlaceholderSelect() {
            if (!this.placeholderSelect) {
                return;
            }
            const select = this.placeholderSelect;
            select.innerHTML = '';
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = PLACEHOLDER_HINT;
            defaultOption.disabled = this.placeholders.length === 0;
            defaultOption.selected = true;
            select.appendChild(defaultOption);

            if (this.placeholders.length > 0) {
                this.placeholders.forEach((name) => {
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = `{{${name}}}`;
                    select.appendChild(option);
                });
                select.disabled = false;
                select.classList.remove('is-empty');
            } else {
                select.disabled = true;
                select.classList.add('is-empty');
            }
        }

        _emitInput() {
            const event = new Event('input', {bubbles: true});
            this.textarea.dispatchEvent(event);
        }

        _updateHighlights() {
            const value = this.textarea.value || '';
            let formatted = '';
            try {
                formatted = formatCode(value, this.language);
            } catch (error) {
                console.error('CodeEditor: highlight error', error);
                formatted = escapeHtml(value);
            }
            console.debug('[CodeEditor]', this.language, 'value length:', value.length, 'formatted length:', formatted.length);
            const sentinel = '<span class="code-editor__caret-sentinel">&#8203;</span>';
            this.highlights.innerHTML = formatted + sentinel;
            this.wrapper.classList.add('code-editor--ready');
        }

        _syncScroll() {
            const {scrollTop, scrollLeft} = this.textarea;
            this.highlights.scrollTop = scrollTop;
            this.highlights.scrollLeft = scrollLeft;
        }

        _modeLabel() {
            switch (this.language) {
                case 'html':
                    return 'HTML';
                case 'css':
                    return 'CSS';
                default:
                    return 'CODE';
            }
        }
    }

    function formatCode(source, language) {
        const normalized = (source || '').replace(/\r\n?/g, '\n').replace(/\t/g, '    ');
        switch (language) {
            case 'html':
                return highlightHtml(normalized);
            case 'css':
                return highlightCss(normalized);
            default:
                return escapeHtml(normalized);
        }
    }

    function highlightHtml(source) {
        const text = source || '';
        let result = '';
        let lastIndex = 0;
        const tagRegex = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE[\s\S]+?>|<\/?[a-zA-Z][\w:-]*(?:\s+[^\s="'<>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*\s*\/?>/g;
        let match;
        while ((match = tagRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                const chunk = text.slice(lastIndex, match.index);
                result += highlightPlainText(chunk);
            }
            result += highlightHtmlToken(match[0]);
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < text.length) {
            result += highlightPlainText(text.slice(lastIndex));
        }
        return result;
    }

    function highlightCss(source) {
        const escaped = escapeHtml(source || '');
        let processed = escaped;

        processed = processed.replace(/\/\*[\s\S]*?\*\//g, (match) => `<span class="code-editor__token code-editor__token--comment">${match}</span>`);
        processed = processed.replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, (match) => `<span class="code-editor__token code-editor__token--string">${match}</span>`);
        processed = processed.replace(/([^{\s][^{]*?)(?=\s*\{)/g, (match) => `<span class="code-editor__token code-editor__token--selector">${match}</span>`);
        processed = processed.replace(/([a-zA-Z-]+)(\s*:\s*)([^;{}]+)/g, (full, property, separator, value) => {
            const propHtml = `<span class="code-editor__token code-editor__token--property">${property}</span>`;
            const valueHtml = `<span class="code-editor__token code-editor__token--value">${highlightCssValue(value)}</span>`;
            return `${propHtml}${separator}${valueHtml}`;
        });
        processed = processed.replace(/\b-?\d+(\.\d+)?(px|rem|em|vh|vw|%)\b/g, (match) => `<span class="code-editor__token code-editor__token--number">${match}</span>`);

        processed = highlightPlaceholders(processed);
        return processed;
    }

    function highlightPlainText(chunk) {
        return highlightPlaceholders(escapeHtml(chunk));
    }

    function highlightHtmlToken(token) {
        if (!token) {
            return '';
        }
        if (token.startsWith('<!--')) {
            return `<span class="code-editor__token code-editor__token--comment">${escapeHtml(token)}</span>`;
        }
        if (token.startsWith('<!')) {
            return `<span class="code-editor__token code-editor__token--directive">${escapeHtml(token)}</span>`;
        }

        const isClosing = /^<\//.test(token);
        const isSelfClosing = /\/>$/.test(token);
        const nameMatch = token.match(/^<\/?([a-zA-Z][\w:-]*)/);
        const tagName = nameMatch ? nameMatch[1] : '';

        const closingPart = isSelfClosing ? '/>' : '>';
        const start = tagName ? token.indexOf(tagName) + tagName.length + (isClosing ? 2 : 1) : token.length - closingPart.length;
        const attributeSection = token.slice(start, token.length - closingPart.length) || '';

        let result = '&lt;';
        if (isClosing) {
            result += '/';
        }
        result += `<span class="code-editor__token code-editor__token--tag">${escapeHtml(tagName)}</span>`;
        result += highlightHtmlAttributes(attributeSection);
        result += escapeHtml(closingPart);
        return result;
    }

    function highlightHtmlAttributes(source) {
        if (!source) {
            return '';
        }
        let result = '';
        let lastIndex = 0;
        const attrRegex = /([\s\n\r\t]+)([^\s=\/>]+)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
        let match;
        while ((match = attrRegex.exec(source)) !== null) {
            if (match.index > lastIndex) {
                result += escapeHtml(source.slice(lastIndex, match.index));
            }
            const [, leading, name, valuePart] = match;
            result += escapeHtml(leading || '');
            result += `<span class="code-editor__token code-editor__token--attr">${escapeHtml(name)}</span>`;
            if (valuePart) {
                const eqIndex = valuePart.indexOf('=');
                const before = valuePart.slice(0, eqIndex);
                const value = valuePart.slice(eqIndex + 1);
                result += escapeHtml(before);
                result += '<span class="code-editor__token code-editor__token--punct">=</span>';
                result += highlightHtmlAttributeValue(value);
            }
            lastIndex = attrRegex.lastIndex;
        }
        if (lastIndex < source.length) {
            result += escapeHtml(source.slice(lastIndex));
        }
        return result;
    }

    function highlightHtmlAttributeValue(value) {
        if (!value) {
            return '';
        }
        const escaped = escapeHtml(value);
        const withColors = highlightHexColors(escaped);
        const withPlaceholders = highlightPlaceholders(withColors);
        return `<span class="code-editor__token code-editor__token--value">${withPlaceholders}</span>`;
    }

    function highlightCssValue(value) {
        let result = value;
        result = result.replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, (match) => `<span class="code-editor__token code-editor__token--string">${match}</span>`);
        result = result.replace(/\b-?\d+(\.\d+)?(px|rem|em|vh|vw|%)\b/g, (match) => `<span class="code-editor__token code-editor__token--number">${match}</span>`);
        result = highlightHexColors(result);
        result = highlightPlaceholders(result);
        return result;
    }

    function highlightHexColors(content) {
        return content.replace(HEX_COLOR_RE, (match) => {
            const color = match.toLowerCase();
            return `<span class="code-editor__token code-editor__token--color" style="--token-color:${color}">${color}</span>`;
        });
    }

    function highlightPlaceholders(content) {
        return content.replace(PLACEHOLDER_RE, (match) => `<span class="code-editor__token code-editor__token--placeholder">${match}</span>`);
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function readDatasetOptions(textarea) {
        const options = {};
        if (textarea.dataset.codeEditor) {
            options.language = textarea.dataset.codeEditor;
        }
        if (textarea.dataset.colorPicker !== undefined) {
            const raw = textarea.dataset.colorPicker;
            options.colorPicker = raw !== 'false';
        }
        return options;
    }

    function attach(textarea, options = {}) {
        if (!textarea) {
            return null;
        }
        const existing = editors.get(textarea);
        if (existing) {
            return existing;
        }
        const datasetOptions = readDatasetOptions(textarea);
        const editor = new CodeEditor(textarea, {...datasetOptions, ...options});
        editors.set(textarea, editor);
        return editor;
    }

    function getInstance(textarea) {
        return editors.get(textarea) || null;
    }

    function autoInit() {
        const nodes = document.querySelectorAll('textarea[data-code-editor]:not([data-code-editor-initialized])');
        nodes.forEach((textarea) => attach(textarea));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }

    global.BadgeCodeEditor = {
        attach,
        getInstance,
    };
})(window);
