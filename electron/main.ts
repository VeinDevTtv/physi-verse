import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import net from 'net';

const isDev = process.env.NODE_ENV !== 'production';
const DEFAULT_PORT = Number(process.env.PORT || 3000);

let mainWindow: BrowserWindow | null = null;
let nextProdServerProcess: ChildProcess | null = null;

function getStandaloneServerEntry(): string | null {
  const appRoot = app.getAppPath();
  const candidates = [
    path.join(appRoot, '.next', 'standalone', 'server.js'),
    path.join(appRoot, '.next', 'standalone', 'server', 'index.js'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

async function waitForPort(port: number, host = '127.0.0.1', timeoutMs = 20000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const canConnect = await new Promise<boolean>((resolve) => {
      const socket = net.createConnection({ port, host }, () => {
        socket.end();
        resolve(true);
      });
      socket.on('error', () => resolve(false));
      socket.setTimeout(1000, () => {
        socket.destroy();
        resolve(false);
      });
    });
    if (canConnect) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Timed out waiting for ${host}:${port}`);
}

async function ensureNextServerStarted(): Promise<string> {
  const url = `http://localhost:${DEFAULT_PORT}`;
  if (isDev) {
    // In dev, Next runs separately (started by npm script). Just wait for it.
    await waitForPort(DEFAULT_PORT);
    return url;
  }

  // In production, start the standalone Next server bundled in .next/standalone
  const serverEntry = getStandaloneServerEntry();
  if (!serverEntry) {
    throw new Error('Could not find Next standalone server entry. Did you run "next build"?');
  }

  // If already started, just return
  if (nextProdServerProcess && !nextProdServerProcess.killed) {
    await waitForPort(DEFAULT_PORT);
    return url;
  }

  const cwd = path.dirname(serverEntry);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PORT: String(DEFAULT_PORT),
    NODE_ENV: 'production',
  };
  nextProdServerProcess = spawn(process.execPath, [serverEntry], {
    cwd,
    env,
    stdio: 'ignore',
    detached: false,
  });

  // Give it time to boot
  await waitForPort(DEFAULT_PORT);
  return url;
}

async function createMainWindow() {
  const startUrl = await ensureNextServerStarted();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: isDev,
    },
  });

  await mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createMainWindow().catch((err) => {
    console.error(err);
    app.quit();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow().catch((err) => {
      console.error(err);
      app.quit();
    });
  }
});

app.on('before-quit', () => {
  if (nextProdServerProcess && !nextProdServerProcess.killed) {
    try { nextProdServerProcess.kill(); } catch {}
  }
});


