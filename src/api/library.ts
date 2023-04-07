import axios from "axios";
import {
  GOGCredential,
  GalaxyLibraryEntry,
  GamesDBData,
  OpenGalaxyLibraryConfig,
} from "../types";
import auth from "./auth";
import path, { parse } from "path";
import { CONFIG_PATH } from "../constants";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";

const galaxy_library_config_path = path.join(
  CONFIG_PATH,
  "galaxy-library.json"
);
/**
 * Used to obtain library from galaxy-library endpoint.
 * Doesn't include any data apart from platform and game ids
 */
const fetchGalaxyLibrary = async (
  credentials: GOGCredential
): Promise<GalaxyLibraryEntry[]> => {
  let parsedConfig: OpenGalaxyLibraryConfig = {};
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
  libraryCert?: string,
  access_token?: string
): Promise<GamesDBData | null> => {
  const res = await axios
    .get(
      `https://gamesdb.gog.com/platforms/${platform}/external_releases/${id}`,
      {
        headers: {
          "X-GOG-Library-Cert": libraryCert,
          Authorization: `Bearer ${access_token}`,
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

const processEntry = async (
  { platform_id, external_id, certificate }: GalaxyLibraryEntry,
  credentials: GOGCredential
) => {
  const game = await fetchOrUpdateGamesDb(
    platform_id,
    external_id,
    certificate,
    credentials.access_token
  );
  if (game === null && game.type !== "game") {
    console.warn(
      `Unable to process game ${platform_id} ${external_id}, ${game === null} ${
        game.type
      }`
    );
    return;
  }
};

const importGOG = async () => {
  const credentials = await auth.getCredentials();

  const library = await fetchGalaxyLibrary(credentials);

  await Promise.all(library.map((game) => processEntry(game, credentials)));
};

export default { importGOG };
