(function (global) {
    const {
        pxToMm,
        formatNumber,
        createId,
    } = global.BadgeDesignerUtils;

    class TemplateExporter {
        constructor(state, outputs, controllers = {}) {
            this.state = state;
            this.outputs = outputs;
            this.controllers = controllers;

            this.state.on('elements', () => this.refresh());
            this.state.on('badge', () => this.refresh());
            this.state.on('fields', () => this.refresh());
            this.refresh();
        }

        refresh() {
            const data = this.state.getData();
            const markup = this.buildMarkup(data);
            const styles = this.buildStyles(data);
            const manifest = this.buildManifest(data);
            const manifestJson = JSON.stringify(manifest, null, 2);

            if (this.outputs.markup) {
                this.outputs.markup.value = markup;
            }
            this.controllers.markup?.setValue?.(markup);
            if (this.outputs.styles) {
                this.outputs.styles.value = styles;
            }
            this.controllers.styles?.setValue?.(styles);
            if (this.outputs.manifest) {
                this.outputs.manifest.value = manifestJson;
            }
            this.controllers.manifest?.setValue?.(manifestJson);
        }

        buildMarkup(data) {
            const layers = data.elements.map((element, index) => {
                const className = `item-${index + 1}`;
                switch (element.type) {
                    case 'text':
                        return `    <div class="${className}">${element.content || ''}</div>`;
                    case 'field':
                        return `    <div class="${className}">{{${element.fieldKey || 'field'}}}</div>`;
                    case 'image':
                        return `    <div class="${className}">{{${element.fieldKey || 'avatar'}}}</div>`;
                    case 'shape':
                        return `    <div class="${className}"></div>`;
                    default:
                        return `    <div class="${className}"></div>`;
                }
            });
            return [
                '<div class="badge">',
                ...layers,
                '</div>',
            ].join('\n');
        }

        buildStyles(data) {
            const {badge} = data;
            const base = [
                `.badge {`,
                `  position: relative;`,
                `  width: ${formatNumber(badge.width)}mm;`,
                `  height: ${formatNumber(badge.height)}mm;`,
                `  display: block;`,
                `  font-family: "Inter", "Segoe UI", sans-serif;`,
                `  color: #0f172a;`,
                `}`,
            ];

            const layers = data.elements.map((element, index) => {
                const className = `.badge .item-${index + 1}`;
                const baseStyles = [
                    `position: absolute`,
                    `left: ${formatNumber(pxToMm(element.x))}mm`,
                    `top: ${formatNumber(pxToMm(element.y))}mm`,
                    `width: ${formatNumber(pxToMm(element.width))}mm`,
                    `height: ${formatNumber(pxToMm(element.height))}mm`,
                ];
                if (element.rotation) {
                    baseStyles.push(`transform: rotate(${formatNumber(element.rotation)}deg)`);
                }

                let specific = [];
                if (element.type === 'text' || element.type === 'field') {
                    specific = [
                        `display: flex`,
                        `align-items: center`,
                        `justify-content: ${this.mapAlign(element.textAlign)}`,
                        `font-size: ${formatNumber(element.fontSize || 16)}px`,
                        `font-weight: ${element.fontWeight || 400}`,
                        `color: ${element.color || '#0f172a'}`,
                        `text-transform: ${element.textTransform || 'none'}`,
                        `padding: 0.25rem`,
                    ];
                } else if (element.type === 'image') {
                    specific = [
                        `border-radius: ${formatNumber(pxToMm(element.borderRadius || 0))}mm`,
                        `overflow: hidden`,
                        `display: flex`,
                        `align-items: center`,
                        `justify-content: center`,
                    ];
                } else if (element.type === 'shape') {
                    specific = [
                        `background: ${element.background || 'transparent'}`,
                        `border-radius: ${formatNumber(pxToMm(element.borderRadius || 0))}mm`,
                        `opacity: ${element.opacity ?? 1}`,
                    ];
                }

                const styles = [...baseStyles, ...specific];

                return [
                    `${className} {`,
                    `  ${styles.join(';\n  ')};`,
                    `}`,
                ].join('\n');
            });

            return [...base, '', ...layers].join('\n');
        }

        mapAlign(textAlign) {
            switch (textAlign) {
                case 'center':
                    return 'center';
                case 'right':
                    return 'flex-end';
                default:
                    return 'flex-start';
            }
        }

        buildManifest(data) {
            const fieldElements = data.elements.filter((item) => item.type === 'field');
            const fields = fieldElements.map((item) => ({
                id: item.fieldKey || 'field',
                label: item.placeholder || item.fieldKey || 'Поле',
                type: 'text',
                required: true,
            }));

            const manifestId = createId('designer-template');
            return {
                id: manifestId,
                name: 'Custom Badge',
                description: 'Шаблон, созданный в визуальном редакторе.',
                badgeSize: {
                    width: formatNumber(data.badge.width),
                    height: formatNumber(data.badge.height),
                },
                preview: '',
                fields,
            };
        }
    }

    global.BadgeTemplateExporter = TemplateExporter;
})(window);
