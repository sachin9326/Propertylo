# Automated CI/CD Watcher

This project is equipped with a "Save-to-Deploy" watcher that automatically commits and pushes your changes to GitHub whenever you save a file.

## How to use

1. Open your terminal in the project root.
2. Run the following command:
   ```bash
   npm run watch
   ```
3. Keep this terminal open. Every time you save a file in `frontend/src` or `backend`, the watcher will:
   - Detect the change.
   - Wait 3 seconds for any additional saves.
   - Automatically run `git add`, `git commit`, and `git push`.
   - Send a **Windows Desktop Notification** on success.
   - Log the activity in `deploy.log`.

## Customization

You can modify `watcher.js` to:
- Change the `DEBOUNCE_MS` (delay before pushing).
- Add or remove paths to watch in `WATCH_PATHS`.
- Exclude more files in `IGNORE_PATHS`.

## Prerequisites

- Your Git must be configured for passwordless push (SSH or Git Credential Manager).
- You must have the remote `origin` set up.
