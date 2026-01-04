import { paperPresets, badgePresets } from '../store/schema.js';

function resolvePageSize(settings) {
  const preset = paperPresets[settings.paperSize] || paperPresets.A4;
  const widthMm = settings.paperSize === 'Custom' ? Number(settings.customWidthMm) || preset.widthMm : preset.widthMm;
  const heightMm = settings.paperSize === 'Custom' ? Number(settings.customHeightMm) || preset.heightMm : preset.heightMm;
  const landscape = settings.orientation === 'landscape';
  return landscape ? { widthMm: heightMm, heightMm: widthMm } : { widthMm, heightMm };
}

function resolveBadgeSize(settings) {
  const preset = badgePresets[settings.sizePreset];
  const widthMm = settings.sizePreset === 'custom' ? Number(settings.customWidthMm) || 90 : preset.widthMm;
  const heightMm = settings.sizePreset === 'custom' ? Number(settings.customHeightMm) || 55 : preset.heightMm;
  const landscape = settings.orientation === 'landscape';
  return landscape ? { widthMm: Math.max(widthMm, heightMm), heightMm: Math.min(widthMm, heightMm) } : { widthMm: Math.min(widthMm, heightMm), heightMm: Math.max(widthMm, heightMm) };
}

export function computeLayout(pageSettings, badgeSettings) {
  const page = resolvePageSize(pageSettings);
  const badge = resolveBadgeSize(badgeSettings);
  const gapX = Number(badgeSettings.gapXmm) || 0;
  const gapY = Number(badgeSettings.gapYmm) || 0;

  const printableWidth =
    page.widthMm - (Number(pageSettings.marginLeftMm) + Number(pageSettings.marginRightMm));
  const printableHeight =
    page.heightMm - (Number(pageSettings.marginTopMm) + Number(pageSettings.marginBottomMm));

  const cols = Math.max(
    1,
    Math.floor((printableWidth + gapX) / (badge.widthMm + gapX))
  );
  const rows = Math.max(
    1,
    Math.floor((printableHeight + gapY) / (badge.heightMm + gapY))
  );
  const perPage = cols * rows || 1;

  return {
    page,
    badge,
    cols,
    rows,
    perPage,
    gapX,
    gapY,
    printableWidth,
    printableHeight,
  };
}
