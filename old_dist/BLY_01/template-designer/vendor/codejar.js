/*! CodeJar | MIT License | https://github.com/antonmedv/codejar */
(function () {
    function CodeJar(editor, highlight, options) {
        options = options || {};
        var window = editor.ownerDocument.defaultView;
        var document = editor.ownerDocument;
        var listeners = [];
        var history = [];
        var at = -1;
        var focus = false;
        var prev;
        var opt = {
            tab: options.tab || '    ',
            indentOn: options.indentOn || /{$/,
            spellcheck: options.spellcheck || false,
            catchTab: options.catchTab !== false,
            addClosing: options.addClosing !== false,
            preserveIdent: options.preserveIdent !== false,
            history: options.history ?? true,
        };
        editor.setAttribute('contenteditable', 'plaintext-only');
        editor.setAttribute('spellcheck', String(opt.spellcheck));
        editor.style.outline = 'none';
        editor.style.whiteSpace = 'pre-wrap';
        editor.style.wordBreak = 'break-word';

        function callListener(event) {
            listeners.forEach(function (listener) { return listener(event); });
        }

        function save() {
            if (!opt.history) return;
            history = history.slice(0, at + 1);
            history.push(editor.innerHTML);
            at = history.length - 1;
        }

        function restore(content) {
            editor.innerHTML = content;
            call.highlight();
        }

        var call = {
            updateCode: function (code) {
                editor.textContent = code;
                call.highlight();
            },
            highlight: function () {
                var code = editor.textContent;
                if (code === prev) {
                    return;
                }
                prev = code;
                var selection = saveSelection();
                highlight(editor);
                restoreSelection(selection);
                callListener(code);
            },
            onUpdate: function (listener) {
                listeners.push(listener);
            },
        };

        function recordHistory() {
            if (!opt.history) return;
            var html = editor.innerHTML;
            if (history[at] !== html) {
                save();
            }
        }

        function handleInput(event) {
            if (!focus) return;
            call.highlight();
            recordHistory();
        }

        function handleKeydown(event) {
            if (event.defaultPrevented) return;
            var code = editor.textContent;
            if (opt.catchTab && event.key === 'Tab') {
                event.preventDefault();
                document.execCommand('insertText', false, opt.tab);
            } else if (event.key === 'Enter') {
                event.preventDefault();
                var selection = saveSelection();
                var before = code.slice(0, selection.start);
                var after = code.slice(selection.end);
                var previousLine = before.split('\n').pop();
                var indent = (previousLine.match(/^\s+/) || [''])[0];
                var addition = '\n' + indent;
                if (opt.indentOn.test(previousLine)) {
                    addition += opt.tab;
                }
                document.execCommand('insertText', false, addition);
            } else if (event.key === 'Backspace') {
                var sel = saveSelection();
                var range = sel.start === sel.end ? 1 : 0;
                var from = sel.start - range;
                if (opt.preserveIdent && code.slice(from, sel.start) === opt.tab) {
                    event.preventDefault();
                    var start = sel.start - opt.tab.length;
                    var beforeCut = code.slice(0, start);
                    var afterCut = code.slice(sel.start);
                    editor.textContent = beforeCut + afterCut;
                    setSelection(start, start);
                    call.highlight();
                    recordHistory();
                }
            } else if (opt.addClosing && (event.key === '"' || event.key === "'" || event.key === '(' || event.key === '[' || event.key === '{')) {
                var closing = ({'"': '"', "'": "'", '(': ')', '[': ']', '{': '}'}[event.key]);
                var selection_1 = saveSelection();
                var selected = code.slice(selection_1.start, selection_1.end);
                event.preventDefault();
                document.execCommand('insertText', false, event.key + selected + closing);
                if (!selected) {
                    var caret = selection_1.start + 1;
                    setSelection(caret, caret);
                }
            } else if (opt.history && (event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === 'z') {
                event.preventDefault();
                if (at > 0) {
                    at--;
                    restore(history[at]);
                }
            } else if (opt.history && (event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'z') {
                event.preventDefault();
                if (at < history.length - 1) {
                    at++;
                    restore(history[at]);
                }
            }
        }

        function positionFromIndex(root, index) {
            var total = root.textContent ? root.textContent.length : 0;
            var target = Math.max(0, Math.min(index, total));
            var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
            var node = walker.nextNode();
            var remaining = target;
            while (node) {
                var length = node.textContent.length;
                if (remaining <= length) {
                    return {node: node, offset: remaining};
                }
                remaining -= length;
                node = walker.nextNode();
            }
            return {node: root, offset: root.childNodes.length};
        }

        function setSelection(start, end) {
            var range = document.createRange();
            var startPos = positionFromIndex(editor, start);
            var endPos = positionFromIndex(editor, end);
            range.setStart(startPos.node, startPos.offset);
            range.setEnd(endPos.node, endPos.offset);
            var selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }

        function saveSelection() {
            var selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) {
                return {start: 0, end: 0};
            }
            var range = selection.getRangeAt(0);
            var preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(editor);
            preCaretRange.setEnd(range.startContainer, range.startOffset);
            var start = preCaretRange.toString().length;
            var end = start + range.toString().length;
            return {start: start, end: end};
        }

        function restoreSelection(sel) {
            if (!sel) return;
            setSelection(sel.start, sel.end);
        }

        editor.addEventListener('input', handleInput);
        editor.addEventListener('keydown', handleKeydown);
        editor.addEventListener('focus', function () {
            focus = true;
        });
        editor.addEventListener('blur', function () {
            focus = false;
        });

        save();
        call.highlight();

        return call;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {CodeJar: CodeJar};
    } else {
        window.CodeJar = CodeJar;
    }
})();
