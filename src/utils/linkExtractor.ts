/**
 * linkExtractor.ts
 *
 * Parses the raw text of an HTML document and returns the raw (unresolved)
 * paths of all linked CSS stylesheets and JavaScript files.
 *
 * Handles:
 *  - Standard <link rel="stylesheet" href="...">
 *  - Standard <script src="...">
 *  - Django {% static '...' %} inside href/src attributes
 */

export interface LinkedFiles {
  css: string[];
  js: string[];
}

// Matches href="..." or href='...' possibly preceded by {% static '...' %}
// Groups: [1] = raw path or django static path
const CSS_LINK_RE =
  /<link[^>]+rel=["']stylesheet["'][^>]*href=["'](?:{%\s*static\s*["'])?([^"'%\s]+)["']?(?:\s*%})?["']?[^>]*>/gi;

// Also catch href-first variants: <link href="..." rel="stylesheet">
const CSS_LINK_HREF_FIRST_RE =
  /<link[^>]+href=["'](?:{%\s*static\s*["'])?([^"'%\s]+)["']?(?:\s*%})?["']?[^>]+rel=["']stylesheet["'][^>]*>/gi;

// Matches <script src="..."> or <script src="{% static '...' %}">
const JS_SCRIPT_RE =
  /<script[^>]+src=["'](?:{%\s*static\s*["'])?([^"'%\s]+)["']?(?:\s*%})?["']?[^>]*>/gi;

function extractMatches(text: string, regex: RegExp): string[] {
  const results: string[] = [];
  let match: RegExpExecArray | null;
  regex.lastIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    const path = match[1]?.trim();
    if (path) {
      results.push(path);
    }
  }
  return results;
}

/**
 * Given the full text content of an HTML document, returns all raw paths
 * found in <link rel="stylesheet"> and <script src=""> tags.
 * Paths may be relative, absolute, or Django static references.
 */
export function extractLinkedFiles(documentText: string): LinkedFiles {
  const css = [
    ...extractMatches(documentText, CSS_LINK_RE),
    ...extractMatches(documentText, CSS_LINK_HREF_FIRST_RE),
  ];
  const js = extractMatches(documentText, JS_SCRIPT_RE);

  // Deduplicate
  return {
    css: [...new Set(css)],
    js: [...new Set(js)],
  };
}
