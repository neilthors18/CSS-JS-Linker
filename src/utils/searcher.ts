/**
 * searcher.ts
 *
 * Pure functions for finding class/id references inside CSS and JS file text.
 *
 * CSS patterns:
 *  - .className  (selector)
 *  - #idName     (selector)
 *
 * JS patterns (class):
 *  - getElementsByClassName('className') / ("className") / (`className`)
 *  - querySelector('.className') / (".className") / (`.className`)
 *  - querySelectorAll('.className')
 *  - classList.add/remove/contains/toggle('className')
 *  - 'className' or "className" as standalone string (broad match)
 *
 * JS patterns (id):
 *  - getElementById('idName') / ("idName") / (`idName`)
 *  - querySelector('#idName') / ("#idName") / (`#idName`)
 *  - querySelectorAll('#idName')
 *  - '#idName' as standalone string
 */

export type TokenKind = 'class' | 'id';

export interface SearchResult {
  line: number;   // 0-indexed
  column: number; // 0-indexed, start of the matched token
}

// ─── Pattern builders ──────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildCssPatterns(token: string, kind: TokenKind): RegExp[] {
  const e = escapeRegex(token);
  if (kind === 'class') {
    // .className followed by a non-word char (space, { , > ~  +  ) [ : . # etc.)
    return [new RegExp(`\\.${e}(?=[\\s{,>~+)\\[:#.\\n]|$)`, 'g')];
  } else {
    return [new RegExp(`#${e}(?=[\\s{,>~+)\\[:#.\\n]|$)`, 'g')];
  }
}

function buildJsPatterns(token: string, kind: TokenKind): RegExp[] {
  const e = escapeRegex(token);
  const q = `['"\`]`; // quote chars

  if (kind === 'class') {
    return [
      // getElementsByClassName('token')
      new RegExp(`getElementsByClassName\\(${q}\\.?${e}${q}\\)`, 'g'),
      // querySelector/querySelectorAll('.token')
      new RegExp(`querySelectorAll?\\(${q}\\.${e}${q}\\)`, 'g'),
      // classList.add/remove/contains/toggle('token')
      new RegExp(`classList\\.(?:add|remove|contains|toggle|replace)\\([^)]*${q}${e}${q}`, 'g'),
      // Standalone string 'token' or "token"
      new RegExp(`(?<![#.\\w])${q}${e}${q}(?![\\w-])`, 'g'),
    ];
  } else {
    return [
      // getElementById('token')
      new RegExp(`getElementById\\(${q}${e}${q}\\)`, 'g'),
      // querySelector/querySelectorAll('#token')
      new RegExp(`querySelectorAll?\\(${q}#${e}${q}\\)`, 'g'),
      // Standalone '#token'
      new RegExp(`${q}#${e}${q}`, 'g'),
    ];
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Counts all occurrences of the given token inside the file text,
 * using both CSS-style patterns and JS-style patterns depending on fileType.
 */
export function countOccurrences(
  text: string,
  token: string,
  kind: TokenKind,
  fileType: 'css' | 'js'
): number {
  const patterns =
    fileType === 'css'
      ? buildCssPatterns(token, kind)
      : buildJsPatterns(token, kind);

  let total = 0;
  for (const re of patterns) {
    const matches = text.match(re);
    if (matches) {
      total += matches.length;
    }
  }
  return total;
}

/**
 * Returns the line and column of the FIRST occurrence of the token in the
 * file text. Returns undefined if not found.
 */
export function findFirstOccurrence(
  text: string,
  token: string,
  kind: TokenKind,
  fileType: 'css' | 'js'
): SearchResult | undefined {
  const patterns =
    fileType === 'css'
      ? buildCssPatterns(token, kind)
      : buildJsPatterns(token, kind);

  let earliest: { index: number; result: SearchResult } | undefined;

  for (const re of patterns) {
    re.lastIndex = 0;
    const match = re.exec(text);
    if (match && (earliest === undefined || match.index < earliest.index)) {
      const before = text.slice(0, match.index);
      const lines = before.split('\n');
      const line = lines.length - 1;
      const column = (lines[lines.length - 1] ?? '').length;
      earliest = { index: match.index, result: { line, column } };
    }
  }

  return earliest?.result;
}
