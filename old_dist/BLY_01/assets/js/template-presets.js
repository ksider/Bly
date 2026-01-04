(function (global) {
    const PRESET_TEMPLATES = [
        {
            id: 'modern-landscape',
            name: 'Современный горизонтальный',
            description: 'Широкий бейдж с акцентной полосой и крупным именем — отлично подходит для конференций с корпоративным стилем.',
            badgeSize: {width: 100, height: 70},
            fields: [
                {id: 'name', label: 'Имя', type: 'text', required: true},
                {id: 'role', label: 'Роль', type: 'text'},
                {id: 'company', label: 'Компания', type: 'text'},
                {id: 'tagline', label: 'Пометка', type: 'text'},
            ],
            markup: `<div class="badge badge--landscape">
  <div class="badge__accent"></div>
  <div class="badge__content">
    <div class="badge__top">
      <div class="badge__name">{{name}}</div>
      <div class="badge__meta">
        <span class="badge__role">{{role}}</span>
        <span class="badge__company">{{company}}</span>
      </div>
    </div>
    <div class="badge__tagline">{{tagline}}</div>
  </div>
</div>`,
            styles: `.badge {
  width: 100%;
  height: 100%;
  display: flex;
  background: linear-gradient(135deg, #1e315f 0%, #243b80 48%, #1e73be 100%);
  color: #0d1a35;
  border-radius: 5mm;
  overflow: hidden;
  box-shadow: 0 4mm 12mm rgba(19, 32, 60, 0.35);
  font-family: "Inter", "Segoe UI", Roboto, sans-serif;
}

.badge__accent {
  width: 12mm;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.6) 90%);
}

.badge__content {
  flex: 1;
  background: radial-gradient(circle at 90% 15%, rgba(255, 255, 255, 0.35), transparent 45%), #ffffff;
  padding: 7mm 8mm;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.badge__top {
  display: flex;
  flex-direction: column;
  gap: 4mm;
}

.badge__name {
  font-size: 13mm;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
}

.badge__meta {
  display: flex;
  align-items: center;
  gap: 3mm;
  font-size: 5mm;
  font-weight: 500;
  color: #44506d;
}

.badge__role:empty,
.badge__company:empty,
.badge__tagline:empty {
  display: none;
}

.badge__company::before {
  content: "•";
  margin-right: 2mm;
  opacity: 0.45;
}

.badge__role:empty ~ .badge__company::before {
  content: "";
}

.badge__tagline {
  margin-top: 6mm;
  padding: 2mm 3mm;
  font-size: 4mm;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #0e2348;
  background: rgba(30, 115, 190, 0.12);
  border-radius: 3mm;
  width: fit-content;
}`,
            defaultSettings: {
                orientation: 'landscape',
                pageSize: 'A4',
                gap: 6,
                margin: 10,
            },
        },
        {
            id: 'minimal-portrait',
            name: 'Минималистичный вертикальный',
            description: 'Лаконичный вертикальный бейдж с акцентом на имени и возможностью указать город или компанию.',
            badgeSize: {width: 75, height: 110},
            fields: [
                {id: 'name', label: 'Имя', type: 'text', required: true},
                {id: 'company', label: 'Компания', type: 'text'},
                {id: 'city', label: 'Город', type: 'text'},
            ],
            markup: `<div class="badge badge--portrait">
  <div class="badge__stripe"></div>
  <div class="badge__content">
    <div class="badge__name">{{name}}</div>
    <div class="badge__company">{{company}}</div>
    <div class="badge__city">{{city}}</div>
  </div>
</div>`,
            styles: `.badge {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 6mm;
  border: 1.2mm solid rgba(27, 43, 79, 0.12);
  overflow: hidden;
  box-shadow: 0 3mm 12mm rgba(12, 18, 34, 0.25);
  font-family: "Manrope", "Segoe UI", sans-serif;
}

.badge__stripe {
  height: 18mm;
  background: linear-gradient(90deg, #ff9874 0%, #ff5d6c 50%, #6543ff 100%);
}

.badge__content {
  flex: 1;
  padding: 10mm 8mm 9mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #1d2438;
}

.badge__name {
  font-size: 14mm;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.01em;
}

.badge__company {
  margin-top: 6mm;
  font-size: 6mm;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.24em;
  color: #4b5471;
}

.badge__city {
  margin-top: 4mm;
  font-size: 5mm;
  color: #6d7691;
  letter-spacing: 0.06em;
}

.badge__company:empty,
.badge__city:empty {
  display: none;
}`,
            defaultSettings: {
                orientation: 'portrait',
                pageSize: 'A4',
                gap: 8,
                margin: 12,
            },
        },
        {
            id: 'compact-grid',
            name: 'Компактный сеточный',
            description: 'Компактный бейдж 90×60 мм, рассчитанный на печать большого количества участников на одном листе.',
            badgeSize: {width: 90, height: 60},
            fields: [
                {id: 'name', label: 'Имя', type: 'text', required: true},
                {id: 'company', label: 'Компания', type: 'text'},
            ],
            markup: `<div class="badge badge--compact">
  <div class="badge__name">{{name}}</div>
  <div class="badge__company">{{company}}</div>
</div>`,
            styles: `.badge {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.06), rgba(14, 165, 233, 0.08));
  border: 0.8mm solid rgba(29, 78, 216, 0.35);
  border-radius: 4mm;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 6mm;
  text-align: center;
  font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
  color: #142349;
  box-shadow: inset 0 0 0 0.6mm rgba(255, 255, 255, 0.6);
}

.badge__name {
  font-size: 9mm;
  font-weight: 700;
  line-height: 1.1;
}

.badge__company {
  margin-top: 3mm;
  font-size: 5mm;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #33415d;
}

.badge__company:empty {
  display: none;
}`,
            defaultSettings: {
                orientation: 'landscape',
                pageSize: 'A4',
                gap: 4,
                margin: 8,
            },
        },
    ];

    global.BadgeTemplatePresets = PRESET_TEMPLATES;
})(window);
