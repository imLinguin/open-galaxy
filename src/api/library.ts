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
import gamesMeta from "./gamesMeta";

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

  const library = await fetchGalaxyLibrary(credentials);

  const ownedKeys = library.map(
    (game) => `${game.platform_id}_${game.external_id}`
  );

  return ownedKeys;
};

const getGamesPiece = async (
  id: string,
  ids: string[],
  libEntry?: GalaxyLibraryEntry
): Promise<any> => {
  const [platform_id, external_id] = id.split("_");

  const response = {};
  // TODO: Support my values
  if (libEntry) {
    const gamesdbData = await fetchOrUpdateGamesDb(
      platform_id,
      external_id,
      libEntry?.certificate
    );
    ids.forEach((id) => {
      switch (id) {
        case "addedToLibraryDates":
          response[id] = {
            purchaseTimestamp: libEntry.owned_since,
            addedTimestamp: libEntry.date_created,
          };
          break;
        case "installationDate":
          response[id] = { timestamp: null };
          break;

        case "isVisibleInLibrary":
          response[id] = {
            isVisibleInLibrary:
              gamesdbData.game.type === "game" &&
              gamesdbData.game.visible_in_library,
          };
          break;

        case "meta":
          response[id] = {
            releaseDate: { timestamp: gamesdbData.game.first_release_date },
            developers: gamesdbData.game.developers.map((dev) => dev.name),
            publishers: gamesdbData.game.publishers.map((pub) => pub.name),
            themes: gamesdbData.game.themes.map((theme) => theme.name["*"]),
            genres: gamesdbData.game.genres.map((genre) => genre.name["*"]),
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
          response[id] = { tags: [] };
          break;
        case "osCompatibility":
          response[id] = {
            supported: gamesdbData.supported_operating_systems,
          };
          break;
        case "title":
          response[id] = { title: gamesdbData.title["*"] };
          break;

        case "sortingTitle":
          response[id] = { title: gamesdbData.sorting_title["*"] };
          break;

        case "isDlc":
          response[id] = { isDlc: gamesdbData.type === "dlc" };
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
          response[id] = { target: gamesdbData.game_id };
          break;

        case "platform":
          response[id] = { platformId: platform_id };
          break;

        case "subscriptions":
          response[id] = { subscriptions: [] };
          break;
        case "allGameReleases":
          response[id] = { releases: gamesdbData.game.releases };
          break;
        case "availableOperations":
          response[id] = { availableOperations: ["install"] }; // TODO: react to available operations
          break;
        case "myFriendsActivity":
          response[id] = { myFriendsActivity: [] };
          break;
        case "images":
          response[id] = {
            background: gamesdbData.game.background?.url_format
              .replace("{formatter}", "")
              .replace("{ext}", "webp"),
            verticalCover: gamesdbData.game.vertical_cover?.url_format
              .replace("{formatter}", "")
              .replace("{ext}", "webp"),
            squareIcon: gamesdbData.game.square_icon?.url_format
              .replace("{formatter}", "")
              .replace("{ext}", "webp"),
            logo: gamesdbData.logo?.url_format
              .replace("{formatter}", "")
              .replace("{ext}", "webp"),
            screenshots: gamesdbData.game.screenshots,
            videos: gamesdbData.game.videos,
          };
          break;
      }
    });
  }
  if (platform_id === "gog") {
    const storeApiData = await gamesMeta.storeApi(external_id);

    if (storeApiData)
      ids.forEach((id) => {
        switch (id) {
          case "isEarlyAccess":
            response[id] = storeApiData.inDevelopment.active;
            break;
          case "isPreorder":
            response[id] = storeApiData._embedded.isPreorder;
            break;
          case "localizations":
            const perLanguageScopes =
              storeApiData._embedded.localizations.reduce((val, lang) => {
                const code = lang._embedded.language.code;
                const scope = lang._embedded.localizationScope.type;
                if (!val[code]) {
                  val[code] = [];
                }

                if (!val[code].includes(scope)) {
                  val[code].push(scope);
                }

                return val;
              }, {});

            response[id] = {
              localizations: Object.keys(perLanguageScopes).map((lang) => ({
                language: lang,
                scopes: perLanguageScopes[lang],
              })),
            };

            break;
          case "productLinks":
            response[id] = Object.keys(storeApiData._links).reduce(
              (prev, next) => {
                prev[next] = storeApiData._links[next].href;
                return prev;
              },
              {}
            );

            response[id] = { ...response[id], productCard: response[id].store };
            break;
          case "reviewScore":
            response[id] = { score: null };
            break;
          case "storeFeatures":
            response[id] = { features: storeApiData._embedded.features };
            break;
          case "storeMedia":
            response[id] = {
              videos: storeApiData._embedded.videos,
              screenshots: storeApiData._embedded.screenshots.map(
                (screen) => screen._links.self.href
              ),
              isFromProductsApi: true,
            };
            break;
          case "storeOsCompatibility":
            response[id] = storeApiData._embedded.supportedOperatingSystems.map(
              (supported) => supported.operatingSystem
            );
            break;
          case "storeTags":
            response[id] = { tags: storeApiData._embedded.properties };
            break;
        }
      });
  }

  const data = {};
  data[id] = response;
  return data;
};

export default {
  importGOG,
  getParsedConfigEntries,
  getGamesPiece,
};
