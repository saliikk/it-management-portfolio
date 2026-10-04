# Team Portfolio — with built-in editor

This version adds an **Edit website** button directly to the portfolio.

## What the editor can do

- Edit homepage text.
- Edit each member's name, role, photo path, bio, tasks, skills and takeaway.
- Edit shared assignment cards and social links.
- Save a draft in the current browser.
- Export updated `content.js` or a JSON backup.

## Important: browser draft vs published site

The editor is designed for a static GitHub Pages website. Clicking **Save changes** saves the draft in the current browser only. It does not update GitHub or other people's browsers.

To publish your changes for the whole team:
1. Open **Edit website** and make your changes.
2. Click **Export content.js**.
3. Replace the repository's existing `content.js` with the downloaded file.
4. Commit and push that change to GitHub.
5. GitHub Pages republishes the site, and everyone sees the shared update.

## Add a photo

Upload the image to the repository's `assets/` folder, then use the editor's **Photo path or image URL** field with a path such as `assets/salik-ahmad.jpg`. Export `content.js` and commit both the updated file and image.

## Preview and deploy

Open `index.html` locally or use VS Code Live Server. Upload the files and `assets/` folder to a GitHub repository, then enable GitHub Pages in **Settings → Pages → Deploy from a branch → main → /(root)**.

This is a static editor, not a multi-user CMS. Simultaneous live editing and one-click publishing require a backend or a CMS with authentication and write access to GitHub.
