export function paginate(participants, layout, options = {}) {
  const perPage = layout.perPage || 1;
  const pages = [];
  let chunk = [];

  participants.forEach((participant) => {
    chunk.push(participant);
    if (chunk.length === perPage) {
      pages.push(chunk);
      chunk = [];
    }
  });

  if (chunk.length) {
    if (options.fillBlanks) {
      while (chunk.length < perPage) {
        chunk.push(null);
      }
    }
    pages.push(chunk);
  }

  if (!pages.length) pages.push(options.fillBlanks ? Array(perPage).fill(null) : []);
  return pages;
}
