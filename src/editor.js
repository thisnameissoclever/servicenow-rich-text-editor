/**
 * Minimal, dependency-free rich text editor with a built-in toolbar.
 * Uses contenteditable and document.execCommand for broad compatibility.
 * Syncs changes back to a hidden textarea, firing input/change eve  function toggleHeading(editorEl, level) {
    let blocks = filterToContentBlocks(editorEl, getSelectedBlocks(editorEl));
      if (blocks.length === 0) {
        // Create a block boundary and retry once to avoid operating on root
        document.execCommand('formatBlock', false, 'div');
        blocks = filterToContentBlocks(editorEl, getSelectedBlocks(editorEl));
        if (blocks.length === 0) return;
      }able the ServiceNow Post button.
 *
 * Contract:
 * - Input: existing HTMLTextAreaElement detected on the page
 * - Output: visible contentEditable editor that mirrors to the textarea's value as sanitized HTML
 * - Error modes: safe no-ops on unsupported commands; logs errors via logger utility
 */
(function () {
  const log = (...a) => window.snjrteLogger?.debug('[editor]', ...a);

  /**
   * @typedef {Object} EditorOptions
   * @property {string} placeholder
   * @property {(html: string) => void} onChange
   */

  /**
   * Create the toolbar element with buttons for all required features.
   * @param {HTMLElement} editor
   */
  function createToolbar(editor) {
    const toolbar = document.createElement('div');
    toolbar.className = 'snjrte-toolbar';

    const buttons = [
      { cmd: () => toggleHeading(editor, 'H1'), label: 'H1' },
      { cmd: () => toggleHeading(editor, 'H2'), label: 'H2' },
      { cmd: () => toggleHeading(editor, 'H3'), label: 'H3' },
      { cmd: () => document.execCommand('bold'), label: 'B' },
      { cmd: () => document.execCommand('italic'), label: 'I' },
      { cmd: () => document.execCommand('strikeThrough'), label: 'S' },
      { cmd: () => toggleLink(editor), label: 'Link' },
      { cmd: () => toggleList(editor, 'UL'), label: '• List' },
      { cmd: () => toggleList(editor, 'OL'), label: '1. List' },
      { cmd: () => toggleBlockQuote(editor), label: 'Quote' },
  { cmd: () => toggleInlineCode(), label: '`code`' },
  { cmd: () => togglePreBlock(editor), label: '</>' },
  { cmd: () => clearFormatting(editor), label: 'Clear' }
    ];

    for (const b of buttons) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = b.label;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        b.cmd();
        editor.focus();
        // After command, force sync
        const evt = new Event('input', { bubbles: true });
        editor.dispatchEvent(evt);
      });
      toolbar.appendChild(btn);
    }

    return toolbar;
  }

  /** Insert or toggle a link; if in an anchor, unlink; else create and force target=_blank.
   * @param {HTMLElement} editor
   */
  function toggleLink(editor) {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const insideA = selection.anchorNode && closest(selection.anchorNode, 'a');
    if (insideA) {
      document.execCommand('unlink');
      return;
    }
    const url = prompt('Enter URL (https://...)');
    if (!url) return;
    document.execCommand('createLink', false, url);
    // Post-fix target and rel
    const anchor = editor.querySelector('a[href="' + CSS.escape(url) + '"]');
    if (anchor) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    }
  }

  /** Toggle inline code for selection using <code>.
   * Wraps selection in <code> or unwraps if already within <code>.
   */
  function toggleInlineCode() {
    // execCommand doesn't have code; wrap selection
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const parent = range.commonAncestorContainer.parentElement;
    if (parent && parent.closest('code')) {
      // unwrap
      const codeEl = parent.closest('code');
      if (!codeEl) return;
      const text = document.createTextNode(codeEl.textContent || '');
      codeEl.replaceWith(text);
      sel.removeAllRanges();
    } else {
      const span = document.createElement('code');
      span.textContent = sel.toString();
      range.deleteContents();
      range.insertNode(span);
      sel.removeAllRanges();
    }
  }

  /** Insert a PRE block for multiline code. */
  function insertPreBlock() {
    document.execCommand('formatBlock', false, 'pre');
  }

  /**
   * Whether an element tag is considered block-level for our editor.
   * @param {Element} el
   */
  function isBlockEl(el) {
    const tn = el.tagName;
    return (
      tn === 'DIV' || tn === 'P' || tn === 'UL' || tn === 'OL' || tn === 'LI' ||
      tn === 'PRE' || tn === 'BLOCKQUOTE' || tn === 'H1' || tn === 'H2' || tn === 'H3'
    );
  }

  /**
   * Minimal normalization: only wrap direct text children or non-block elements
   * that contain actual content (not just whitespace). Preserve natural <br> flow.
   * @param {HTMLElement} root
   */
  function normalizeEditorBlocks(root) {
    const nodes = Array.from(root.childNodes);
    nodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const text = n.textContent || '';
        // Only wrap if there's meaningful text content
        if (text.trim().length > 0) {
          const div = document.createElement('div');
          div.textContent = text;
          root.replaceChild(div, n);
        }
        return;
      }
      if (n.nodeType === Node.ELEMENT_NODE) {
        const el = /** @type {Element} */ (n);
        // Don't wrap if it's already a block element or just a <br>
        if (!isBlockEl(el) && el.tagName !== 'BR') {
          const div = document.createElement('div');
          div.appendChild(el.cloneNode(true));
          root.replaceChild(div, el);
        }
      }
    });
  }

  /**
   * Collect selected block elements within editor. Works with natural contenteditable structure.
   * For a collapsed selection, returns the single containing block (if any).
   * @param {HTMLElement} editorEl
   * @returns {HTMLElement[]}
   */
  function getSelectedBlocks(editorEl) {
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return [];
    const range = sel.getRangeAt(0);
    
    if (sel.isCollapsed) {
      const block = getContainingBlockEl(sel.anchorNode, editorEl);
      return block && block !== editorEl ? [block] : [];
    }
    
    // For selections, find all block elements that intersect the range
    const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_ELEMENT, null);
    /** @type {HTMLElement[]} */
    const result = [];
    while (walker.nextNode()) {
      const el = /** @type {HTMLElement} */ (walker.currentNode);
      if (!isBlockEl(el)) continue;
      if (rangeIntersectsElement(range, el)) {
        // skip if an ancestor is already included
        if (!result.some((p) => p.contains(el))) result.push(el);
      }
    }
    return result;
  }

  /**
   * Group contiguous sibling blocks to apply list or quote over a run.
   * @param {HTMLElement[]} blocks
   * @returns {HTMLElement[][]}
   */
  function groupContiguous(blocks) {
    if (blocks.length === 0) return [];
    const groups = [];
    let group = [blocks[0]];
    for (let i = 1; i < blocks.length; i++) {
      const prev = blocks[i - 1];
      const cur = blocks[i];
      if (prev.parentElement === cur.parentElement && prev.nextElementSibling === cur) {
        group.push(cur);
      } else {
        groups.push(group);
        group = [cur];
      }
    }
    groups.push(group);
    return groups;
  }

  /**
   * Filter a block list down to elements that are true content blocks within the editor root.
   * Ensures we never operate on the editor root itself or on nodes outside the editor.
   * @param {HTMLElement} editorEl
   * @param {HTMLElement[]} blocks
   * @returns {HTMLElement[]}
   */
  function filterToContentBlocks(editorEl, blocks) {
    return blocks.filter((el) => el && el !== editorEl && editorEl.contains(el));
  }

  /**
   * Toggle heading level for selected blocks. Demotes to paragraph when already that heading.
   * @param {HTMLElement} editorEl
   * @param {'H1'|'H2'|'H3'} level
   */
  /**
   * Toggle heading level for selected content. Uses formatBlock for natural contenteditable behavior.
   * @param {HTMLElement} editorEl
   * @param {'H1'|'H2'|'H3'} level
   */
  function toggleHeading(editorEl, level) {
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    // Check if we're currently in a heading of this level
    const currentHeading = closest(sel.anchorNode, level.toLowerCase());
    if (currentHeading && editorEl.contains(currentHeading)) {
      // Toggle off - convert back to paragraph
      document.execCommand('formatBlock', false, 'p');
    } else {
      // Toggle on - convert to heading
      document.execCommand('formatBlock', false, level.toLowerCase());
    }
  }

  /**
   * Toggle list for selected content. Uses native commands when possible.
   * @param {HTMLElement} editorEl  
   * @param {'UL'|'OL'} type
   */
  function toggleList(editorEl, type) {
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    // Check if we're currently in a list of this type
    const currentLI = closest(sel.anchorNode, 'li');
    const currentList = currentLI ? currentLI.parentElement : null;
    
    if (currentList && currentList.tagName === type) {
      // We're in the right type of list - toggle off
      document.execCommand('outdent');
    } else if (currentLI && currentList && currentList.tagName !== type) {
      // We're in a different type of list - change list type
      const command = type === 'UL' ? 'insertUnorderedList' : 'insertOrderedList';
      document.execCommand(command);
    } else {
      // Not in any list - create one
      const command = type === 'UL' ? 'insertUnorderedList' : 'insertOrderedList';
      document.execCommand(command);
    }
  }

  /**
   * Find the nearest containing block element within the editor for a node.
   * If no block element exists, returns the editor root for operations that need a block target.
   * @param {Node|null} node
   * @param {HTMLElement} root
   * @returns {HTMLElement|null}
   */
  function getContainingBlockEl(node, root) {
    if (!node) return null;
    // First try to find an actual block-level element
    const selector = 'p,div,li,pre,blockquote,h1,h2,h3,ul,ol';
    const el = closest(node, selector);
    if (el && root.contains(el) && el !== root) return /** @type {HTMLElement} */ (el);
    
    // If we're directly in the editor root with no block wrapper, 
    // we can still operate but need to be careful
    if (root.contains(node instanceof Element ? node : node?.parentElement || root)) {
      return root;
    }
    return null;
  }

  /**
   * Get closest ancestor matching selector from a Node.
   * @param {Node|null} node
   * @param {string} selector
   * @returns {Element|null}
   */
  function closest(node, selector) {
    let el = node instanceof Element ? node : node?.parentElement || null;
    while (el) {
      if (el.matches(selector)) return el;
      el = el.parentElement;
    }
    return null;
  }

  /**
   * Check if a Range intersects an element's box.
   * @param {Range} range
   * @param {Element} el
   */
  function rangeIntersectsElement(range, el) {
    const r = document.createRange();
    r.selectNode(el);
    return !(
      range.compareBoundaryPoints(Range.END_TO_START, r) <= 0 ||
      range.compareBoundaryPoints(Range.START_TO_END, r) >= 0
    );
  }

  /** Unwrap an element: replace it with its children. */
  function unwrap(el) {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  }

  /**
   * Toggle blockquote for current selection. Uses formatBlock for natural behavior.
   */
  function toggleBlockQuote(editorEl) {
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    // Check if we're currently in a blockquote
    const currentBQ = closest(sel.anchorNode, 'blockquote');
    if (currentBQ && editorEl.contains(currentBQ)) {
      // We're in a blockquote - remove it by converting to paragraph
      document.execCommand('formatBlock', false, 'p');
    } else {
      // Not in a blockquote - create one
      document.execCommand('formatBlock', false, 'blockquote');
    }
  }

  /**
   * Toggle PRE block for current selection or block.
   * Collapsed selection toggles the containing block.
   */
  function togglePreBlock(editorEl) {
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const startPre = closest(sel.anchorNode, 'pre');
    const endPre = closest(sel.focusNode, 'pre');

    const unwrapPre = (preEl) => {
      // Convert preformatted text to safe HTML with <br> for newlines
      const text = preEl.textContent || '';
      const div = document.createElement('div');
      div.innerHTML = (text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')) || '<br>';
      preEl.replaceWith(div);
    };

    if (startPre && startPre === endPre) {
      unwrapPre(startPre);
      return;
    }

    if (sel.isCollapsed) {
      // Toggle the current line/block
      let block = getContainingBlockEl(sel.anchorNode, editorEl);
      if (!block || block === editorEl) {
        document.execCommand('formatBlock', false, 'div');
        block = getContainingBlockEl(sel.anchorNode, editorEl);
      }
      if (block && block !== editorEl) {
        // Special case for list item similar to blockquote
        if (block.tagName === 'LI') {
          const list = block.parentElement;
          if (list && (list.tagName === 'UL' || list.tagName === 'OL')) {
            const pre = document.createElement('pre');
            pre.textContent = block.textContent || '';
            list.replaceChild(pre, block);
            sel.removeAllRanges();
            const r = document.createRange();
            r.selectNodeContents(pre);
            r.collapse(false);
            sel.addRange(r);
            return;
          }
        }
        const pre = document.createElement('pre');
        pre.textContent = block.textContent || '';
        block.replaceWith(pre);
        sel.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(pre);
        newRange.collapse(false);
        sel.addRange(newRange);
        return;
      }
      document.execCommand('formatBlock', false, 'pre');
      return;
    }

    let didUnwrap = false;
  editorEl.querySelectorAll('pre').forEach((pre) => {
      if (rangeIntersectsElement(range, pre)) {
        unwrapPre(pre);
        didUnwrap = true;
      }
    });
    if (didUnwrap) return;

    // Wrap selection into <pre><code> if multiple lines; else <pre>
    const extracted = range.extractContents();
    const pre = document.createElement('pre');
    // Preserve selection’s current HTML as text inside pre
    const container = document.createElement('div');
    container.appendChild(extracted);
    const raw = container.textContent || container.innerText || '';
    pre.textContent = raw;
    range.insertNode(pre);

    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(pre);
    newRange.collapse(false);
    sel.addRange(newRange);
  }

  /**
   * Clear both block and inline formatting from the current selection or caret line.
   * Block-level: H1/H2/H3, blockquote, pre, UL/OL/LI -> converted to simple DIV blocks.
   * Inline: strong/b/em/i/strike/s/code/a -> unwrapped while preserving text and children.
   * @param {HTMLElement} editorEl
   */
  /**
   * Clear formatting from the current selection using native commands.
   * @param {HTMLElement} editorEl
   */
  function clearFormatting(editorEl) {
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    // Remove block formatting first
    document.execCommand('formatBlock', false, 'div');
    
    // Then remove inline formatting
    document.execCommand('removeFormat');
    
    // Remove any links
    document.execCommand('unlink');
  }

  /**
   * Remove inline formatting tags inside the given root by unwrapping elements.
   * @param {HTMLElement} root
   */
  function stripInlineFormatting(root) {
    const inlineSel = 'strong,b,em,i,strike,s,code,a';
    // Use a static list as we will modify the DOM while iterating
    const els = Array.from(root.querySelectorAll(inlineSel));
    els.forEach((el) => unwrap(el));
  }

  /**
   * Initialize editor UI wrapping a textarea.
   * @param {HTMLTextAreaElement} textarea
   * @param {EditorOptions} options
   */
  function attachEditor(textarea, options) {
    const wrapper = document.createElement('div');
    wrapper.className = 'snjrte-wrapper';

  const editor = document.createElement('div');
    editor.className = 'snjrte-editor';
    editor.contentEditable = 'true';
    editor.dataset.placeholder = textarea.getAttribute('placeholder') || options.placeholder || '';

  // Create toolbar bound to the actual editor element
  const toolbar = createToolbar(editor);

    // Seed initial content from textarea, sanitized
    const initial = textarea.value || '';
    const codeMatch = initial.match(/^\s*\[code\]([\s\S]*?)\[\/code\]\s*$/i);
    let safe = '';
    if (codeMatch) {
      // Editor should render the embedded HTML inside [code]
      safe = window.snjrteSanitize?.sanitizeHtml(codeMatch[1]) || codeMatch[1];
    } else {
      // Treat as plain text (escape)
      const div = document.createElement('div');
      div.textContent = initial;
      safe = div.innerHTML.replace(/\n/g, '<br>');
    }
    editor.innerHTML = safe || '<br>';
    updateEmptyState();

    function updateEmptyState() {
      const isEmpty = editor.textContent?.trim().length === 0;
      editor.classList.toggle('is-empty', !!isEmpty);
    }

    // Sync editor -> textarea
    const syncToTextarea = () => {
      const computed = window.snjrteSanitize?.toJournalValue(editor);
      const html = computed !== undefined ? computed : editor.innerHTML;
      // Prefer native setter so frameworks observe the change
      const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
      if (proto && typeof proto.set === 'function') {
        proto.set.call(textarea, html);
      } else {
        textarea.value = html;
      }
      // Fire input + change for frameworks and SN logic
      textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    };

    editor.addEventListener('input', () => {
      updateEmptyState();
      syncToTextarea();
    });

    editor.addEventListener('blur', () => {
      syncToTextarea();
    });

    // Sanitize pasted content
    editor.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text/plain') || '';
      const html = e.clipboardData?.getData('text/html');
      let toInsert = '';
      if (html && html.trim()) {
        toInsert = window.snjrteSanitize?.sanitizeHtml(html || '') || '';
      } else if (text) {
        // Escape and convert newlines to <br>
        const esc = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        toInsert = esc.replace(/\r?\n/g, '<br>');
      }
      document.execCommand('insertHTML', false, toInsert);
      updateEmptyState();
      syncToTextarea();
    });

    // Ensure Enter creates a new block rather than only <br>
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Shift+Enter => soft line break; Enter => paragraph
        if (e.shiftKey) {
          document.execCommand('insertLineBreak');
          document.execCommand('insertHTML', false, '<br>');
        } else {
          const ok = document.execCommand('insertParagraph');
          if (!ok) {
            document.execCommand('insertHTML', false, '<div><br></div>');
          }
        }
        updateEmptyState();
        syncToTextarea();
      }
    });

    // Hide placeholder on focus and avoid inserting visible markup
    editor.addEventListener('focus', () => {
      // No-op: allow caret in empty contenteditable; modern browsers handle it.
    });

    // Hide original textarea but keep it in DOM
    textarea.classList.add('snjrte-hidden');
    textarea.setAttribute('aria-hidden', 'true');

  // Insert UI
    textarea.parentElement?.insertBefore(wrapper, textarea);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(editor);

    log('Editor attached to', textarea.id || textarea.name || textarea);

    return { wrapper, editor, toolbar };
  }

  window.snjrteEditor = { attachEditor };
})();
