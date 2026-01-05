## BLY 1.0

Use Mustache templates for badges. Templates live in `src/templates/<templateId>/` and consist of:
1. `template.json` — metadata:
   - `name`: human‑readable title
   - `description`: short description for the picker
   - `size`: freeform label (e.g., `90x55mm`)
2. `badge.mustache` — HTML fragment rendered per participant (no `<html>`/`<body>`).
3. `theme.css` — styles scoped to the badge wrapper.

### Available participant fields
Canonical keys exposed to Mustache and the UI:
- Required: `id` (uuid or number), `firstName`, `lastName`
- Recommended: `displayName`, `role`, `company`, `title`, `country`, `city`, `email`, `phone`, `qrValue`, `badgeType`, `note`
- Event/branding (global or per-person override): `eventName`, `eventDate`, `eventLocation`, `eventLogo`, `sponsorLogo`

When authoring a template, use `{{fieldName}}` or section helpers like `{{#role}}...{{/role}}` for optional fields.

### Sponsor logos array
- The field `sponsorLogo` accepts either a single string (URL/dataURI) or an array of strings.
- In the UI form, comma-separated URLs will be split into an array.
- In Mustache, iterate with a section:
```mustache
{{#sponsorLogo}}
  <img class="sponsor" src="{{.}}" alt="Sponsor logo" />
{{/sponsorLogo}}
```

### Example `badge.mustache`
```mustache
<div class="badge-surface">
  <div class="name">{{displayName}}</div>
  {{#title}}<div class="title">{{title}}</div>{{/title}}
  {{#company}}<div class="company">{{company}}</div>{{/company}}
  {{#role}}<div class="chip">{{role}}</div>{{/role}}
  {{#qrValue}}<div class="qr-box" data-qr="{{qrValue}}"></div>{{/qrValue}}
</div>
```

### Example `theme.css`
```css
.badge-surface {
  display: grid;
  gap: 2mm;
  padding: 3mm;
  border: 0.3mm solid #dfe3ff;
  border-radius: 1.5mm;
  background: #f9fbff;
  height: 100%;
}
.name { font-size: 7mm; font-weight: 700; }
.title, .company { font-size: 3mm; }
.chip { display: inline-block; padding: 0.6mm 1.6mm; background: #0b75f5; color: #fff; border-radius: 1mm; }
.qr-box { width: 16mm; height: 16mm; background: #fff; border: 0.3mm solid #dfe3ff; }
```

### Adding fields to the edit form
1) Add inputs to `src/ui/components/ParticipantEditor.js` (matching the canonical field names above).
2) If importing CSV/JSON with different column names, extend the alias map in `src/core/normalize.js`.
3) To show new fields in the participants table, enable them via the Columns popup (or add new column labels in `ParticipantsTable.js`).

### Adding new templates
Place each template in its own folder under `src/templates/<templateId>/` with files:
- `template.json` (name, description, size)
- `badge.mustache`
- `theme.css`

Templates are auto-discovered at build time; after adding a folder, restart dev server or rebuild, and it will appear in the Template picker.
