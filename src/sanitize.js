/**
 * Sanitization utilities to ensure only ServiceNow-supported markup is produced.
 * We enforce a conservative whitelist inspired by SN Zurich HTML sanitizer documentation.
 *
 * Allowed tags: h1,h2,h3,strong,em,strike,a,ul,ol,li,blockquote,code,pre,br,p,div
 * Allowed attributes: href (on a) and we force target=_blank and rel to security values.
 * All other attributes are removed.
 */
(function () {
  const ALLOWED_TAGS = new Set([
    'H1', 'H2', 'H3', 'STRONG', 'EM', 'STRIKE', 'A', 'UL', 'OL', 'LI',
    'BLOCKQUOTE', 'CODE', 'PRE', 'BR', 'P', 'DIV'
  ]);

  // Tags that constitute "rich" formatting vs. basic paragraph/line breaks
  const RICH_TAGS = new Set([
    'H1', 'H2', 'H3', 'STRONG', 'EM', 'STRIKE', 'A', 'UL', 'OL', 'LI',
    'BLOCKQUOTE', 'CODE', 'PRE'
  ]);

  /**
   * Remove disallowed nodes recursively and purge disallowed attributes.
   * @param {HTMLElement|DocumentFragment} root
   */
  function removeDisallowedNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);
    /** @type {Element[]} */
    const toRemove = [];
    while (walker.nextNode()) {
      const el = /** @type {Element} */ (walker.currentNode);
      if (!ALLOWED_TAGS.has(el.tagName)) {
        toRemove.push(el);
      } else {
        // Clean attributes
        [...el.attributes].forEach(attr => {
          const n = attr.name.toLowerCase();
          if (el.tagName === 'A') {
            if (n === 'href') return; // keep href; fix later
            // remove all other attributes on anchor
            return el.removeAttribute(attr.name);
          }
          // Strip all attributes from other elements
          el.removeAttribute(attr.name);
        });
        if (el.tagName === 'A') {
          let href = el.getAttribute('href') || '#';
          // Prevent javascript: and data: except data:image limited (conservative)
          const lower = href.trim().toLowerCase();
          if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
            href = '#';
          }
          el.setAttribute('href', href);
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener noreferrer');
        }
      }
    }
    toRemove.forEach(n => n.replaceWith(document.createTextNode(n.textContent || '')));
  }

  /**
   * Sanitize arbitrary HTML string to our whitelist. Returns a safe string.
   * @param {string} html
   * @returns {string}
   */
  function sanitizeHtml(html) {
    try {
      const template = document.createElement('template');
      template.innerHTML = html;
      removeDisallowedNodes(template.content);
      return template.innerHTML;
    } catch (e) {
      window.snjrteLogger?.warn('sanitizeHtml error, returning plain text', e);
      const div = document.createElement('div');
      div.textContent = html;
      return div.innerHTML;
    }
  }

  /**
   * Convert the editor DOM to a ServiceNow-friendly HTML string, ensuring block/code semantics.
   * @param {HTMLElement} editor
   * @returns {string}
   */
  function serializeEditor(editor) {
    // Normalize block-level DIVs to paragraphs to keep things tidy for SN rendering
  let html = editor.innerHTML
      .replace(/<div><br\s*\/?><\/div>/gi, '<br>')
      .replace(/<div>([\s\S]*?)<\/div>/gi, '<p>$1</p>');
  // If editor is effectively empty, return empty string
  const textOnly = editor.textContent?.trim() || '';
  if (textOnly.length === 0) return '';
    return sanitizeHtml(html);
  }

  /**
   * Determine if sanitized HTML contains rich markup (beyond P/BR/DIV).
   * @param {string} sanitizedHtml
   * @returns {boolean}
   */
  function hasRichMarkup(sanitizedHtml) {
    const tpl = document.createElement('template');
    tpl.innerHTML = sanitizedHtml;
    const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_ELEMENT, null);
    while (walker.nextNode()) {
      const el = /** @type {Element} */ (walker.currentNode);
      if (RICH_TAGS.has(el.tagName)) return true;
    }
    return false;
  }

  /**
   * Convert sanitized HTML to plain text, preserving line breaks.
   * @param {string} sanitizedHtml
   * @returns {string}
   */
  function htmlToPlainText(sanitizedHtml) {
    const tpl = document.createElement('template');
    // Normalize <p> to newline boundaries so textContent preserves intended breaks
    const normalized = sanitizedHtml
      .replace(/\s*<br\s*\/?\s*>/gi, '\n')
      .replace(/\s*<p>\s*/gi, '')
      .replace(/\s*<\/p>\s*/gi, '\n\n');
    tpl.innerHTML = normalized;
    const text = tpl.content.textContent || '';
    // Collapse excessive newlines at ends
    return text.replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
  }

  /**
   * Build the final journal value from the editor, wrapping with [code] only
   * if rich formatting is present; otherwise return plain text.
   * @param {HTMLElement} editor
   * @returns {string}
   */
  function toJournalValue(editor) {
    const sanitized = serializeEditor(editor);
    if (!sanitized || sanitized.trim() === '' || sanitized.trim() === '<br>') {
      return '';
    }
    if (hasRichMarkup(sanitized)) {
      return `[code]${sanitized}[/code]`;
    }
    return htmlToPlainText(sanitized);
  }

  window.snjrteSanitize = { sanitizeHtml, serializeEditor, toJournalValue, htmlToPlainText };
})();
