const { app, BrowserWindow, ipcMain, dialog, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function ensureConfigDir() {
  const dir = path.dirname(getConfigPath());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readConfig() {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

function writeConfig(data) {
  try {
    ensureConfigDir();
    fs.writeFileSync(getConfigPath(), JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write config', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('select-media', async () => {
  if (!mainWindow) {
    return null;
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'メディアを選択',
    buttonLabel: '選択',
    properties: ['openFile'],
    filters: [
      {
        name: 'メディア',
        extensions: ['mp4', 'mov', 'm4v', 'mpg', 'mpeg', 'mp3', 'wav', 'jpg', 'jpeg', 'png', 'gif', 'bmp']
      }
    ]
  });

  if (result.canceled || !result.filePaths.length) {
    return null;
  }

  const filePath = result.filePaths[0];
  return buildMediaDescriptor(filePath);
});

ipcMain.handle('load-last-selection', async () => {
  const config = readConfig();
  if (!config.lastSelection || !config.lastSelection.path) {
    return null;
  }

  try {
    await fs.promises.access(config.lastSelection.path, fs.constants.R_OK);
    return config.lastSelection;
  } catch (error) {
    return null;
  }
});

ipcMain.handle('save-last-selection', async (_event, descriptor) => {
  if (!descriptor || !descriptor.path) {
    return false;
  }

  const config = readConfig();
  config.lastSelection = descriptor;
  writeConfig(config);
  return true;
});

function buildMediaDescriptor(filePath) {
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const name = path.basename(filePath);
  const type = ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext) ? 'image' : 'video';
  return {
    path: filePath,
    name,
    type
  };
}

ipcMain.handle('get-system-theme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});
