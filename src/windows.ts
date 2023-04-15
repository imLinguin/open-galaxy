import path from "node:path";
import { BrowserWindow, shell } from "electron";
import { getInitSettings } from "./utils/settings";

const spawnMainWindow = (initiallyShowed: boolean = false): BrowserWindow => {
  const mainWindow = new BrowserWindow({
    icon: path.join(
      __dirname,
      "..",
      "web",
      "images",
      "gogGalaxyLogo",
      "gog-galaxy-logo-72px.png"
    ),
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

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL + "/main.html");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "web", "main.html"));
  }

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

const spawnLoginWindow = (): BrowserWindow => {
  const window = new BrowserWindow({
    height: 700,
    frame: false,
    width: 400,
    maximizable: false,
    backgroundColor: "black",
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      preload: path.join(__dirname, "preloads", "login.js"),
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL + "/login.html");
  } else {
    window.loadFile(path.join(__dirname, "..", "web", "login.html"));
  }
  return window;
};

const get = (key?: string): BrowserWindow | undefined =>
  BrowserWindow.getAllWindows().find((window) =>
    window.webContents.getURL().endsWith((key || "main") + ".html")
  );

export default { get, spawnLoginWindow, spawnMainWindow };
