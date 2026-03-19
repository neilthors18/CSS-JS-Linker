/**
 * extension.ts
 *
 * Entry point of the CSS/JS Linker extension.
 * Registers the Hover and Definition providers for all supported HTML-like languages.
 */

import * as vscode from 'vscode';
import { registerHoverProvider } from './providers/hoverProvider';
import { registerDefinitionProvider } from './providers/definitionProvider';

export function activate(context: vscode.ExtensionContext): void {
  console.log('CSS/JS Linker is now active.');

  context.subscriptions.push(
    registerHoverProvider(),
    registerDefinitionProvider()
  );
}

export function deactivate(): void {
  // Nothing to clean up — subscriptions are disposed automatically.
}
