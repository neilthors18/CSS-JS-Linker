/**
 * definitionProvider.ts
 *
 * Provides Go-to-Definition (Ctrl+Click) for class names and IDs in HTML.
 * Returns locations in the linked CSS and JS files where the token first appears.
 */

import * as vscode from 'vscode';
import { extractLinkedFiles } from '../utils/linkExtractor';
import { resolvePaths } from '../utils/pathResolver';
import { findFirstOccurrence } from '../utils/searcher';
import { detectToken } from '../utils/tokenDetector';

const SUPPORTED_LANGUAGES = [
  'html',
  'django-html',
  'php',
  'jinja',
  'jinja2',
];

/**
 * Reads the text content of a file by its URI.
 * Returns undefined if the file cannot be read (does not throw).
 */
export async function readFileText(uri: vscode.Uri): Promise<string | undefined> {
  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(bytes).toString('utf8');
  } catch {
    return undefined;
  }
}

export function registerDefinitionProvider(): vscode.Disposable {
  return vscode.languages.registerDefinitionProvider(SUPPORTED_LANGUAGES, {
    async provideDefinition(
      document: vscode.TextDocument,
      position: vscode.Position
    ): Promise<vscode.Location[] | undefined> {
      const detected = detectToken(document, position);
      if (!detected) {
        return undefined;
      }

      const { token, kind } = detected;
      const documentText = document.getText();
      const linked = extractLinkedFiles(documentText);

      const [cssUris, jsUris] = await Promise.all([
        resolvePaths(linked.css, document.uri),
        resolvePaths(linked.js, document.uri),
      ]);

      if (cssUris.length === 0 && jsUris.length === 0) {
        return undefined;
      }

      const locations: vscode.Location[] = [];

      // Search CSS files
      for (const uri of cssUris) {
        const text = await readFileText(uri);
        if (text === undefined) {
          continue;
        }
        const found = findFirstOccurrence(text, token, kind, 'css');
        if (found) {
          const range = new vscode.Range(
            new vscode.Position(found.line, found.column),
            new vscode.Position(found.line, found.column + token.length + 1) // +1 for . or #
          );
          locations.push(new vscode.Location(uri, range));
        }
      }

      // Search JS files
      for (const uri of jsUris) {
        const text = await readFileText(uri);
        if (text === undefined) {
          continue;
        }
        const found = findFirstOccurrence(text, token, kind, 'js');
        if (found) {
          const range = new vscode.Range(
            new vscode.Position(found.line, found.column),
            new vscode.Position(found.line, found.column + token.length)
          );
          locations.push(new vscode.Location(uri, range));
        }
      }

      return locations.length > 0 ? locations : undefined;
    },
  });
}
