
function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function inline(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

// Plain-text version for list excerpts (mockup's .texcerpt): strip the
// whitelist's own markers instead of rendering them, then collapse to a
// single line for line-clamp to handle.
export function plainExcerpt(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^- /gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatBody(text: string): string {
  return escapeHtml(text)
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n');

      if (lines.every((line) => /^- /.test(line))) {
        return `<ul>${lines.map((line) => `<li>${inline(line.slice(2))}</li>`).join('')}</ul>`;
      }

      const items = lines.filter((line) => /^- /.test(line));
      if (items.length) {
        const head = lines.filter((line) => !/^- /.test(line));
        return `<p>${inline(head.join('<br>'))}</p><ul>${items.map((line) => `<li>${inline(line.slice(2))}</li>`).join('')}</ul>`;
      }

      return `<p>${inline(lines.join('<br>'))}</p>`;
    })
    .join('');
}
