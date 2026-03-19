/**
 * pathResolver.ts
 *
 * Converts raw paths extracted from HTML into absolute vscode.Uri objects.
 *
 * Resolution strategy:
 *  1. If the path looks like a Django {% static %} reference (no leading . or /),
 *     search for the filename recursively in 'static/', 'staticfiles/', 'assets/'
 *     directories within the workspace, then fall back to a global workspace search.
 *  2. If the path is relative (starts with ./ or ../), resolve it from the
 *     directory of the active document.
 *  3. If the path is absolute from root (starts with /), resolve it from the
 *     workspace root.
 *  4. Otherwise, treat as relative from the document's directory.
 */

import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Given a raw path string and the URI of the active document, returns the
 * best-matching absolute URI, or `undefined` if it cannot be resolved.
 */
export async function resolvePath(
  rawPath: string,
  documentUri: vscode.Uri
): Promise<vscode.Uri | undefined> {
  const documentDir = path.dirname(documentUri.fsPath);

  // --- Strategy 1: Absolute from root (starts with /) ---
  if (rawPath.startsWith('/')) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri);
    if (workspaceFolder) {
      const resolved = vscode.Uri.file(
        path.join(workspaceFolder.uri.fsPath, rawPath)
      );
      if (await fileExists(resolved)) {
        return resolved;
      }
    }
    return undefined;
  }

  // --- Strategy 2: Relative path (starts with . or contains path separators) ---
  if (rawPath.startsWith('.') || rawPath.startsWith('..')) {
    const resolved = vscode.Uri.file(path.join(documentDir, rawPath));
    if (await fileExists(resolved)) {
      return resolved;
    }
    return undefined;
  }

  // --- Strategy 3: Try relative from document directory first (handles simple cases) ---
  const relativeFromDoc = vscode.Uri.file(path.join(documentDir, rawPath));
  if (await fileExists(relativeFromDoc)) {
    return relativeFromDoc;
  }

  // --- Strategy 4: Django-style or ambiguous path ---
  // Search in preferred static directories first, then workspace-wide
  const filename = path.basename(rawPath);
  const preferredDirs = ['static', 'staticfiles', 'assets'];
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri)
    ?? vscode.workspace.workspaceFolders?.[0];

  if (workspaceFolder) {
    // Try preferred directories first
    for (const dir of preferredDirs) {
      const candidates = await vscode.workspace.findFiles(
        new vscode.RelativePattern(workspaceFolder, `${dir}/**/${filename}`),
        '**/node_modules/**',
        5
      );
      if (candidates.length > 0) {
        return candidates[0];
      }
    }

    // Fall back to global workspace search (limited to avoid performance issues)
    const globalCandidates = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceFolder, `**/${filename}`),
      '**/node_modules/**',
      5
    );
    if (globalCandidates.length > 0) {
      return globalCandidates[0];
    }
  }

  return undefined;
}

/**
 * Resolves an array of raw paths into absolute URIs, silently skipping
 * any that cannot be resolved or read.
 */
export async function resolvePaths(
  rawPaths: string[],
  documentUri: vscode.Uri
): Promise<vscode.Uri[]> {
  const results: vscode.Uri[] = [];
  for (const rawPath of rawPaths) {
    const resolved = await resolvePath(rawPath, documentUri);
    if (resolved) {
      results.push(resolved);
    }
  }
  return results;
}

async function fileExists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}
