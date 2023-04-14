import axios from "axios";
import {
  GOGCredential,
  GalaxyLibraryEntry,
  GamesDBData,
  OpenGalaxyLibraryConfig,
} from "../types";
import auth from "./auth";
import path from "path";
import { CONFIG_PATH } from "../constants";
import { existsSync, readFileSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import windows from "../windows";

const galaxy_library_config_path = path.join(
  CONFIG_PATH,
  "galaxy-library.json"
);
let parsedConfig: OpenGalaxyLibraryConfig = {};

const getParsedConfigEntries = (): GalaxyLibraryEntry[] => {
  parsedConfig = JSON.parse(
    readFileSync(galaxy_library_config_path, { encoding: "utf-8" })
  );

  return parsedConfig.items;
};
/**
 * Used to obtain library from galaxy-library endpoint.
 * Doesn't include any data apart from platform and game ids
 */
const fetchGalaxyLibrary = async (
  credentials: GOGCredential
): Promise<GalaxyLibraryEntry[]> => {
  if (existsSync(galaxy_library_config_path)) {
    try {
      parsedConfig = JSON.parse(
        await readFile(galaxy_library_config_path, { encoding: "utf-8" })
      );
    } catch {
      console.error("Failed to read galaxy lib config");
    }
  }

  const res = await axios.get(
    `https://galaxy-library.gog.com/users/${credentials.user_id}/releases`,
    {
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        "If-None-Match": parsedConfig?.etag,
      },
      validateStatus: (status) => [200, 304].includes(status),
    }
  );

  if (res.status === 200) {
    // Update config
    parsedConfig.items = res.data.items;
    parsedConfig.etag = res.headers.etag;
    await writeFile(galaxy_library_config_path, JSON.stringify(parsedConfig), {
      encoding: "utf-8",
    });
  }

  return res.status === 200 ? res.data.items : parsedConfig?.items;
};

const fetchOrUpdateGamesDb = async (
  platform: string,
  id: string,
  libraryCert?: string
): Promise<GamesDBData | null> => {
  const res = await axios
    .get(
      `https://gamesdb.gog.com/platforms/${platform}/external_releases/${id}`,
      {
        headers: {
          "X-GOG-Library-Cert": libraryCert,
        },
      }
    )
    .catch((err) => {
      return null;
    });
  if (!res?.data) {
    return null;
  }
  return res?.data;
};

const importGOG = async () => {
  const credentials = await auth.getCredentials();
  const mainWindow = windows.get("main");

  const library = await fetchGalaxyLibrary(credentials);

  const ownedKeys = library.map(
    (game) => `${game.platform_id}_${game.external_id}`
  );

  if (mainWindow) {
    mainWindow.webContents.send(
      "callback",
      JSON.stringify({
        Command: "OwnedGameReleaseKeys",
        Arguments: {
          UpdateType: "set",
          GameReleaseKeys: ownedKeys,
        },
      })
    );
  }

  return ownedKeys;
};

const getGamesPiece = async (
  id: string,
  ids: string[],
  libEntry?: GalaxyLibraryEntry
): Promise<any> => {
  const [platform_id, external_id] = id.split("_");
  const gamesdbData = await fetchOrUpdateGamesDb(
    platform_id,
    external_id,
    libEntry?.certificate
  );
  const response = {};
  // TODO: Support my values
  ids.forEach((id) => {
    switch (id) {
      case "addedToLibraryDates":
        response[id] = {
          purchaseTimestamp: libEntry.owned_since,
          addedTimestamp: libEntry.date_created,
        };
        break;
      case "installationDate":
        response[id] = null;
        break;

      case "isVisibleInLibrary":
        response[id] = gamesdbData.game.visible_in_library;
        break;

      case "meta":
        response[id] = {
          releaseDate: gamesdbData.game.first_release_date,
          developers: gamesdbData.game.developers,
          publishers: gamesdbData.game.publishers,
          themes: gamesdbData.game.themes,
          genres: gamesdbData.game.genres,
          releases: gamesdbData.game.releases,
          criticsScore: gamesdbData.game.aggregated_rating,
        };
        break;

      case "myIsHidden":
        response[id] = false;
        break;

      case "myPlayTime":
        response[id] = false;
        break;

      case "myTags":
        response[id] = {tags:[]};
        break;
      case "osCompatibility":
        response[id] = gamesdbData.supported_operating_systems;
        break;
      case "title":
        response[id] = gamesdbData.title["*"];
        break;

      case "sortingTitle":
        response[id] = gamesdbData.sorting_title["*"];
        break;

      case "isDlc":
        response[id] = gamesdbData.type === "dlc";
        break;

      case "localState":
        response[id] = "none";
        break;

      case "myAchievementsCount":
        response[id] = 0;
        break;

      case "myLastPlayedDate":
        response[id] = null;
        break;

      case "myRating":
        response[id] = null;
        break;

      case "originalGameLink":
        response[id] = null;
        break;

      case "platform":
        response[id] = {};
        break;

      case "subscriptions":
        response[id] = [];
        break;
      case "images":
        response[id] = {
          background: gamesdbData.game.background?.url_format,
          verticalCover: gamesdbData.game.vertical_cover?.url_format,
          icon: gamesdbData.game.square_icon?.url_format,
          logo: gamesdbData.logo?.url_format,
        };
        break;
      default:
        console.log(`Unuspported pieceId: ${id}`);
        break;
    }
  });

  const data = {};
  data[id] = response;
  return data;
};

export default {
  importGOG,
  getParsedConfigEntries,
  getGamesPiece,
};
