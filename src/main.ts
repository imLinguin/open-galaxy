import { app, BrowserWindow, ipcMain } from "electron";

app.setName("open-galaxy");

import { MessageToClient } from "./types";
import { createDefaultConfigs } from "./utils/settings";
import windows from "./windows";
import auth from "./api/auth";
import presence from "./api/presence";
import gamesMeta from "./api/gamesMeta";
import library from "./api/library";
import user from "./api/user";
import axios from "axios";

let mainWindow: BrowserWindow | null = null;
let presenceHeartBeat = null;

const init = async () => {
  // Init application
  createDefaultConfigs();
  const credentials = await auth.getCredentials();
  if (!credentials) {
    // Not logged in
    windows.spawnLoginWindow();
    return;
  }
  mainWindow = windows.spawnMainWindow();
};

app.once("ready", () => {
  init();
});

app.on("before-quit", () => {
  console.log("Running before quit handlers");
  presence.deletePresence();
});

ipcMain.on("sendToClient", async (event, message: string) => {
  const parsed: MessageToClient = JSON.parse(message);
  const window = windows.get(parsed.Arguments?.WindowName) ?? mainWindow;
  const credentials = await auth.getCredentials();

  switch (parsed.Command) {
    case "Log":
      console.log(
        parsed.Arguments.logLevel,
        parsed.Arguments.message.slice(
          0,
          Math.min(parsed.Arguments.message.length - 1, 200)
        )
      );
      break;
    case "ExitGalaxyClient":
      app.exit(0);
      break;
    case "TitleBarButtonClicked":
      switch (parsed.Arguments.ButtonId) {
        case "close":
          window.close();
          if (window !== mainWindow) {
            mainWindow.webContents.send(
              "callback",
              JSON.stringify({
                Command: "BrowserDestroyed",
                Arguments: { WindowId: parsed.Arguments.WindowName },
              })
            );
          }
          break;
        case "minimize":
          window.minimize();
          break;
        case "maximize":
          window.isMaximized() ? window.unmaximize() : window.maximize();
          break;
        default:
          console.log("unknown button id", parsed.Arguments.ButtonId);
      }
      break;
    case "LoginSuccess":
      auth.finishLogin(parsed.Arguments.AuthorizationCode).finally(() => {
        windows.get("login")?.close();
        init();
      });
      break;
    case "ConnectToGOG":
      console.log("Connect to GOG");
      library.importGOG();
      mainWindow.webContents.send(
        "callback",
        JSON.stringify({
          Command: "SetOnlineState",
          Arguments: {
            AccessToken: credentials.access_token,
          },
        })
      );
      break;
    case "MetricsEvent":
      console.log("Ignoring tracking events");
      break;
    case "SetPresenceStatus":
      const status = parsed.Arguments?.presence ?? "online";
      presence.setPresence(status);
      if (presenceHeartBeat) clearInterval(presenceHeartBeat);
      presenceHeartBeat = setInterval(() => {
        presence.setPresence(status);
        if (mainWindow) {
          mainWindow.webContents.send(
            "callback",
            JSON.stringify({
              Command: "UpdatedPresenceStatus",
              Arguments: {
                presence: status,
              },
            })
          );
        }
      }, 5 * 60 * 1000);

      break;
    case "GetGamesPieces":
      const games: string[] = parsed.Arguments.gameReleaseKeys;
      const ids: string[] = parsed.Arguments.pieceIds;
      const libraryEntries = library.getParsedConfigEntries();

      while (games.length > 0) {
        let dataToReturn = {};
        const chunk = games.splice(0, 10);

        const pieces = await Promise.all(
          chunk.map((game) => {
            const libEntry = libraryEntries.find(
              (entry) => game === `${entry.platform_id}_${entry.external_id}`
            );

            return library.getGamesPiece(game, ids, libEntry);
          })
        );

        pieces.forEach((piece) => {
          dataToReturn = { ...piece, ...dataToReturn };
        });

        mainWindow.webContents.send(
          "callback",
          JSON.stringify({
            Command: "GamesPiecesData",
            Arguments: { ...dataToReturn },
          })
        );
      }

      break;
    case "Fetch":
      const url = new URL(`https://api.gog.com/${parsed.Arguments.query}`);
      const params = parsed.Arguments.queryParams;
      for (const key in Object.keys(params)) {
        url.searchParams.set(key, params[key]);
      }
      const res = await axios.get(url.toString());

      const Arguments = {
        requestId: parsed.Arguments.requestId,
        responseStatus: { status: res.status },
        response: { ...res.data },
      };
      const payload = JSON.stringify({
        Command: "Fetch",
        Arguments,
      });

      mainWindow.webContents.send("callback", payload);

      break;
    default:
      console.warn("Unhandled command", parsed);
      break;
  }
});

ipcMain.handle("user.getUserInfo", user.getUserInfo);
ipcMain.handle("library.getOwnedReleaseKeys", library.importGOG);
