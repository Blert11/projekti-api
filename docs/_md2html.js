const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'Raporti_Teknik.md');
const outPath = path.join(__dirname, 'Raporti_Teknik.html');

let src = fs.readFileSync(srcPath, 'utf8');

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s) {
  let t = escapeHtml(s);
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return t;
}

let noteHtml = '';
const commentMatch = src.match(/^<!--([\s\S]*?)-->\s*/);
if (commentMatch) {
  const noteLines = commentMatch[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^\d+\)/.test(l));
  noteHtml =
    '<div class="note"><strong>SHENIM PER STUDENTIN (fshije kete kuti para dorezimit):</strong><ul>' +
    noteLines.map((l) => `<li>${escapeHtml(l)}</li>`).join('') +
    '</ul></div>';
  src = src.slice(commentMatch[0].length);
}

function renderTable(lines) {
  const rows = lines.map((l) =>
    l
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim())
  );
  const header = rows[0];
  const body = rows.slice(2); // skip separator row
  let html = '<table><thead><tr>';
  header.forEach((c) => (html += `<th>${inline(c)}</th>`));
  html += '</tr></thead><tbody>';
  body.forEach((r) => {
    html += '<tr>';
    r.forEach((c) => (html += `<td>${inline(c)}</td>`));
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

function classify(line) {
  const t = line.trim();
  if (t === '') return 'blank';
  if (t.startsWith('```')) return 'fence';
  if (t.startsWith('|')) return 'table';
  if (/^#{1,4}\s+/.test(t)) return 'heading';
  if (/^-{3,}\s*$/.test(t)) return 'hr';
  if (t.startsWith('>')) return 'quote';
  if (/^[-*]\s+/.test(t)) return 'ul';
  if (/^\d+\.\s+/.test(t)) return 'ol';
  return 'text';
}

const lines = src.split('\n');
let html = '';
let i = 0;

while (i < lines.length) {
  const line = lines[i];
  const type = classify(line);

  if (type === 'blank') {
    i++;
    continue;
  }

  if (type === 'fence') {
    const buf = [];
    i++;
    while (i < lines.length && !lines[i].trim().startsWith('```')) {
      buf.push(lines[i]);
      i++;
    }
    i++; // skip closing fence
    html += `<pre>${escapeHtml(buf.join('\n'))}</pre>\n`;
    continue;
  }

  if (type === 'table') {
    const buf = [];
    while (i < lines.length && classify(lines[i]) === 'table') {
      buf.push(lines[i]);
      i++;
    }
    html += renderTable(buf) + '\n';
    continue;
  }

  if (type === 'heading') {
    const m = line.trim().match(/^(#{1,4})\s+(.*)$/);
    const level = m[1].length;
    html += `<h${level}>${inline(m[2])}</h${level}>\n`;
    i++;
    continue;
  }

  if (type === 'hr') {
    html += '<div class="page-break"></div>\n';
    i++;
    continue;
  }

  if (type === 'quote') {
    const buf = [];
    while (i < lines.length && classify(lines[i]) === 'quote') {
      buf.push(lines[i].trim().replace(/^>\s?/, ''));
      i++;
    }
    html += '<blockquote>';
    let j = 0;
    while (j < buf.length) {
      if (buf[j].startsWith('- ')) {
        html += '<ul>';
        while (j < buf.length && buf[j].startsWith('- ')) {
          html += `<li>${inline(buf[j].slice(2))}</li>`;
          j++;
        }
        html += '</ul>';
      } else if (buf[j] === '') {
        j++;
      } else {
        html += `<p>${inline(buf[j])}</p>`;
        j++;
      }
    }
    html += '</blockquote>\n';
    continue;
  }

  if (type === 'ul' || type === 'ol') {
    const tag = type === 'ul' ? 'ul' : 'ol';
    const marker = type === 'ul' ? /^[-*]\s+/ : /^\d+\.\s+/;
    html += `<${tag}>\n`;
    let itemBuf = null;
    while (i < lines.length) {
      const t2 = classify(lines[i]);
      if (t2 === type) {
        if (itemBuf !== null) html += `<li>${inline(itemBuf.join(' '))}</li>\n`;
        itemBuf = [lines[i].trim().replace(marker, '')];
        i++;
      } else if (t2 === 'text' && itemBuf !== null) {
        itemBuf.push(lines[i].trim());
        i++;
      } else {
        break;
      }
    }
    if (itemBuf !== null) html += `<li>${inline(itemBuf.join(' '))}</li>\n`;
    html += `</${tag}>\n`;
    continue;
  }

  // text -> paragraph (join soft-wrapped lines)
  const buf = [];
  while (i < lines.length && classify(lines[i]) === 'text') {
    buf.push(lines[i].trim());
    i++;
  }
  html += `<p>${inline(buf.join(' '))}</p>\n`;
}

const css = `
@page { size: A4; margin: 2.2cm; }
body { font-family: Calibri, Arial, sans-serif; font-size: 11.5pt; line-height: 1.4; color: #1a1a1a; }
h1 { font-size: 22pt; text-align: center; margin-top: 0.5em; }
h2 { font-size: 16pt; border-bottom: 1px solid #999; padding-bottom: 4px; margin-top: 1.6em; page-break-before: always; }
h3 { font-size: 13pt; margin-top: 1.2em; }
h4 { font-size: 11.5pt; margin-top: 1em; }
table { border-collapse: collapse; width: 100%; margin: 0.8em 0; font-size: 10pt; }
th, td { border: 1px solid #888; padding: 4px 6px; text-align: left; vertical-align: top; }
th { background: #e8e8e8; }
pre { background: #f5f5f5; border: 1px solid #ccc; padding: 8px; font-family: "Courier New", monospace; font-size: 9pt; line-height: 1.25; white-space: pre; overflow-x: auto; }
code { font-family: "Courier New", monospace; background: #f0f0f0; padding: 0 2px; }
blockquote { border-left: 3px solid #aaa; margin-left: 0; padding-left: 12px; color: #444; font-style: italic; }
.note { background: #fff8d6; border: 1px solid #e0c200; padding: 10px 14px; margin-bottom: 1.5em; font-size: 10pt; }
.page-break { page-break-before: always; }
hr { border: none; border-top: 1px solid #ccc; margin: 1.5em 0; }
`;

const out = `<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="UTF-8">
<title>Raporti Teknik i Projektit</title>
<style>${css}</style>
</head>
<body>
${noteHtml}
${html}
</body>
</html>
`;

fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote', outPath, `(${out.length} bytes)`);
