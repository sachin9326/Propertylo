const chokidar = require('chokidar');
const { exec } = require('child_process');
const notifier = require('node-notifier');
const path = require('path');
const fs = require('fs');

// Configuration
const WATCH_PATHS = [
  'frontend/src',
  'backend',
  'package.json',
  'index.html'
];
const IGNORE_PATHS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'package-lock.json',
  'deploy.log',
  'dev.db',
  '*.log'
];
const DEBOUNCE_MS = 3000; // 3 seconds quiet period before push
const LOG_FILE = path.join(__dirname, 'deploy.log');

let timeoutId = null;
let changedFiles = new Set();

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(LOG_FILE, logMessage);
}

function notify(title, message, isError = false) {
  notifier.notify({
    title: title,
    message: message,
    sound: true,
    wait: false
  });
}

function runGitSync() {
  const filesList = Array.from(changedFiles).join(', ');
  const commitMessage = `Auto-update: modified ${filesList} [${new Date().toLocaleTimeString()}]`;
  
  log(`Starting sync for: ${filesList}...`);
  
  const command = `git add -A && git commit -m "${commitMessage}" && git push origin main`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      log(`Git Error: ${error.message}`);
      notify('Deployment Failed', `Error: ${error.message}`, true);
      return;
    }
    
    log(`Sync Successful!\nSTDOUT: ${stdout}`);
    notify('Deployment Successful', `Pushed changes: ${filesList}`);
    changedFiles.clear();
  });
}

// Initialize Watcher
const watcher = chokidar.watch(WATCH_PATHS, {
  ignored: IGNORE_PATHS,
  persistent: true,
  ignoreInitial: true
});

log('🚀 CI/CD Watcher started. Waiting for changes...');

watcher.on('all', (event, filePath) => {
  const relativePath = path.relative(__dirname, filePath);
  log(`Change detected: [${event}] ${relativePath}`);
  changedFiles.add(relativePath);

  // Debounce the push
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    runGitSync();
  }, DEBOUNCE_MS);
});
