/**
 * hoverProvider.ts
 *
 * Provides hover information (Ctrl + hover) for class names and IDs in HTML.
 * Shows how many occurrences of the token exist in the linked CSS and JS files.
 */

import * as vscode from 'vscode';
import { extractLinkedFiles } from '../utils/linkExtractor';
import { resolvePaths } from '../utils/pathResolver';
import { countOccurrences } from '../utils/searcher';
import { detectToken } from '../utils/tokenDetector';
import { readFileText } from './definitionProvider';

const SUPPORTED_LANGUAGES = [
  'html',
  'django-html',
  'php',
  'jinja',
  'jinja2',
];

export function registerHoverProvider(): vscode.Disposable {
  return vscode.languages.registerHoverProvider(SUPPORTED_LANGUAGES, {
    async provideHover(
      document: vscode.TextDocument,
      position: vscode.Position
    ): Promise<vscode.Hover | undefined> {
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

      // Count occurrences in all CSS files
      let cssCount = 0;
      for (const uri of cssUris) {
        const text = await readFileText(uri);
        if (text !== undefined) {
          cssCount += countOccurrences(text, token, kind, 'css');
        }
      }

      // Count occurrences in all JS files
      let jsCount = 0;
      for (const uri of jsUris) {
        const text = await readFileText(uri);
        if (text !== undefined) {
          jsCount += countOccurrences(text, token, kind, 'js');
        }
      }

      if (cssCount === 0 && jsCount === 0) {
        return undefined;
      }

      // Build markdown content
      const kindLabel = kind === 'class' ? `\`.${token}\`` : `\`#${token}\``;

      const countLines: string[] = [];
      if (cssCount > 0) {
        countLines.push(`📄 **CSS:** ${cssCount} ${cssCount === 1 ? 'ocurrencia' : 'ocurrencias'}`);
      }
      if (jsCount > 0) {
        countLines.push(`📜 **JS:** ${jsCount} ${jsCount === 1 ? 'ocurrencia' : 'ocurrencias'}`);
      }

      // \n\n forces each count onto its own line in Markdown (single \n collapses into same paragraph)
      const markdown = new vscode.MarkdownString(
        `**CSS/JS Linker** — ${kindLabel}\n\n${countLines.join('\n\n')}`
      );
      markdown.isTrusted = true;

      return new vscode.Hover(markdown);
    },
  });
}
