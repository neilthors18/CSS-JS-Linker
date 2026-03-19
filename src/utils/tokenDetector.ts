/**
 * tokenDetector.ts
 *
 * Shared logic to detect whether the cursor position is inside a
 * class="..." or id="..." HTML attribute, and extract the specific
 * token (class name or id) under the cursor.
 */

import * as vscode from 'vscode';

export type TokenKind = 'class' | 'id';

export interface DetectedToken {
  token: string;
  kind: TokenKind;
}

/**
 * Given the document and the cursor position, determines if the cursor
 * is inside a class or id HTML attribute and returns the token under
 * the cursor. Returns undefined if not applicable.
 */
export function detectToken(
  document: vscode.TextDocument,
  position: vscode.Position
): DetectedToken | undefined {
  // Get a wide context around the cursor to detect the enclosing attribute
  const lineText = document.lineAt(position.line).text;
  const offset = position.character;

  // Find the token word under the cursor (class names / ids: alphanumeric, -, _)
  const wordRange = document.getWordRangeAtPosition(
    position,
    /[\w-]+/
  );
  if (!wordRange) {
    return undefined;
  }
  const token = document.getText(wordRange);
  if (!token) {
    return undefined;
  }

  // Look backward from the cursor to find the enclosing attribute name
  // We scan the line looking for class="..." or id="..." patterns
  const textBeforeCursor = lineText.slice(0, offset);

  // Check if we are inside an id="..." attribute
  // Look for id=["'] then any chars up to our position (no closing quote in between)
  const idMatch = textBeforeCursor.match(/\bid=["']([^"']*)$/);
  if (idMatch) {
    // The cursor is inside id="...", verify our token is the complete id value
    // (ids are single tokens, no spaces)
    return { token, kind: 'id' };
  }

  // Check if we are inside a class="..." attribute
  const classMatch = textBeforeCursor.match(/\bclass=["']([^"']*)$/);
  if (classMatch) {
    return { token, kind: 'class' };
  }

  // Also handle multiline attributes: scan a few lines back
  if (position.line > 0) {
    const prevLines = document
      .getText(new vscode.Range(
        new vscode.Position(Math.max(0, position.line - 3), 0),
        position
      ));
    const idMultiline = prevLines.match(/\bid=["']([^"']*)$/s);
    if (idMultiline) {
      return { token, kind: 'id' };
    }
    const classMultiline = prevLines.match(/\bclass=["']([^"']*)$/s);
    if (classMultiline) {
      return { token, kind: 'class' };
    }
  }

  return undefined;
}
