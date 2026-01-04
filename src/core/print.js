export function attachPrintHandlers(button) {
  if (button) {
    button.addEventListener('click', () => window.print());
  }
  window.addEventListener('keydown', (evt) => {
    if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === 'p') {
      evt.preventDefault();
      window.print();
    }
  });
}
