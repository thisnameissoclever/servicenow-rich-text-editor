# 🚀 Development Setup in Codespace

Welcome to the ServiceNow Rich Text Editor development environment!

## Quick Start

### 1. Load Extension in Chrome
```bash
# Open Chrome and navigate to:
chrome://extensions/

# Enable "Developer mode" (top right toggle)
# Click "Load unpacked" and select this project folder
```

### 2. Test on ServiceNow
- Navigate to any ServiceNow instance (e.g., `https://dev123456.service-now.com`)
- Go to a page with journal fields (Incidents, Change Requests, etc.)
- The journal textarea should automatically be replaced with the rich text editor

### 3. Local Testing (Optional)
```bash
# Open the included example files
# File → Open File → select Example1.html or Example2.html
```

## Project Structure
```
sn-rte-extension/
├── manifest.json          # Chrome extension manifest (MV3)
├── assets/                # Extension icons
├── src/
│   ├── content.js         # Main content script - detects and replaces textareas
│   ├── editor.js          # Rich text editor implementation
│   ├── sanitize.js        # HTML sanitization and [code] tag logic  
│   └── logger.js          # Logging utility
├── styles/
│   └── content.css        # Editor styling
└── README.md              # Full documentation
```

## Development Workflow

### Making Changes
1. Edit source files in `src/` or `styles/`
2. Go to `chrome://extensions/`
3. Click the reload button on your extension
4. Refresh the ServiceNow page to test changes

### Debugging
- Open Chrome DevTools (F12)
- Check Console for any `snjrte` log messages
- Use `localStorage.setItem('snjrte:logLevel', 'debug')` for verbose logging

### Key Features
- ✅ **Headers**: H1, H2, H3 buttons
- ✅ **Inline formatting**: Bold, italic, strikethrough, inline code
- ✅ **Links**: Auto-target="_blank" with security
- ✅ **Lists**: Bulleted and numbered lists with proper nesting
- ✅ **Block formats**: Blockquotes and code blocks
- ✅ **Clear formatting**: Remove all formatting from selection
- ✅ **ServiceNow integration**: Uses `[code]` tags when rich formatting detected

## Extension Testing Checklist

### Basic Functionality
- [ ] Extension loads without errors
- [ ] Journal textareas are replaced with rich editor
- [ ] Toolbar appears and all buttons work
- [ ] Text can be typed and formatted
- [ ] Post button enables when content is added

### Formatting Tests
- [ ] Headers toggle on/off correctly
- [ ] Bold/italic/strikethrough work
- [ ] Lists can be created and toggled
- [ ] Blockquotes and code blocks work
- [ ] Links open in new tab with security attributes
- [ ] Clear formatting removes all styling

### ServiceNow Integration
- [ ] `[code]` tags only appear when rich formatting is used
- [ ] Plain text entries don't get wrapped in `[code]`
- [ ] Post button activates properly
- [ ] Content syncs to underlying textarea

## Troubleshooting
- **Extension not loading**: Check for syntax errors in manifest.json
- **Editor not appearing**: Check browser console for JavaScript errors
- **Post button not enabling**: Verify textarea value is being updated and events are firing
- **Formatting not working**: Check that selection/caret detection is working properly

Happy coding! 🎉
