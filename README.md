# ServiceNow Journal RTE (MV3)

Replace ServiceNow journal input textareas (Work notes, Additional comments, etc.) with a simple rich text editor that renders supported HTML and syncs back so the native Post button enables.

## Features
- Headers (h1/h2/h3), bold, italic, strikethrough
- Links open in a new tab
- Bulleted and ordered lists
- Blockquotes
- Inline `code` and multiline `pre`
- MutationObserver monitors dynamic DOM changes
- Syncs to underlying textarea and fires input/change events
- Outputs with [code]...[/code] only when rich formatting is used; otherwise posts plain text

## Load the extension
1. Build is not required. Open Chrome > Manage Extensions > Enable Developer mode.
2. Click "Load unpacked" and select this folder: `sn-rte-extension`.
3. Navigate to any ServiceNow instance URL (https://*.service-now.com/*).

Optional local testing with provided Examples:
- In chrome://extensions, enable "Allow access to file URLs" for this extension.
- Open the example files from `Examples/inner main page.html` or `Examples/outer nav page.html` in Chrome.

## Notes
- We rely on contenteditable and execCommand for broad compatibility.
- Sanitization is conservative to align with ServiceNow's allowed HTML.
- Logging can be controlled via localStorage key `snjrte:logLevel` with values: `debug|info|warn|error`.
 - If the textarea already contains `[code]...[/code]`, the editor renders the inner HTML; otherwise the initial value is treated as plain text.

## Dev tips
- Use the console to set logging: `localStorage.setItem('snjrte:logLevel','debug')`.
- Inspect the DOM to verify the hidden textarea updates on typing.
