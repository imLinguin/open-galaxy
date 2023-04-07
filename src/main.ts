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
                Command: "closed",
                Arguments: { windowName: parsed.Arguments.WindowName },
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
      const credentials = await auth.getCredentials();
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
      }, 5 * 60 * 1000);

      break;
    case "GetGamesPieces":
      const games: string[] = parsed.Arguments.gameReleaseKeys.map((game) =>
        game.split("_").pop()
      );

      const ids: string[] = parsed.Arguments.pieceIds;
      const ratings = ids.includes("reviewScore")
        ? await Promise.allSettled([
            ...games.map((id) => gamesMeta.getReviewScore(id)),
          ])
        : [];
      const gamesData = await Promise.allSettled(
        games.map((id) =>
          Promise.all([gamesMeta.getProductsApi(id), gamesMeta.storeApi(id)])
        )
      );
      const dataToReturn = parsed.Arguments.gameReleaseKeys.reduce(
        (prev, key, index) => {
          const result = gamesData[index];
          if (result.status === "fulfilled") {
            const data = result.value;

            prev[key] = ids.reduce((p, id) => {
              switch (id) {
                case "title":
                  p[id] = data[0].title;
                  break;
                case "localizations":
                  p[id] = data[1]._embedded.localizations;
                  break;
                case "productLinks":
                  p[id] = data[0].links;
                  break;
                case "reviewScore":
                  const rating = ratings[index];
                  if (rating.status === "fulfilled") {
                    p[id] = rating.value.value;
                  }
                  break;
                case "isEarlyAccess":
                  p[id] = data[0].in_development.active;
                  break;
                case "isPreorder":
                  p[id] = data[0].is_preorder;
                  break;
                case "storeOsCompatibility":
                  p[id] = data[1]._embedded.supportedOperatingSystems.map(
                    (os) => os.operatingSystem.name
                  );
                  break;
                case "storeFeatures":
                  p[id] = data[1]._embedded.features;
                  break;
                // storeFeatures: undefined,
                // storeMedia: undefined,
                // storeOsCompatibility: undefined,
                // storeTags: undefined,
              }
              return p;
            }, {});
          }
          return prev;
        },
        {}
      );

      mainWindow.webContents.send(
        "callback",
        JSON.stringify({
          Command: "GamesPiecesData",
          Arguments: { ...dataToReturn },
        })
      );
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
