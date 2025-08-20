# 🚀 Publishing to GitHub - Step by Step Guide

## Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository settings:
   - **Repository name**: `servicenow-rich-text-editor`
   - **Description**: `Chrome extension that replaces ServiceNow journal textareas with a rich text editor`
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

## Step 2: Push to GitHub
After creating the repo, GitHub will show you commands. Use these commands in your terminal:

```bash
# Add the GitHub repository as remote origin
git remote add origin https://github.com/YOUR_USERNAME/servicenow-rich-text-editor.git

# Push the code to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Create Codespace
1. Go to your new repository on GitHub
2. Click the green **"<> Code"** button
3. Select the **"Codespaces"** tab
4. Click **"Create codespace on main"**

## Repository is Ready!
Your local repository is now committed and ready to push to GitHub. The extension includes:

- ✅ Chrome MV3 manifest with proper permissions
- ✅ Rich text editor with full formatting support
- ✅ ServiceNow-specific [code] tag handling
- ✅ Natural contenteditable behavior (no more div-per-line issues)
- ✅ Proper event synchronization for Post button activation
- ✅ Sanitization for ServiceNow compatibility
- ✅ Complete documentation and setup instructions

## Quick Commands (after creating GitHub repo):
```bash
cd "c:\Users\myema\OneDrive\Work\Vibes\ServiceNow Note Code Renderer extension\sn-rte-extension"
git remote add origin https://github.com/YOUR_USERNAME/servicenow-rich-text-editor.git
git branch -M main  
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.
