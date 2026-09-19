const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, nativeImage } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let isQuitting = false;
let authServer = null;
let staticServer = null;
let staticPort = null;
const AUTH_PORT = 23456;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://iraq-esports-hub.pages.dev';

// Register protocol for deep linking: ieh://
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('ieh', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('ieh');
}

function handleDeepLinkUrl(url) {
  if (!url || typeof url !== 'string') return;
  if (url.startsWith('ieh://')) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('desktop-deep-link', url);
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  }
}

function startAuthServer() {
  if (authServer) return;
  try {
    authServer = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Allow-Private-Network', 'true');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.method === 'POST' && req.url === '/auth-token') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const tokenData = JSON.parse(body);
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('desktop-auth-success', tokenData);
              if (mainWindow.isMinimized()) mainWindow.restore();
              mainWindow.show();
              mainWindow.focus();
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end();
    });

    authServer.listen(AUTH_PORT, '127.0.0.1', () => {
      console.log(`[Electron Auth] Local loopback listening on http://127.0.0.1:${AUTH_PORT}`);
    });

    authServer.on('error', (err) => {
      console.warn('[Electron Auth] Loopback notice:', err.message);
    });
  } catch (err) {
    console.warn('[Electron Auth] Start server notice:', err);
  }
}

function startStaticServer() {
  if (staticPort) return Promise.resolve(staticPort);
  return new Promise((resolve) => {
    const distPath = path.join(__dirname, '../dist');
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff2': 'font/woff2',
      '.woff': 'font/woff',
      '.ttf': 'font/ttf',
    };

    staticServer = http.createServer((req, res) => {
      let reqPath = decodeURIComponent(req.url.split('?')[0]);
      if (reqPath === '/' || !reqPath) reqPath = '/index.html';
      let filePath = path.join(distPath, reqPath);

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          filePath = path.join(distPath, 'index.html');
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
      });
    });

    staticServer.listen(0, '127.0.0.1', () => {
      staticPort = staticServer.address().port;
      resolve(staticPort);
    });
  });
}

function createTray() {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="6" fill="#000000"/>
      <polygon points="16,6 26,24 6,24" fill="#ffffff"/>
      <polygon points="16,11 22,22 10,22" fill="#000000"/>
    </svg>
  `;
  const iconBuffer = Buffer.from(svgIcon);
  const icon = nativeImage.createFromBuffer(iconBuffer).resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip('Iraq Esports Hub (IEH)');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'فتح Iraq Esports Hub',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'الحالة: نشط للمباريات والسكريمات',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'إغلاق التطبيق نهائياً (Quit)',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1040,
    minHeight: 700,
    frame: false,
    thickFrame: true,
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
  });

  mainWindow.setContentProtection(false);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
    mainWindow.loadURL(devUrl);
  } else {
    // Production: Load live production host for instant Closed Beta updates,
    // with automatic local bundle fallback if offline or unreachable!
    let hasLoaded = false;

    const loadLocalFallback = () => {
      if (hasLoaded) return;
      hasLoaded = true;
      console.log('[Electron] Loading local bundled server...');
      startStaticServer().then((port) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(`http://127.0.0.1:${port}`);
        }
      });
    };

    mainWindow.loadURL(PRODUCTION_URL).then(() => {
      hasLoaded = true;
    }).catch((err) => {
      console.warn('[Electron] Remote host unreachable, using local fallback:', err?.message || err);
      loadLocalFallback();
    });

    // Fallback if network drops or fails on initial load
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      if (!hasLoaded && validatedURL.startsWith(PRODUCTION_URL)) {
        console.warn(`[Electron] Remote load failed (${errorCode}: ${errorDescription}), falling back.`);
        loadLocalFallback();
      }
    });
  }

  mainWindow.on('close', () => {
    // Clean close when terminated by installer, OS or quit
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-state-changed', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-state-changed', false);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow internal app routes and callbacks
    if (url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost') || url.startsWith(PRODUCTION_URL)) {
      return { action: 'allow' };
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

// IPC Window Controls
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) {
    mainWindow.hide();
    if (Notification.isSupported()) {
      new Notification({
        title: 'Iraq Esports Hub',
        body: 'التطبيق يعمل في الخلفية لتلقي تحديات السكريمات والرسائل.',
        silent: true,
      }).show();
    }
  }
});

ipcMain.handle('is-window-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.on('show-notification', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

ipcMain.on('open-external', (_event, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    require('electron').shell.openExternal(url);
  }
});

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
    const deepLink = commandLine && commandLine.find(arg => arg.startsWith('ieh://'));
    if (deepLink) {
      handleDeepLinkUrl(deepLink);
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();
    startAuthServer();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLinkUrl(url);
});

app.on('before-quit', () => {
  isQuitting = true;
  if (authServer) {
    authServer.close();
  }
  if (staticServer) {
    staticServer.close();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
