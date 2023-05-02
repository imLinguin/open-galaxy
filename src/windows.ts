import path from "node:path";
import { BrowserWindow, app, screen, shell } from "electron";
import { getInitSettings } from "./utils/settings";

const spawnMainWindow = (initiallyShowed: boolean = false): BrowserWindow => {
  const mainWindow = new BrowserWindow({
    icon: path.join(__dirname, "..", "assets", "icon.png"),
    width: 1550,
    height: 750,
    frame: false,
    show: initiallyShowed,
    paintWhenInitiallyHidden: true,
    backgroundColor: "black",
    fullscreenable: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      preload: path.join(__dirname, "preloads", "main.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "..", "web", "main.html"));

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.openDevTools({
      mode: "detach",
    });
    mainWindow.webContents.send(
      "callback",
      JSON.stringify({
        Command: "SetTrayState",
        Arguments: { state: "notMinimizedToTray" },
      })
    );
    mainWindow.webContents.send(
      "callback",
      JSON.stringify({
        Command: "SetInternetConnectivityState",
        Arguments: { State: true }, // TODO: Actually get connectivity state, and update it later on
      })
    );
    mainWindow.webContents.send(
      "callback",
      JSON.stringify({
        Command: "Initialize",
        Arguments: { ...getInitSettings() },
      })
    );
    mainWindow.webContents.send(
      "callback",
      JSON.stringify({
        Command: "PluginsDetails",
        Arguments: { availablePlugins: [] },
      })
    );
  });

  mainWindow.on("closed", () => app.quit());
  mainWindow.webContents.setWindowOpenHandler(({ url, features }) => {
    console.log("spawning window", url, features);
    if (url.startsWith("https")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        frame: false,
        fullscreenable: false,
        center: true,
        backgroundColor: "black",
        webPreferences: {
          contextIsolation: false,
          nodeIntegration: false,
          preload: path.join(__dirname, "preloads", "main.js"),
        },
      },
    };
  });

  return mainWindow;
};

const spawnNotificationWindow = (): BrowserWindow => {
  const display = screen.getPrimaryDisplay().workAreaSize;
  const window = new BrowserWindow({
    height: 200,
    width: 500,
    x: display.width - 200,
    y: display.height - 500,
    skipTaskbar: true,
    resizable: false,
    frame: false,
    transparent: true,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      preload: path.join(__dirname, "preloads", "notifications.js"),
    },
  });
  window.loadFile(path.join(__dirname, "..", "web", "notifications.html"));

  return window;
};

const spawnLoginWindow = (): BrowserWindow => {
  const window = new BrowserWindow({
    height: 700,
    frame: false,
    width: 400,
    maximizable: false,
    alwaysOnTop: true,
    backgroundColor: "black",
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      preload: path.join(__dirname, "preloads", "login.js"),
    },
  });

  window.loadFile(path.join(__dirname, "..", "web", "login.html"));

  return window;
};

const get = (key?: string): BrowserWindow | undefined =>
  BrowserWindow.getAllWindows().find((window) =>
    window.webContents.getURL().endsWith((key || "main") + ".html")
  );

export default {
  get,
  spawnLoginWindow,
  spawnMainWindow,
  spawnNotificationWindow,
};
