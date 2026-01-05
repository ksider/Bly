## Template Playground

Standalone Vite + Vanilla JS playground for badge templates.

### Run
- From repo root: `npm install` (once)
- Dev: `npm run dev -- --config modules/template-playground/vite.config.js`
- Build: `npm run build -- --config modules/template-playground/vite.config.js`

### Features
- Two editors: Mustache HTML + LESS (compiled in-browser)
- Toolbox chips for all badge fields plus snippet buttons
- Template meta inputs (name/description/size) and badge size controls (mm) tied to preview
- Loads sample data from `/example/sample.json` with participant selector and fallback
- Sanitized, sandboxed iframe preview; optional QR code data URLs
- Download/load buttons for `template.json`, `badge.mustache`, `theme.less`
- Error panel for JSON/Mustache/LESS issues (debounced updates)
