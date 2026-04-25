const fs = require('fs');

const paths = [
  'src/i18n/locales/fr.ts',
  'src/i18n/locales/it.ts',
  'src/i18n/inlineText.ts',
];

const cp1252ByCodePoint = new Map([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

const mojibakePattern = /[\u00c3\u00c2\u00e2\u00ef]/;

function decodeMojibake(text) {
  const bytes = [];

  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (codePoint <= 0xff) {
      bytes.push(codePoint);
      continue;
    }

    const mapped = cp1252ByCodePoint.get(codePoint);
    if (mapped === undefined) return text;
    bytes.push(mapped);
  }

  const decoded = Buffer.from(bytes).toString('utf8');
  return decoded.includes('\ufffd') ? text : decoded;
}

function repair(text) {
  let output = text;

  for (let i = 0; i < 4 && mojibakePattern.test(output); i += 1) {
    const decoded = decodeMojibake(output);
    if (decoded === output) break;
    output = decoded;
  }

  return output;
}

function repairStringLiteral(match, quote, body) {
  if (!mojibakePattern.test(body)) return match;
  return `${quote}${repair(body)}${quote}`;
}

for (const path of paths) {
  const source = fs.readFileSync(path, 'utf8');
  const output = source.replace(/(['"])((?:\\.|(?!\1)[\s\S])*?)\1/g, repairStringLiteral);
  fs.writeFileSync(path, output, 'utf8');
  console.log(`${path}: ${source === output ? 'unchanged' : 'repaired'}`);
}
