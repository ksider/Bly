export default function Toolbar({
  onImportCSV,
  onImportJSON,
  onExportCSV,
  onExportJSON,
  onExportPDF,
  onReset,
  onPrint,
}) {
  const container = document.createElement('div');
  container.className = 'toolbar pure-g';

  const left = document.createElement('div');
  left.className = 'pure-u-1 pure-u-md-2-3';
  const right = document.createElement('div');
  right.className = 'pure-u-1 pure-u-md-1-3 align-right';

  container.append(left, right);

  const importCsvInput = document.createElement('input');
  importCsvInput.type = 'file';
  importCsvInput.accept = '.csv,text/csv';
  importCsvInput.style.display = 'none';

  const importJsonInput = document.createElement('input');
  importJsonInput.type = 'file';
  importJsonInput.accept = '.json,application/json';
  importJsonInput.style.display = 'none';

  const importCsvBtn = document.createElement('button');
  importCsvBtn.className = 'pure-button';
  importCsvBtn.textContent = 'Import CSV';
  importCsvBtn.addEventListener('click', () => importCsvInput.click());

  const importJsonBtn = document.createElement('button');
  importJsonBtn.className = 'pure-button';
  importJsonBtn.textContent = 'Import JSON';
  importJsonBtn.addEventListener('click', () => importJsonInput.click());

  const exportCsvBtn = document.createElement('button');
  exportCsvBtn.className = 'pure-button';
  exportCsvBtn.textContent = 'Export CSV';
  exportCsvBtn.addEventListener('click', () => onExportCSV?.());

  const exportJsonBtn = document.createElement('button');
  exportJsonBtn.className = 'pure-button';
  exportJsonBtn.textContent = 'Export JSON';
  exportJsonBtn.addEventListener('click', () => onExportJSON?.());

  const resetBtn = document.createElement('button');
  resetBtn.className = 'pure-button button-secondary';
  resetBtn.textContent = 'Reset';
  resetBtn.addEventListener('click', () => onReset?.());

  const pdfBtn = document.createElement('button');
  pdfBtn.className = 'pure-button';
  pdfBtn.textContent = 'Save PDF';
  pdfBtn.addEventListener('click', () => onExportPDF?.());

  const printBtn = document.createElement('button');
  printBtn.className = 'pure-button pure-button-primary';
  printBtn.textContent = 'Print';
  printBtn.addEventListener('click', () => onPrint?.());

  left.append(importCsvBtn, importJsonBtn, exportCsvBtn, exportJsonBtn, resetBtn);
  right.append(pdfBtn, printBtn);
  container.append(importCsvInput, importJsonInput);

  importCsvInput.addEventListener('change', async (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onImportCSV?.(text);
    evt.target.value = '';
  });

  importJsonInput.addEventListener('change', async (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onImportJSON?.(text);
    evt.target.value = '';
  });

  return { element: container, printButton: printBtn };
}
