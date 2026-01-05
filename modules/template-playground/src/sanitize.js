export function sanitizeHTML(input) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${input}</div>`, 'text/html');
  const wrapper = doc.body.firstElementChild;

  doc.querySelectorAll('script, style').forEach((el) => el.remove());

  doc.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = (attr.value || '').trim();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        return;
      }
      if ((name === 'src' || name === 'href') && /^javascript:/i.test(value)) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return wrapper ? wrapper.innerHTML : doc.body.innerHTML;
}
