import { getNamedCharacterReference } from './entities.ts';
import { other } from './rules.ts';

/**
 * Helpers
 */
const escapeReplacements: { [index: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const getEscapeReplacement = (ch: string) => escapeReplacements[ch];

export function escapeHtmlEntities(html: string, encode?: boolean) {
  if (encode) {
    if (other.escapeTest.test(html)) {
      return html.replace(other.escapeReplace, getEscapeReplacement);
    }
  } else {
    if (other.escapeTestNoEncode.test(html)) {
      return html.replace(other.escapeReplaceNoEncode, getEscapeReplacement);
    }
  }

  return html;
}

/**
 * Numeric character references are recognized outside code and are equivalent to the
 * character they name. Values that are zero, out of range, or a surrogate become the
 * replacement character.
 */
export function decodeNumericCharacterReferences(text: string) {
  return text.replace(other.numericCharacterReference, (_, dec: string, hex: string) => {
    const code = dec === undefined ? Number.parseInt(hex, 16) : Number.parseInt(dec, 10);
    if (code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
      return '�';
    }
    return String.fromCodePoint(code);
  });
}

/**
 * Decodes numeric and named character references, e.g. `&#246;` and
 * `&ouml;`, to the characters they name. Used for link destinations and
 * titles, where CommonMark requires references to be resolved before the
 * value is percent-encoded (destination) or HTML-escaped (title); see
 * CommonMark 0.31.2 examples 32, 33 and 503. Plain text is intentionally
 * not decoded here: references there are left for the browser to resolve.
 *
 * Named references come from the full HTML5 table. Per CommonMark 0.31.2
 * section 2.5 the trailing semicolon is required for every reference: one
 * without it (e.g. `&copy`) is left as-is, so query strings such as
 * `?a=1&not` are not corrupted. The semicolon is consumed for all three
 * reference kinds, so `&#246;` decodes to `\u00f6` rather than `\u00f6;`.
 */
const characterReference = /&(?:#([0-9]{1,7})|#[Xx]([A-Fa-f0-9]{1,6})|([A-Za-z][A-Za-z0-9]*));/g;

export function decodeCharacterReferences(text: string) {
  return text.replace(characterReference, (match: string, dec: string, hex: string, name: string) => {
    if (dec !== undefined || hex !== undefined) {
      const code = dec === undefined ? Number.parseInt(hex, 16) : Number.parseInt(dec, 10);
      if (code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
        return '\uFFFD';
      }
      return String.fromCodePoint(code);
    }
    const value = getNamedCharacterReference(name + ';');
    return value === undefined ? match : value;
  });
}

export function cleanUrl(href: string) {
  try {
    href = encodeURI(href).replace(other.percentDecode, '%');
  } catch {
    return null;
  }
  return href;
}

export function splitCells(tableRow: string, count?: number) {
  // ensure that every cell-delimiting pipe has a space
  // before it to distinguish it from an escaped pipe
  const row = tableRow.replace(other.findPipe, (match, offset, str) => {
      let escaped = false;
      let curr = offset;
      while (--curr >= 0 && str[curr] === '\\') escaped = !escaped;
      if (escaped) {
        // odd number of slashes means | is escaped
        // so we leave it alone
        return '|';
      } else {
        // add space before unescaped |
        return ' |';
      }
    }),
    cells = row.split(other.splitPipe);
  let i = 0;

  // First/last cell in a row cannot be empty if it has no leading/trailing pipe
  if (!cells[0].trim()) {
    cells.shift();
  }
  if (cells.length > 0 && !cells.at(-1)?.trim()) {
    cells.pop();
  }

  if (count) {
    if (cells.length > count) {
      cells.splice(count);
    } else {
      while (cells.length < count) cells.push('');
    }
  }

  for (; i < cells.length; i++) {
    // leading or trailing whitespace is ignored per the gfm spec
    cells[i] = cells[i].trim().replace(other.slashPipe, '|');
  }
  return cells;
}

/**
 * Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
 * /c*$/ is vulnerable to REDOS.
 *
 * @param str
 * @param c
 * @param invert Remove suffix of non-c chars instead. Default falsey.
 */
export function rtrim(str: string, c: string, invert?: boolean) {
  const l = str.length;
  if (l === 0) {
    return '';
  }

  // Length of suffix matching the invert condition.
  let suffLen = 0;

  // Step left until we fail to match the invert condition.
  while (suffLen < l) {
    const currChar = str.charAt(l - suffLen - 1);
    if (currChar === c && !invert) {
      suffLen++;
    } else if (currChar !== c && invert) {
      suffLen++;
    } else {
      break;
    }
  }

  return str.slice(0, l - suffLen);
}

export function trimTrailingBlankLines(str: string) {
  const lines = str.split('\n');
  let end = lines.length - 1;
  while (end >= 0 && other.blankLine.test(lines[end])) {
    end--;
  }
  if (lines.length - end <= 2) {
    // we want to keep single trailing blank lines
    return str;
  }

  return lines.slice(0, end + 1).join('\n');
}

/**
 * Normalizes a link label so definitions and references can be matched.
 * CommonMark asks for a Unicode case fold, which `toLowerCase()` does not
 * reach: `ẞ` lowercases to `ß` and so never meets `SS`. Round-tripping
 * through upper case does, as in commonmark.js; the final `toLowerCase()`
 * keeps the folded label lower case, the form `def.tag` has always used.
 */
export function normalizeLabel(label: string) {
  // The spec also asks for leading and trailing spaces, tabs and line endings
  // to be stripped. Doing it here keeps every call site in agreement: the
  // definition and the reference have to normalize to the same key.
  return label.trim().toLowerCase().toUpperCase().toLowerCase();
}

export function findClosingBracket(str: string, b: string) {
  if (str.indexOf(b[1]) === -1) {
    return -1;
  }

  let level = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\') {
      i++;
    } else if (str[i] === b[0]) {
      level++;
    } else if (str[i] === b[1]) {
      level--;
      if (level < 0) {
        return i;
      }
    }
  }
  if (level > 0) {
    return -2;
  }

  return -1;
}

export function expandTabs(line: string, indent = 0) {
  let col = indent;
  let expanded = '';
  for (const char of line) {
    if (char === '\t') {
      const added = 4 - (col % 4);
      expanded += ' '.repeat(added);
      col += added;
    } else {
      expanded += char;
      col++;
    }
  }

  return expanded;
}
