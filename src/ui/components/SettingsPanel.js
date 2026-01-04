import { badgePresets, paperPresets } from '../../store/schema.js';

export default function SettingsPanel({ onPageChange, onBadgeChange }) {
  const container = document.createElement('section');
  container.className = 'panel';
  container.innerHTML = `
    <h3>Page Settings</h3>
    <form class="pure-form pure-form-stacked settings-form">
      <label>Paper Size
        <select name="paperSize" class="pure-input-1">
          <option value="A4">A4</option>
          <option value="Letter">Letter</option>
          <option value="Custom">Custom (mm)</option>
        </select>
      </label>
      <div class="grid-2 custom-size">
        <label>Width (mm) <input type="number" step="0.1" name="customWidthMm" /></label>
        <label>Height (mm) <input type="number" step="0.1" name="customHeightMm" /></label>
      </div>
      <label>Orientation
        <select name="orientation" class="pure-input-1">
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </label>
      <div class="grid-2">
        <label>Margin Left (mm) <input type="number" step="0.1" name="marginLeftMm" /></label>
        <label>Margin Right (mm) <input type="number" step="0.1" name="marginRightMm" /></label>
        <label>Margin Top (mm) <input type="number" step="0.1" name="marginTopMm" /></label>
        <label>Margin Bottom (mm) <input type="number" step="0.1" name="marginBottomMm" /></label>
      </div>
    </form>
    <h3>Badge Settings</h3>
    <form class="pure-form pure-form-stacked badge-form">
      <label>Size Preset
        <select name="sizePreset" class="pure-input-1">
          <option value="90x55">90 x 55</option>
          <option value="100x70">100 x 70</option>
          <option value="A6">A6</option>
          <option value="custom">Custom (mm)</option>
        </select>
      </label>
      <div class="grid-2 badge-custom">
        <label>Width (mm) <input type="number" step="0.1" name="customWidthMm" /></label>
        <label>Height (mm) <input type="number" step="0.1" name="customHeightMm" /></label>
      </div>
      <label>Orientation
        <select name="orientation" class="pure-input-1">
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </label>
      <div class="grid-2">
        <label>Gap X (mm) <input type="number" step="0.1" name="gapXmm" /></label>
        <label>Gap Y (mm) <input type="number" step="0.1" name="gapYmm" /></label>
      </div>
      <label class="pure-checkbox">
        <input type="checkbox" name="autoGrid" checked /> Auto grid (fill blanks)
      </label>
    </form>
    <div class="layout-summary"></div>
  `;

  const pageForm = container.querySelector('.settings-form');
  const badgeForm = container.querySelector('.badge-form');
  const summary = container.querySelector('.layout-summary');
  const customSizeGroup = container.querySelector('.custom-size');
  const badgeCustomGroup = container.querySelector('.badge-custom');

  function handlePageChange() {
    const formData = new FormData(pageForm);
    onPageChange?.(Object.fromEntries(formData.entries()));
  }

  function handleBadgeChange() {
    const formData = new FormData(badgeForm);
    const payload = Object.fromEntries(formData.entries());
    payload.autoGrid = badgeForm.querySelector('input[name="autoGrid"]').checked;
    onBadgeChange?.(payload);
  }

  pageForm.addEventListener('input', handlePageChange);
  badgeForm.addEventListener('input', handleBadgeChange);

  function update(state, layout) {
    Object.entries(state.pageSettings || {}).forEach(([key, value]) => {
      const field = pageForm.elements.namedItem(key);
      if (field) field.value = value;
    });
    Object.entries(state.badgeSettings || {}).forEach(([key, value]) => {
      const field = badgeForm.elements.namedItem(key);
      if (!field) return;
      if (field.type === 'checkbox') {
        field.checked = Boolean(value);
      } else {
        field.value = value;
      }
    });
    customSizeGroup.style.display = state.pageSettings.paperSize === 'Custom' ? 'grid' : 'none';
    badgeCustomGroup.style.display = state.badgeSettings.sizePreset === 'custom' ? 'grid' : 'none';

    if (layout) {
      summary.innerHTML = `
        <div class="layout-chip">Cols ${layout.cols}</div>
        <div class="layout-chip">Rows ${layout.rows}</div>
        <div class="layout-chip">Badges per page ${layout.perPage}</div>
        <div class="layout-chip">Printable ${layout.printableWidth.toFixed(1)} × ${layout.printableHeight.toFixed(1)} mm</div>
      `;
    }
  }

  update(
    {
      pageSettings: {
        paperSize: Object.keys(paperPresets)[0],
        customWidthMm: paperPresets.A4.widthMm,
        customHeightMm: paperPresets.A4.heightMm,
        orientation: 'portrait',
        marginTopMm: 10,
        marginRightMm: 10,
        marginBottomMm: 10,
        marginLeftMm: 10,
      },
      badgeSettings: {
        sizePreset: Object.keys(badgePresets)[0],
        customWidthMm: badgePresets['90x55'].widthMm,
        customHeightMm: badgePresets['90x55'].heightMm,
        orientation: 'landscape',
        gapXmm: 4,
        gapYmm: 4,
        autoGrid: true,
      },
    },
    null
  );

  return { element: container, update };
}
