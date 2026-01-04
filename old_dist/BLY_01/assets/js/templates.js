(function (global) {
    const TEMPLATE_LIST = [
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
        {
            id: 'mkmk-2019',
            name: 'МКМК 2019',
            description: 'Фирменный шаблон конференции МКМК 2019 с градиентным фоном и выделением фамилии.',
            badgeSize: {width: 96, height: 73.5},
            fields: [
                {id: 'name', label: 'Полное имя', type: 'text', required: true},
                {id: 'nameOrder', label: 'Порядок имени (western/eastern)', type: 'text'},
                {id: 'lastName', label: 'Фамилия', type: 'text'},
                {id: 'firstName', label: 'Имя', type: 'text'},
                {id: 'middleName', label: 'Отчество', type: 'text'},
                {id: 'job', label: 'Организация / роль', type: 'text'},
                {id: 'role', label: 'Код роли (committee/org/member)', type: 'text'},
            ],
            markup: `<div class="badge badge--mkmk" data-role="{{role}}">
  <div class="badge__background"></div>
  <div class="badge__content">
    <div class="badge__logo">
      <div class="badge__line">
        <span>ИПРИМ</span>
        <span class="badge__accent">РАН</span>
        <span class="badge__year">30</span>
      </div>
      <div class="badge__line">МКМК·2019</div>
    </div>
    <div class="badge__name">
      <span class="badge__surname">{{displayLastName}}</span>
      <span class="badge__given">
        <span class="badge__given-first">{{displayFirstName}}</span>
        <span class="badge__given-middle">{{displayMiddleName}}</span>
      </span>
    </div>
    <div class="badge__job">{{job}}</div>
  </div>
</div>`,
            styles: `.badge {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 6mm;
  box-shadow: 0 4mm 12mm rgba(12, 23, 46, 0.35);
  display: flex;
  align-items: stretch;
  font-family: "PT Sans", "Inter", sans-serif;
  letter-spacing: 0.03em;
  color: #0e192a;
}

.badge__background {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(12, 22, 44, 0.85) 0%, rgba(12, 22, 44, 0.25) 60%, rgba(255, 255, 255, 0.2) 100%),
    url("https://images.unsplash.com/photo-1522199992905-4485c0c88b9b?auto=format&fit=crop&w=900&q=80") center/cover no-repeat;
  z-index: 0;
  filter: saturate(1.1);
}

.badge__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8mm 7mm;
  width: 100%;
}

.badge__logo {
  text-transform: uppercase;
  font-family: "PT Mono", "JetBrains Mono", monospace;
  font-size: 3.3mm;
  letter-spacing: 1mm;
  line-height: 4mm;
  color: rgba(255, 255, 255, 0.85);
}

.badge__line {
  display: inline-flex;
  gap: 2mm;
  align-items: center;
  padding: 1mm 1.5mm;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 1.5mm;
  margin-bottom: 2mm;
  backdrop-filter: blur(2px);
}

.badge__accent {
  color: rgba(255, 255, 255, 0.65);
}

.badge__year {
  font-weight: 700;
  color: #f8fafc;
}

.badge__name {
  margin-top: 8mm;
  display: flex;
  flex-direction: column;
  gap: 1.5mm;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.badge__surname {
  font-size: 6.4mm;
  font-weight: 700;
  color: #ffffff;
  background: rgba(14, 25, 42, 0.72);
  padding: 1.5mm 2mm;
  border-radius: 1.5mm;
  width: fit-content;
  box-shadow: 0 2mm 8mm rgba(14, 25, 42, 0.28);
}

.badge__given {
  font-size: 4.2mm;
  color: rgba(241, 245, 255, 0.95);
  font-weight: 500;
  padding: 1mm 2mm;
  background: rgba(14, 25, 42, 0.45);
  border-radius: 1.2mm;
  width: fit-content;
  display: inline-flex;
  gap: 1.2mm;
}

.badge__given-middle:empty {
  display: none;
}

.badge__job {
  margin-top: auto;
  font-size: 3.2mm;
  line-height: 1.3;
  text-transform: none;
  letter-spacing: 0.04em;
  color: rgba(241, 245, 255, 0.92);
  padding: 1.5mm 2mm;
  background: rgba(14, 25, 42, 0.6);
  border-radius: 1.5mm;
  width: fit-content;
  max-width: 100%;
}

.badge[data-role="committee"] .badge__surname {
  background: rgba(41, 128, 185, 0.88);
}

.badge[data-role="committee"] .badge__given,
.badge[data-role="committee"] .badge__job {
  background: rgba(41, 128, 185, 0.65);
}

.badge[data-role="org"] .badge__surname {
  background: rgba(211, 84, 0, 0.88);
}

.badge[data-role="org"] .badge__given,
.badge[data-role="org"] .badge__job {
  background: rgba(211, 84, 0, 0.65);
}

.badge[data-role="member"] .badge__surname,
.badge[data-role="subscriber"] .badge__surname {
  background: rgba(14, 25, 42, 0.78);
}

.badge[data-role="member"] .badge__given,
.badge[data-role="member"] .badge__job,
.badge[data-role="subscriber"] .badge__given,
.badge[data-role="subscriber"] .badge__job {
  background: rgba(14, 25, 42, 0.55);
}`,
            defaultSettings: {
                orientation: 'landscape',
                pageSize: 'A4',
                gap: 6,
                margin: 10,
                nameOrder: 'eastern',
            },
        },
    ];

    global.BadgeTemplateManifest = TEMPLATE_LIST;
})(window);
