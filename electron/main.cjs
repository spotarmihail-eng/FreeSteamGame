const { app, BrowserWindow, shell } = require("electron");

const APP_URL = "https://spotarmihail-eng.github.io/FreeSteamGame/";
const ALLOWED_HOSTS = [
  "spotarmihail-eng.github.io",
  "discord.com",
  "discordapp.com",
];
const isAllowedHost = (hostname) =>
  ALLOWED_HOSTS.includes(hostname) || hostname.endsWith(".supabase.co");

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 900,
    minHeight: 640,
    title: "Free Steam Game",
    autoHideMenuBar: true,
    backgroundColor: "#090810",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, navigationUrl) => {
    let target;
    try {
      target = new URL(navigationUrl);
    } catch {
      event.preventDefault();
      return;
    }

    if (target.protocol !== "https:" || !isAllowedHost(target.hostname)) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  window.loadURL(APP_URL);
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
